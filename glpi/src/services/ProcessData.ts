import {
    IRead,
    IPersistence,
    ILogger,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ILivechatRoom,
    ILivechatMessage,
} from "@rocket.chat/apps-engine/definition/livechat";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { UserType } from "@rocket.chat/apps-engine/definition/users";

export default class ProcessDataService {
    public static async ProcessData(
        eventType: string,
        read: IRead,
        persistence: IPersistence,
        room: ILivechatRoom,
        message?: ILivechatMessage,
        logger?: ILogger
    ) {
        let data: any = undefined;
        let roomMessages: any;
        const livechatRoom = room as ILivechatRoom;
        // Workaroung to get TAGs
        const fullRoomInfo = JSON.parse(JSON.stringify(livechatRoom));

        console.log(fullRoomInfo);
    }
}
