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

        let messageAsObject = {};
        let userEmail: string;
        let userPhone: string;

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
        /*
        if (logger) {
            logger.debug("ProcessData.ts - Debug 01");
        }
        */
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

        return JSON.stringify(messageAsObject);

        if ((eventType === "Transferred" || eventType === "Closed") && room) {
            return;
            /*
            if (!livechatRoom.visitor) {
                return;
            }
            // data.visitor.phone = livechatRoom.visitor.phone;
            // if (livechatRoom.visitor.customFields) {
            //     data.visitor.username =
            //         livechatRoom.visitor.customFields.username;
            // } else {
            //     data.visitor.username = undefined;
            // }
            data = {
                _id: livechatRoom.id,
                type: eventType,
            };

            if (
                livechatRoom.visitor.phone &&
                livechatRoom.visitor.phone[0].phoneNumber
            ) {
                data = {
                    ...data,
                    userPhone:
                        livechatRoom.visitor.phone[0].phoneNumber || undefined,
                };
            }

            if (
                livechatRoom.visitor.livechatData &&
                livechatRoom.visitor.livechatData.username
            ) {
                data = {
                    ...data,
                    username:
                        livechatRoom.visitor.livechatData.username || undefined,
                    tags: fullRoomInfo._unmappedProperties_?.tags || undefined,
                };
            }

            return data;
            */
        }
    }
}
