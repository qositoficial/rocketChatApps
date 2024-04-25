import {
    IHttp,
    ILogger,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ILivechatMessage,
    ILivechatRoom,
} from "@rocket.chat/apps-engine/definition/livechat";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { UserType } from "@rocket.chat/apps-engine/definition/users";

export default class ProcessDataService {
    public static async GetUser(
        userType: string,
        room: ILivechatRoom,
        logger: ILogger
    ): Promise<any> {
        let usersAsObject = {};
        let userEmail: string;
        let userName: string;
        let userPhone: string;

        usersAsObject["_id"] = room.id;
        usersAsObject["updatedAt"] = room.updatedAt;

        if (userType === "visitor") {
            if (
                room.visitor.visitorEmails &&
                room.visitor.visitorEmails[0] &&
                room.visitor.visitorEmails[0].address
            ) {
                userEmail = room.visitor.visitorEmails[0].address;
            } else {
                userEmail = "";
            }

            if (
                room.visitor.livechatData &&
                room.visitor.livechatData.username
            ) {
                userName = room.visitor.livechatData.username;
            } else {
                userName = "";
            }

            if (
                room.visitor.phone &&
                room.visitor.phone[0] &&
                room.visitor.phone[0].phoneNumber
            ) {
                userPhone = room.visitor.phone[0].phoneNumber;
            } else {
                userPhone = "";
            }

            usersAsObject["fullUserData"] = {
                _id: room.visitor.id,
                username: userName,
                name: room.visitor.name,
                email: userEmail,
                phone: userPhone,
                userType: "visitor",
            };

            if (logger) {
                logger.debug(
                    `ProcessData.ts - GetUser() - ${JSON.stringify(
                        usersAsObject
                    )}`
                );
            }

            return usersAsObject;
        }
    }
    public static async ProcessData(
        eventType: string,
        http: IHttp,
        read: IRead,
        persistence: IPersistence,
        room: ILivechatRoom,
        message: ILivechatMessage,
        logger: ILogger
    ): Promise<any> {
        let data: any = undefined;
        let roomMessages: any;

        const livechatRoom = room as ILivechatRoom;
        const fullRoomInfo = JSON.parse(JSON.stringify(livechatRoom));

        const roomPersisAss = new RocketChatAssociationRecord(
            RocketChatAssociationModel.ROOM,
            livechatRoom.id
        );

        if (eventType === "Message" && message) {
            if (!livechatRoom.visitor) {
                // encerra se não identificar visitante
                return;
            }

            let messageAsObject = {};
            let userEmail: string;
            let userName: string;
            let userPhone: string;

            // identificação da mensagem
            messageAsObject["_id"] = message.id;
            messageAsObject["messageText"] = message.text;
            messageAsObject["updatedAt"] = message.updatedAt;

            // atribuição do email do visitante
            if (
                message.sender.emails &&
                message.sender.emails[0] &&
                message.sender.emails[0].address
            ) {
                userEmail = message.sender.emails[0].address;
            } else {
                userEmail = "";
            }
            // atribuição do username do visitante
            if (
                room.visitor.livechatData &&
                room.visitor.livechatData.username
            ) {
                userName = room.visitor.livechatData.username;
            } else {
                userName = "";
            }
            // atribuição do telefone do visitante
            if (
                livechatRoom.visitor.phone &&
                livechatRoom.visitor.phone[0] &&
                livechatRoom.visitor.phone[0].phoneNumber
            ) {
                userPhone = livechatRoom.visitor.phone[0].phoneNumber;
            } else {
                userPhone = "";
            }

            // armazenar dados do visitante
            messageAsObject["visitor"] = {
                _id: message.sender.id,
                username: userName,
                name: message.sender.name,
                email: userEmail,
                phone: userPhone,
                userType: message.sender.type,
            };

            // se a mensagem for automática, atribuir os dados à um agente
            if (
                message.sender.type === UserType.USER ||
                message.sender.type === UserType.BOT ||
                message.sender.type === UserType.APP
            ) {
                messageAsObject["agent"] = {
                    _id: message.sender.id,
                    username: userName,
                    name: message.sender.name,
                    userType: message.sender.type,
                };
            }

            // Tratar mensagens com anexos
            if (message.attachments) {
                const serverUrl = await read
                    .getEnvironmentReader()
                    .getServerSettings()
                    .getValueById("Site_Url");
                let fileType = "application/octet-stream";

                let attachUrl =
                    message.attachments[0].imageUrl ||
                    message.attachments[0].audioUrl ||
                    message.attachments[0].videoUrl ||
                    message.attachments[0]!.title!.link!;

                if (attachUrl.indexOf("http") != 0) {
                    attachUrl = `${serverUrl + attachUrl}`;
                }
                messageAsObject["file"] = {
                    type: message.file?.type,
                    name: message.attachments[0].title?.value,
                };

                messageAsObject["fileUpload"] = {
                    publicFilePath: attachUrl,
                };
            }

            // carregar mensagens da sala
            roomMessages = await read
                .getPersistenceReader()
                .readByAssociation(roomPersisAss);

            // inclui nova mensagem na sala
            let newMessage = {};
            if (
                !roomMessages ||
                !roomMessages[0] ||
                !roomMessages[0]["messages"]
            ) {
                newMessage = {
                    messages: [messageAsObject],
                };
            } else {
                const rMsg = roomMessages[0]["messages"];
                newMessage = {
                    messages: [...rMsg, messageAsObject],
                };
            }

            const roomPersis = persistence.updateByAssociation(
                roomPersisAss,
                newMessage,
                true
            );
        }

        // recupera mensagens
        let roomMessagesArray: Array<any> = [];
        roomMessages = await read
            .getPersistenceReader()
            .readByAssociation(roomPersisAss);

        if (roomMessages && roomMessages[0] && roomMessages[0]["messages"]) {
            roomMessagesArray = roomMessages[0]["messages"];
        }

        // prepara objeto data
        data = {
            _id: livechatRoom.id,
            type: eventType,
            messages: roomMessagesArray,
            tags: fullRoomInfo._unmappedProperties_?.tags || undefined,
        };

        // Definições de agente
        const servedBy = livechatRoom.servedBy;
        logger.debug("Debug - " + JSON.stringify(livechatRoom.servedBy));
        logger.debug(
            "Debug - " + JSON.stringify(fullRoomInfo._unmappedProperties_?.tags)
        );

        let mailAddress = "";
        if (
            servedBy &&
            servedBy.emails &&
            servedBy.emails[0] &&
            servedBy.emails[0].address
        ) {
            mailAddress = servedBy.emails[0].address || "";
        }

        if (servedBy) {
            data = {
                ...data,
                agent: {
                    _id: servedBy.id || "",
                    name: servedBy.name || "",
                    username: servedBy.username || "",
                    email: mailAddress,
                    UserType: servedBy.type || "",
                },
            };
        }

        // definições de visitante
        const liveVisitor = livechatRoom.visitor;

        if (!liveVisitor) {
            return;
        }

        data = {
            ...data,
            visitor: liveVisitor || {},
            departmentName: livechatRoom.department?.name,
        };

        if (
            data.visitor &&
            data.visitor.visitorEmails &&
            data.visitor.visitorEmails[0] &&
            data.visitor.visitorEmails[0].address
        ) {
            data.visitor = {
                ...data.visitor,
                email: data.visitor.visitorEmails[0].address,
            };
        }

        if (
            data.visitor &&
            data.visitor.livechat &&
            data.visitor.livechat.username
        ) {
            data.visitor = {
                ...data.visitor,
                username: data.visitor.livechatData.username,
            };
        }

        if (
            data.visitor &&
            data.visitor.phone &&
            data.visitor.phone[0] &&
            data.visitor.phone[0].phoneNumber
        ) {
            data.visitor = {
                ...data.visitor,
                phone: data.visitor.phone[0].phoneNumber,
            };
        }

        return data;
    }
}
