import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IMessageBuilder,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";

import {
    CONFIG_MESSAGE_ADD_AGENT_NAME,
    CONFIG_NOTIFY_AGENT_ASSIGNED,
    CONFIG_NOTIFY_AGENT_ASSIGNED_TEXT,
    CONFIG_NOTIFY_CLOSE_CHAT,
    CONFIG_NOTIFY_ROOM_TRANSFERRED,
    SETTINGS,
    getSettingValue,
} from "./src/settings/settings";

import { App } from "@rocket.chat/apps-engine/definition/App";
import {
    ILivechatEventContext,
    ILivechatRoom,
    ILivechatTransferEventContext,
    IPostLivechatAgentAssigned,
    IPostLivechatRoomClosed,
    IPostLivechatRoomTransferred,
    LivechatTransferEventType,
} from "@rocket.chat/apps-engine/definition/livechat";
import {
    IMessage,
    IPreMessageSentModify,
} from "@rocket.chat/apps-engine/definition/messages";
import {
    AppMethod,
    IAppInfo,
} from "@rocket.chat/apps-engine/definition/metadata";
import { RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser, UserType } from "@rocket.chat/apps-engine/definition/users";
import LivechatRoomTransferredService from "./src/services/LivechatRoomTransferredService";
import LivechatAgentAssignedService from "./src/services/LivechatAgentAssignedService";
import MessageSentService from "./src/services/MessageSentService";

export class CustomerAlertsApp
    extends App
    implements
        IPostLivechatRoomTransferred,
        IPreMessageSentModify,
        IPostLivechatAgentAssigned
{
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(
        configuration: IConfigurationExtend,
        environmentRead: IEnvironmentRead
    ): Promise<void> {
        await SETTINGS.forEach((setting) =>
            configuration.settings.provideSetting(setting)
        );
    }

    public async [AppMethod.EXECUTE_POST_LIVECHAT_ROOM_TRANSFERRED](
        context: ILivechatTransferEventContext,
        read: IRead,
        http: IHttp,
        persis: IPersistence,
        modify: IModify
    ): Promise<void> {
        const allowExecute = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_NOTIFY_ROOM_TRANSFERRED
        );

        if (!allowExecute) {
            return;
        }

        await LivechatRoomTransferredService.executePost(
            context,
            read,
            modify,
            this.getLogger()
        );
    }

    public async [AppMethod.EXECUTEPREMESSAGESENTMODIFY](
        message: IMessage,
        builder: IMessageBuilder,
        read: IRead,
        http: IHttp,
        persistence: IPersistence
    ): Promise<IMessage> {
        const allowExecute = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_MESSAGE_ADD_AGENT_NAME
        );

        if (!allowExecute) {
            return builder.getMessage();
        }

        return await MessageSentService.executePre(
            message,
            builder,
            this.getLogger()
        );
    }

    public async [AppMethod.EXECUTE_POST_LIVECHAT_AGENT_ASSIGNED](
        context: ILivechatEventContext,
        read: IRead,
        http: IHttp,
        persis: IPersistence,
        modify: IModify
    ): Promise<void> {
        const allowExecute = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_NOTIFY_AGENT_ASSIGNED
        );

        if (!allowExecute) {
            return;
        }
        await LivechatAgentAssignedService.executePost(
            context,
            read,
            modify,
            this.getLogger()
        );
    }
}
