import {
    IAppAccessors,
    ILogger,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { ILivechatRoom } from "@rocket.chat/apps-engine/definition/livechat";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";

export class GlpiApp extends App {
    private readonly appLogger: ILogger;
    private readonly livechatRoom: ILivechatRoom;
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
        console.log(this.livechatRoom);
        this.appLogger = this.getLogger();
    }
}
