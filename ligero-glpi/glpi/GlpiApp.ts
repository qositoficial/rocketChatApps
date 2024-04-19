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
    ILivechatRoom,
    ILivechatTransferEventContext,
    IPostLivechatRoomClosed,
    IPostLivechatRoomTransferred,
} from "@rocket.chat/apps-engine/definition/livechat";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

import {
    CONFIG_GLPI_DEPARTMENTS,
    CONFIG_GLPI_NEW_TICKET_MESSAGE,
    getSettingValue,
    SETTINGS,
} from "./src/settings/settings";
import ProcessDataService from "./src/services/ProcessData";
import GlpiUserDataService from "./src/services/GlpiUserData";
import GlpiCreateTicketService from "./src/services/GlpiCreateTicket";

export class GlpiApp
    extends App
    implements IPostLivechatRoomTransferred, IPostLivechatRoomClosed
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

    /*
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
    */

    public async executePostLivechatRoomTransferred(
        context: ILivechatTransferEventContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
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

        const appUser = await read.getUserReader().getAppUser(this.getID());

        const dataUser = await ProcessDataService.ProcessData(
            "Transferred",
            http,
            read,
            persistence,
            context.room as ILivechatRoom,
            this.getLogger()
        );

        if (!dataUser) {
            this.getLogger().debug("DEBUG: Not dataUser");
            return;
        }

        // if (!firstMessage) {
        //     this.getLogger().debug("DEBUG: Not firstMessage");
        //     return;
        // }

        if (context.to.name) {
            if (DEPARTMENTS.includes(context.to.name)) {
                /*
                this.getLogger().debug(
                    `Debug 01 - ${JSON.stringify(dataUser)}`
                );
                */

                const GLPI_FULL_USER = await GlpiUserDataService.searchUser(
                    http,
                    read,
                    this.getLogger(),
                    dataUser.userPhone,
                    dataUser.username
                );

                const GLPI_NEW_TICKET =
                    (await GlpiCreateTicketService.createTicket(
                        http,
                        read,
                        this.getLogger(),
                        GLPI_FULL_USER,
                        context.to.name
                    )) || "";

                if (!GLPI_NEW_TICKET) {
                    return;
                }

                // const dataUser = await ProcessDataService.ProcessData(
                //     "Transferred",
                //     http,
                //     read,
                //     persistence,
                //     context.room as ILivechatRoom,
                //     this.getLogger(),
                //     GLPI_NEW_TICKET
                // );

                this.getLogger().debug(`DEBUG: ${JSON.stringify(dataUser)} `);

                let newTicketMessage = await getSettingValue(
                    read.getEnvironmentReader(),
                    CONFIG_GLPI_NEW_TICKET_MESSAGE
                );

                if (CONFIG_GLPI_NEW_TICKET_MESSAGE) {
                    newTicketMessage =
                        "*[Mensagem Automática]*\n" +
                        newTicketMessage.replace("%s", GLPI_NEW_TICKET);
                    const ticketMessage = modify
                        .getCreator()
                        .startLivechatMessage();
                    ticketMessage
                        .setText(newTicketMessage.toString())
                        .setRoom(context.room)
                        .setSender(appUser!);
                    await modify.getCreator().finish(ticketMessage);
                }
            }
        }
    }

    public async executePostLivechatRoomClosed(
        room: ILivechatRoom,
        read: IRead,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
        const dataUser = await ProcessDataService.ProcessData(
            "Transferred",
            http,
            read,
            persistence,
            room as ILivechatRoom,
            this.getLogger()
        );

        this.getLogger().debug("DEBUG - CLOSE: " + JSON.stringify(dataUser));
    }

    // public async executePostLivechatRoomClosed(
    //     room: ILivechatRoom,
    //     read: IRead,
    //     http: IHttp,
    //     persistence: IPersistence
    //     // modify?: IModify
    // ): Promise<void> {
    //     // // this.getLogger().debug('c: 1');
    //     // const data = await LigeroSmart.ProcessData(
    //     //     "LivechatSession",
    //     //     read,
    //     //     persistence,
    //     //     room,
    //     //     undefined,
    //     //     this.getLogger()
    //     // );
    //     // // this.getLogger().debug('c: 2');
    //     // if (!data) {
    //     //     return;
    //     // }
    //     // this.getLogger().debug('c: 3');
    //     const TicketID = await LigeroSmart.TicketCreateOrClose(
    //         http,
    //         read,
    //         this.getLogger(),
    //         data
    //     );
    //     // this.getLogger().debug('c: 4');
    //     return;
    // }

    // protected async extendConfiguration(
    //     configuration: IConfigurationExtend
    // ): Promise<void> {
    //     await Promise.all(
    //         settings.map((setting) =>
    //             configuration.settings.provideSetting(setting)
    //         )
    //     );
    // }
}
