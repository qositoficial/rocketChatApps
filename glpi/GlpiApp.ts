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
import {
    CONFIG_GLPI_DEPARTMENTS,
    getSettingValue,
    SETTINGS,
} from "./src/settings/settings";
import ProcessMessages from "./src/services/ProcessMessages";
import {
    ILivechatRoom,
    ILivechatTransferEventContext,
    IPostLivechatRoomTransferred,
} from "@rocket.chat/apps-engine/definition/livechat";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import GlpiApi from "./src/services/GlpiApi";

export class GlpiApp
    extends App
    implements IPostMessageSent, IPostLivechatRoomTransferred
{
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
    }

    public async executePostLivechatRoomTransferred(
        context: ILivechatTransferEventContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        // reads user defined department
        const DEPARTMENTS = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_DEPARTMENTS
        );

        // returns if it is not the same department
        if (!DEPARTMENTS.includes(context.to.name)) {
            return;
        }

        // controls the first message
        let firstMessage = 0;

        if (
            !context.room.customFields ||
            !context.room.customFields.GlpiFirstMessage
        ) {
            const roomUp = await modify
                .getExtender()
                .extendRoom(context.room.id, {} as IUser);
            roomUp.addCustomField("GlpiFirstMessage", "1");
            await modify.getExtender().finish(roomUp);
            firstMessage = 1;
        }

        // defines visitor data
        const visitor = await ProcessMessages.getUser(
            "Visitor",
            context.room as ILivechatRoom,
            this.getLogger()
        );

        if (!visitor) {
            // if no visitor
            return;
        }

        if (!firstMessage) {
            // if not first message
            return;
        }

        // glpi user
        const GLPI_FULL_USER = await GlpiApi.searchUser(
            http,
            read,
            this.getLogger(),
            visitor.email,
            visitor.username,
            visitor.phone
        );

        this.getLogger().debug(`Debug: ${JSON.stringify(GLPI_FULL_USER)}`);
    }
}
