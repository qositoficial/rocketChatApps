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

export default class CloseChatService {
    public static async CloseChat(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        data: any
    ): Promise<string | undefined | void> {
        const log = logger.debug("PD: 1");
        return log;
    }
}
