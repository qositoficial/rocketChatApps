import {
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

export default class ProcessMessages {
    public static async processData(
        eventType: string,
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
                // not a visitor
                return;
            }

            let messageAsObject = {};
            let userEmail: string;
            let userName: string;
            let userPhone: string;

            // message identification
            messageAsObject["_id"] = message.id;
            messageAsObject["messageText"] = message.text;
            messageAsObject["updatedAt"] = message.updatedAt;

            // visitor email
            if (
                message.sender.emails &&
                message.sender.emails[0] &&
                message.sender.emails[0].address
            ) {
                userEmail = message.sender.emails[0].address;
            } else {
                userEmail = "";
            }
            // visitor username
            if (
                room.visitor.livechatData &&
                room.visitor.livechatData.username
            ) {
                userName = room.visitor.livechatData.username;
            } else {
                userName = "";
            }
            // visitor phone
            if (
                livechatRoom.visitor.phone &&
                livechatRoom.visitor.phone[0] &&
                livechatRoom.visitor.phone[0].phoneNumber
            ) {
                userPhone = livechatRoom.visitor.phone[0].phoneNumber;
            } else {
                userPhone = "";
            }

            // store visitor data
            messageAsObject["visitor"] = {
                _id: message.sender.id,
                username: userName,
                name: message.sender.name,
                email: userEmail,
                phone: userPhone,
                userType: message.sender.type,
            };

            // if bot or app message, store agent data
            if (
                message.sender.type === UserType.USER ||
                message.sender.type === UserType.BOT ||
                message.sender.type === UserType.APP
            ) {
                messageAsObject["agent"] = {
                    _id: message.sender.id,
                    username: message.sender.username,
                    name: message.sender.name,
                    userType: message.sender.type,
                };
            }

            // Handle messages with attachments
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

            // load room messages
            roomMessages = await read
                .getPersistenceReader()
                .readByAssociation(roomPersisAss);

            // add new message to the room
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

        // retrieve messages
        let roomMessagesArray: Array<any> = [];
        roomMessages = await read
            .getPersistenceReader()
            .readByAssociation(roomPersisAss);

        if (roomMessages && roomMessages[0] && roomMessages[0]["messages"]) {
            roomMessagesArray = roomMessages[0]["messages"];
        }

        // prepare data object
        data = {
            _id: livechatRoom.id,
            type: eventType,
            messages: roomMessagesArray,
            tags: fullRoomInfo._unmappedProperties_?.tags || undefined,
        };

        // Agent definitions
        const servedBy = livechatRoom.servedBy;

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

        // Visitor definitions
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

        // return data
        return data;
    }
}
