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
    ILivechatEventContext,
    ILivechatMessage,
    ILivechatRoom,
    ILivechatTransferEventContext,
    IPostLivechatAgentAssigned,
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
import GlpiTicketAssignedService from "./src/services/GlpiTicketAssigned";
import {
    IMessage,
    IPostMessageSent,
} from "@rocket.chat/apps-engine/definition/messages";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";

export class GlpiApp
    extends App
    implements
        IPostMessageSent,
        IPostLivechatRoomTransferred,
        IPostLivechatRoomClosed,
        IPostLivechatAgentAssigned
{
    constructor(info: IAppInfo, logger: ILogger, acessors: IAppAccessors) {
        super(info, logger, acessors);
    }

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

        // processa as mensagens
        const data = await ProcessDataService.ProcessData(
            "Message",
            read,
            persistence,
            message.room as ILivechatRoom,
            message,
            this.getLogger()
        );

        // retorna se não tiver dados
        if (!data) {
            return;
        }

        this.getLogger().debug(`${JSON.stringify(data)}`);
    }

    public async executePostLivechatRoomTransferred(
        context: ILivechatTransferEventContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<void> {
        // Departamento(s) definido(s) na configuração
        const DEPARTMENTS = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_DEPARTMENTS
        );
        // Variável pra controle de mensagens
        let firstMessage = 0;
        // Adicionar campo customizado para controle de mensagens
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
        // Define usuário criado pelo App
        const appUser = await read.getUserReader().getAppUser(this.getID());

        // Processa a mensagem para definir dados de usuário
        const visitor = await ProcessDataService.GetUser(
            "visitor",
            context.room as ILivechatRoom,
            this.getLogger()
        );

        // Encerra caso não tenha dados do usuário
        if (!visitor) {
            return;
        }
        // Encerra caso não seja a primeira mensagem
        if (!firstMessage) {
            return;
        }
        // Criar o ticket no GLPI
        if (context.to.name) {
            if (DEPARTMENTS.includes(context.to.name)) {
                // Consultar usuário
                this.getLogger().debug(
                    `Debug 00001 - ${JSON.stringify(visitor)}`
                );
                const GLPI_FULL_USER = await GlpiUserDataService.searchUser(
                    http,
                    read,
                    this.getLogger(),
                    visitor.fullUserData.email,
                    visitor.fullUserData.username,
                    visitor.fullUserData.phone
                );
                this.getLogger().debug(
                    `Debug 00002 - ${JSON.stringify(GLPI_FULL_USER)}`
                );
                // Criar o ticker no GLPI
                const GLPI_NEW_TICKET =
                    (await GlpiCreateTicketService.createTicket(
                        context.room as IRoom,
                        http,
                        read,
                        this.getLogger(),
                        GLPI_FULL_USER,
                        context.to.name
                    )) || "";
                // Encerra caso não tenha criado o ticket
                if (!GLPI_NEW_TICKET) {
                    return;
                }

                let message: ILivechatMessage = {
                    room: context.room,
                    sender: context.to as IUser,
                };

                // TODO processa a mensagem com o número do ticket
                const teste = await ProcessDataService.ProcessData(
                    "Message",
                    read,
                    persistence,
                    context.room as ILivechatRoom,
                    message,
                    this.getLogger(),
                    GLPI_NEW_TICKET
                );
                // context.room["tags"] = `#${GLPI_NEW_TICKET}`;

                // this.getLogger().debug(`DBUG: ${context.room}`);

                // const data = await ProcessDataService.ProcessData(
                //     "Message",
                //     read,
                //     persistence,
                //     context.room as ILivechatRoom,
                //     this.getLogger(),
                //     GLPI_NEW_TICKET
                // );

                // Retorna mensagem para o cliente com o ticket criado
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

    public async executePostLivechatAgentAssigned(
        context: ILivechatEventContext,
        read: IRead,
        http: IHttp,
        persis: IPersistence,
        modify: IModify
    ): Promise<void> {
        await GlpiTicketAssignedService.executePost(
            context,
            http,
            read,
            modify,
            this.getLogger()
        );
    }

    public async executePostLivechatRoomClosed(
        room: ILivechatRoom,
        read: IRead,
        http: IHttp,
        persistence: IPersistence
    ): Promise<void> {
        let message: any = {};
        const visitor = await ProcessDataService.ProcessData(
            "Transferred",
            read,
            persistence,
            room as ILivechatRoom,
            message,
            this.getLogger()
        );

        this.getLogger().debug("DEBUG - CLOSE: " + JSON.stringify(visitor));
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
