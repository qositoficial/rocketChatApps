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
    AppMethod,
    IAppInfo,
} from "@rocket.chat/apps-engine/definition/metadata";
import { settings } from "./src/settings/settings";
import {
    ILivechatRoom,
    IPostLivechatRoomClosed,
} from "@rocket.chat/apps-engine/definition/livechat";
import ProcessDataService from "./src/services/ProcessData";
import {
    IMessage,
    IPostMessageSent,
} from "@rocket.chat/apps-engine/definition/messages";

export class GlpiApp
    extends App
    implements IPostMessageSent, IPostLivechatRoomClosed
{
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(
        configuration: IConfigurationExtend,
        environmentRead: IEnvironmentRead
    ): Promise<void> {
        await settings.forEach((setting) =>
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
        const data = await ProcessDataService.ProcessData(
            "Message",
            read,
            persistence,
            message.room as ILivechatRoom,
            message,
            this.getLogger()
        );
        // this.getLogger().debug('m: 4');
        if (!data) {
            return;
        }

        return;
    }

    public async executePostLivechatRoomClosed(
        room: ILivechatRoom,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify?: IModify | undefined
    ): Promise<void> {
        // Pegar dados da conversa
        const data = await ProcessDataService.ProcessData(
            "LivechatSession",
            read,
            persistence,
            room,
            undefined,
            this.getLogger()
        );

        if (!data) {
            return;
        }
        // Atualizar o chamado
        // const TicketID = await CloseChatService.CloseChat(http, read, this.getLogger(), data)]
        const ticketID = "Número do Chamado";

        return;
    }
}
