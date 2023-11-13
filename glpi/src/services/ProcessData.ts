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
import { userInfo } from "os";

export default class ProcessDataService {
    public static async ProcessData(
        eventType: string,
        read: IRead,
        persistence: IPersistence,
        room: ILivechatRoom,
        message?: ILivechatMessage,
        logger?: ILogger
    ) {
        if (logger) {
            // logger.debug("ProcessData 1");
        }

        let data: any = undefined;
        let roomMessages: any;
        const livechatRoom = room as ILivechatRoom;
        const fullRoomInfo = JSON.parse(JSON.stringify(livechatRoom));

        if (logger) {
            // logger.debug("ProcessData 2");
        }

        const roomPersisAss = new RocketChatAssociationRecord(
            RocketChatAssociationModel.ROOM,
            livechatRoom.id
        );
        if (logger) {
            // logger.debug("ProcessData 3");
        }

        if (eventType === "Message" && message) {
            if (!livechatRoom.visitor) {
                // no visitor identified
                return;
            }

            let messageAsObject = {};
            let userEmail;
            let userPhone;

            messageAsObject["_id"] = message.id;
            messageAsObject["messageText"] = message.text;
            messageAsObject["updatedAt"] = message.updatedAt;
            if (
                message.sender.emails &&
                message.sender.emails[0] &&
                message.sender.emails[0].address
            ) {
                userEmail = message.sender.emails[0].address;
            } else {
                userEmail = "";
            }
            if (
                livechatRoom.visitor.phone &&
                livechatRoom.visitor.phone[0] &&
                livechatRoom.visitor.phone[0].phoneNumber
            ) {
                userPhone = livechatRoom.visitor.phone[0].phoneNumber;
            } else {
                userPhone = "";
            }

            messageAsObject["fullUserData"] = {
                _id: message.sender.id,
                username: message.sender.username,
                name: message.sender.name,
                email: userEmail,
                phone: userPhone,
                userType: message.sender.type,
            };

            if (
                message.sender.type === UserType.USER ||
                message.sender.type === UserType.BOT ||
                message.sender.type === UserType.APP
            ) {
                messageAsObject["fullAgentData"] = {
                    _id: message.sender.id,
                    username: message.sender.username,
                    name: message.sender.name,
                    userType: message.sender.type,
                };
            }

            if (logger) {
                // logger.debug("ProcessData 4");
            }

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

                if (message.attachments[0].title?.value?.match(/.png$/gi)) {
                    fileType = "image/png";
                } else if (
                    message.attachments[0].title?.value?.match(
                        /\.(jpg|jpeg)$/gi
                    )
                ) {
                    fileType = "image/jpeg";
                } else if (
                    message.attachments[0].title?.value?.match(/\.gif$/gi)
                ) {
                    fileType = "image/giv";
                } else if (
                    message.attachments[0].title?.value?.match(/\.ogg$/gi)
                ) {
                    fileType = "audio/ogg";
                } else if (
                    message.attachments[0].title?.value?.match(/\.mp3$/gi)
                ) {
                    // Note, Zenvia API is not compatible right now with audio/mp3, so, let's use audio/mp4
                    fileType = "audio/mp4";
                } else if (
                    message.attachments[0].title?.value?.match(/\.wav$/gi)
                ) {
                    fileType = "audio/wav";
                } else if (
                    message.attachments[0].title?.value?.match(/\.mp4$/gi)
                ) {
                    fileType = "video/mp4";
                } else if (
                    message.attachments[0].title?.value?.match(/\.pdf$/gi)
                ) {
                    fileType = "application/pdf";
                }
                messageAsObject["file"] = {
                    type: fileType,
                    name: message.attachments[0].title?.value,
                };

                messageAsObject["fileUpload"] = {
                    publicFilePath: attachUrl,
                };

                if (logger) {
                    // logger.debug("ProcessData 5");
                }
            }

            roomMessages = await read
                .getPersistenceReader()
                .readByAssociation(roomPersisAss);

            if (logger) {
                // logger.debug("ProcessData 6");
            }

            let newMessage = {};
            if (
                !roomMessages ||
                !roomMessages[0] ||
                !roomMessages[0]["Messages"]
            ) {
                newMessage = {
                    messages: [messageAsObject],
                };
            } else {
                const rMsg = roomMessages[0]["Messages"];
                newMessage = {
                    messages: [...rMsg, messageAsObject],
                };
            }
            if (logger) {
                // logger.debug("ProcessData 7");
            }

            const roomPersis = persistence.updateByAssociation(
                roomPersisAss,
                newMessage,
                true
            );
        }
        if (logger) {
            // logger.debug("ProcessData 8");
        }

        // Get messages
        let roomMessagesArray: Array<any> = [];
        roomMessages = await read
            .getPersistenceReader()
            .readByAssociation(roomPersisAss);
        if (logger) {
            // logger.debug("ProcessData 9");
        }

        if (roomMessages && roomMessages[0] && roomMessages[0]["Messages"]) {
            roomMessagesArray = roomMessages[0]["Messages"];
        }
        if (logger) {
            // logger.debug("ProcessData 10");
        }

        data = {
            _id: livechatRoom.id,
            type: eventType,
            messages: roomMessagesArray,
            tags: fullRoomInfo._unmappedProperties_?.tags || undefined,
        };
        if (logger) {
            // logger.debug("ProcessData 11");
        }

        const servedBy = livechatRoom.servedBy;
        if (logger) {
            // logger.debug("ProcessData 12");
        }

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
        if (logger) {
            // logger.debug("ProcessData 13");
        }

        const liveVisitor = livechatRoom.visitor;

        if (!liveVisitor) {
            return;
        }

        data = {
            ...data,
            visitor: liveVisitor || {},
            departmentName: livechatRoom.department?.name,
        };
        if (logger) {
            // logger.debug("ProcessData 14");
        }

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
            data.visitor.phone &&
            data.visitor.phone[0] &&
            data.visitor.phone[0].phoneNumber
        ) {
            data.visitor = {
                ...data.visitor,
                phone: data.visitor.phone[0].phoneNumber,
            };
        }
        if (logger) {
            // logger.debug("ProcessData 15");
        }

        return data;
    }
}
