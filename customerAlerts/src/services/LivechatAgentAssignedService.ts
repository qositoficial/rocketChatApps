import {
    ILogger,
    IModify,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ILivechatEventContext } from "@rocket.chat/apps-engine/definition/livechat";
import { RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export default class LivechatAgentAssignedService {
    public static async executePost(
        context: ILivechatEventContext,
        read: IRead,
        modify: IModify,
        logger?: ILogger
    ): Promise<void> {
        if (
            context.room.type !== RoomType.LIVE_CHAT ||
            context.agent.roles.includes("bot") ||
            context.agent.roles.includes("app")
        ) {
            return;
        }

        const appUser = (await read.getUserReader().getAppUser()) as IUser;

        if (logger) {
            // logger.debug("Assigned 01: ");
        }

        const message = modify
            .getCreator()
            .startLivechatMessage()
            .setRoom(context.room)
            .setText(
                `*O atendente ${context.agent.name} iniciou o atendimento.*`
            )
            .setSender(appUser);

        await modify.getCreator().finish(message);
    }
}
