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

export class GlpiApp extends App implements IPostLivechatRoomClosed {
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

    public async executePostLivechatRoomClosed(
        room: ILivechatRoom,
        read: IRead,
        http: IHttp,
        persis: IPersistence,
        modify?: IModify | undefined
    ): Promise<void> {
        // Pegar dados da conversa
        // const data = ProcessDataService.ProcessData('LivechatSession',read,persistence, room,undefined,this.getLogger());
        const data = "dados";

        if (!data) {
            return;
        }
        // Atualizar o chamado
        // const TicketID = await CloseChatService.CloseChat(http, read, this.getLogger(), data)]
        const ticketID = "Número do Chamado";

        return;
    }
}
