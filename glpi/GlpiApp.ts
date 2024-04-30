import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import {
    IMessage,
    IPostMessageSent,
} from "@rocket.chat/apps-engine/definition/messages";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { SETTINGS } from "./src/settings/settings";
import ProcessMessages from "./src/services/ProcessMessages";
import { ILivechatRoom } from "@rocket.chat/apps-engine/definition/livechat";

export class GlpiApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(
        // Rocket.Chat environment variables
        configuration: IConfigurationExtend,
        environmentRead: IEnvironmentRead
    ): Promise<void> {
        await SETTINGS.forEach((setting) =>
            configuration.settings.provideSetting(setting)
        );
    }

    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        if (!message.text && !message.attachments) {
            // not a text or attachments
            return;
        }

        if (message.room.type !== RoomType.LIVE_CHAT) {
            // not a livechat
            return;
        }

        const data = await ProcessMessages.processData(
            // process messages
            "Message",
            read,
            persistence,
            message.room as ILivechatRoom,
            message,
            this.getLogger()
        );

        if (!data) {
            // if no data
            return;
        }

        this.getLogger().debug(`${JSON.stringify(data)}`);
    }
}
