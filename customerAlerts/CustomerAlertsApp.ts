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

        if (context.room.type !== RoomType.LIVE_CHAT) {
            return;
        }

        const messageText =
            context.type === LivechatTransferEventType.AGENT
                ? "Você foi transferido para outro atendente"
                : "Você foi transferido para o departamento " + context.to.name;

        const appUser = (await read.getUserReader().getAppUser()) as IUser;

        const message = modify
            .getCreator()
            .startLivechatMessage()
            .setRoom(context.room)
            .setText(messageText)
            .setSender(appUser);

        await modify.getCreator().finish(message);
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

        if (message.room.type !== RoomType.LIVE_CHAT) {
            return await builder.getMessage();
        }

        if (message.sender.type !== UserType.USER) {
            return await builder.getMessage();
        }

        const room = message.room as ILivechatRoom;

        if (!room.isWaitingResponse) {
            return await builder.getMessage();
        }

        const messageText = `*[${message.sender.name}]*\n\n${message.text}`;

        builder.setText(messageText);

        return await builder.getMessage();
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

        if (context.room.type !== RoomType.LIVE_CHAT) {
            return;
        }

        const appUser = (await read.getUserReader().getAppUser()) as IUser;

        const message = modify
            .getCreator()
            .startLivechatMessage()
            .setRoom(context.room)
            .setText(
                `O atendente *${context.agent.name}* iniciou o atendimento.`
            )
            .setSender(appUser);

        await modify.getCreator().finish(message);
    }
}
