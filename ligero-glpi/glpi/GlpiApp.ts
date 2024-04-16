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
    ILivechatTransferEventContext,
    IPostLivechatRoomClosed,
    IPostLivechatRoomTransferred,
} from "@rocket.chat/apps-engine/definition/livechat";
import {
    IMessage,
    IPostMessageSent,
} from "@rocket.chat/apps-engine/definition/messages";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

import {
    CONFIG_GLPI_API_URL,
    CONFIG_GLPI_APP_TOKEN,
    CONFIG_GLPI_DEPARTMENTS,
    CONFIG_GLPI_USER_TOKEN,
    getSettingValue,
    SETTINGS,
} from "./src/settings/settings";
import GlpiInitSessionService from "./src/services/GlpiInitSession";
import GlpiKillSessionService from "./src/services/GlpiKillSession";

export class GlpiApp
    extends App
    implements IPostMessageSent, IPostLivechatRoomTransferred
{
    constructor(info: IAppInfo, logger: ILogger, acessors: IAppAccessors) {
        super(info, logger, acessors);
    }

    // configuração que vem da interface
    public async extendConfiguration(
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
        // recusa se nao for texto ou anexo
        if (!message.text && !message.attachments) {
            return;
        }

        // recusa se não for livechat
        if (message.room.type !== RoomType.LIVE_CHAT) {
            return;
        }

        // Debug
        if (message.room.displayName === "Diego RA") {
            this.getLogger().debug(
                `Sent - Debug 01 - ${message.room.displayName}`
            );
        }

        // const appUser = await read.getUserReader().getAppUser(this.getID());

        // if (
        //     !message.room.customFields ||
        //     !message.room.customFields.GlpiFirstMessage
        // ) {
        //     const roomUp = await modify
        //         .getExtender()
        //         .extendRoom(message.room.id, {} as IUser);
        //     roomUp.addCustomField("GlpiFirstMessage", "1");
        //     await modify.getExtender().finish(roomUp);
        // }
    }

    public async executePostLivechatRoomTransferred(
        context: ILivechatTransferEventContext,
        // message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        /*
        // recusa se nao for texto ou anexo
        if (!message.text && !message.attachments) {
            return;
        }

        // recusa se não for livechat
        if (message.room.type !== RoomType.LIVE_CHAT) {
            return;
        }
        */

        // const GLPI_SESSION_TOKEN = await GlpiInitSessionService.GlpiInitSession(
        //     http,
        //     read,
        //     this.getLogger()
        // );

        this.getLogger().debug(
            `Transfer - Debug 01 - ${await GlpiKillSessionService.GlpiKillSession(
                http,
                read,
                this.getLogger(),
                await GlpiInitSessionService.GlpiInitSession(
                    http,
                    read,
                    this.getLogger()
                )
            )}`
        );

        const DEPARTMENTS = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_DEPARTMENTS
        );
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

        if (context.to.name) {
            if (DEPARTMENTS.includes(context.to.name)) {
                this.getLogger().debug(
                    `Debug 01 - ${JSON.stringify(context.to.name)}`
                );
            }
        }
    }
}
