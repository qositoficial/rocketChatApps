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
import SearchUserService from "./src/services/GlpiSearchUser";
import GlpiInitSessionService from "./src/services/GlpiInitSession";
import GlpiKillSessionService from "./src/services/GlpiKillSession";
import { RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import CloseChatService from "./src/services/GlpiCloseChat";
import GlpiSearchAgentService from "./src/services/GlpiSearchAgent";

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
        if (!message.text && !message.attachments) {
            return;
        }

        if (message.room.type !== RoomType.LIVE_CHAT) {
            return;
        }

        const data = await ProcessDataService.ProcessData(
            "Message",
            http,
            read,
            persistence,
            message.room as ILivechatRoom,
            message,
            this.getLogger()
        );

        if (!data) {
            return;
        }
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
            http,
            read,
            persistence,
            room,
            undefined,
            this.getLogger()
        );

        if (!data) {
            return;
        }

        const userPhone = data.visitor.phone;
        const agentData = data.visitor.agent;

        const SessionToken = await GlpiInitSessionService.GlpiInitSession(
            http,
            read,
            this.getLogger()
        );

        const GlpiFullUser = await SearchUserService.SearchUser(
            http,
            read,
            this.getLogger(),
            SessionToken,
            userPhone
        );

        const GlpiFullAgent = await GlpiSearchAgentService.searchAgent(
            http,
            read,
            this.getLogger(),
            SessionToken,
            agentData
        );

        await CloseChatService.CloseChat(
            http,
            read,
            this.getLogger(),
            data,
            SessionToken,
            GlpiFullUser,
            GlpiFullAgent
        );

        await GlpiKillSessionService.GlpiKillSession(
            http,
            read,
            this.getLogger(),
            SessionToken
        );

        return;
    }
}
