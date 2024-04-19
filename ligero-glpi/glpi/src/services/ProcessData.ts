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

export default class ProcessDataService {
    public static async ProcessData(
        eventType: string,
        http: IHttp,
        read: IRead,
        persistence: IPersistence,
        room: ILivechatRoom,
        logger?: ILogger,
        message?: ILivechatMessage
    ): Promise<any> {
        let data: any = undefined;
        let roomMessages: any;
        const livechatRoom = room as ILivechatRoom;
        const fullRoomInfo = JSON.parse(JSON.stringify(livechatRoom));
        const roomPersisAss = new RocketChatAssociationRecord(
            RocketChatAssociationModel.ROOM,
            livechatRoom.id
        );
        let userEmail: string;
        let userPhone: string;
        /*
        if (logger) {
            logger.debug("ProcessData.ts - Debug 01");
        }
        */
        if ((eventType === "Transferred" || eventType === "Closed") && room) {
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
        }
    }
}
