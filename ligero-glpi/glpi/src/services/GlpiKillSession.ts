import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";

import {
    CONFIG_GLPI_API_URL,
    CONFIG_GLPI_APP_TOKEN,
    CONFIG_GLPI_USER_TOKEN,
    getSettingValue,
} from "../settings/settings";

import { timeout } from "../models/Constants";

export default class GlpiKillSessionService {
    public static async GlpiKillSession(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        SessionToken: string
    ): Promise<void> {
        const GLPIURL: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_API_URL
        );

        const GLPIAPPTOKEN: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_APP_TOKEN
        );

        const GLPIUSERTOKEN: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_USER_TOKEN
        );
        /*
        if (logger) {
            logger.debug(
                "GlpiKillSession.ts - Debug 01 - " +
                    GLPIURL +
                    " " +
                    GLPIAPPTOKEN +
                    " " +
                    GLPIUSERTOKEN +
                    " " +
                    SessionToken
            );
        }
        */

        const response = await http.get(GLPIURL + "/apirest.php/killSession/", {
            timeout: timeout,
            headers: {
                "App-Token": GLPIAPPTOKEN,
                Authorization: `user_token ${GLPIUSERTOKEN}`,
                "Session-Token": SessionToken,
                "Content-Type": "application/json",
            },
        });

        if (
            !response ||
            !response.statusCode ||
            response.statusCode !== 200 ||
            (response.content && JSON.parse(response.content)["ERROR"])
        ) {
            logger.error("GlpiKillSession.ts - Error 01: " + response.content);
            return undefined;
        }

        if (!response || !response.content) {
            logger.error("GlpiKillSession.ts - Error 02: NO return from GLPI");
            return undefined;
        }

        const GLPIRESPONSEKIL = JSON.parse(response.content);
        /*
        if (logger) {
            logger.debug("GlpikILLSession.ts - Debug 02 - " + GLPIRESPONSEKIL);
        }
        */
    }
}
