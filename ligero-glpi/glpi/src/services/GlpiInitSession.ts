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

export default class GlpiInitSessionService {
    public static async GlpiInitSession(
        http: IHttp,
        read: IRead,
        logger: ILogger
    ): Promise<any> {
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
                "GlpiInitSession.ts - Debug 01 - " +
                    GLPIURL +
                    " " +
                    GLPIAPPTOKEN +
                    " " +
                    GLPIUSERTOKEN
            );
        }
        */

        const response = await http.get(GLPIURL + "/apirest.php/initSession/", {
            timeout: timeout,
            headers: {
                "App-Token": GLPIAPPTOKEN,
                Authorization: `user_token ${GLPIUSERTOKEN}`,
                "Content-Type": "application/json",
            },
        });

        if (
            !response ||
            !response.statusCode ||
            response.statusCode !== 200 ||
            (response.content && JSON.parse(response.content)["ERROR"])
        ) {
            logger.error("GlpiInitSession.ts - Error 01: " + response.content);
            return undefined;
        }

        if (!response || !response.content) {
            logger.error("GlpiInitSession.ts - Error 02: NO return from GLPI");
            return undefined;
        }

        const GLPISESSIONTOKEN = JSON.parse(response.content).session_token;
        /*
        if (logger) {
            logger.debug("GlpiInitSession.ts - Debug 02 - " + GLPISESSIONTOKEN);
        }
        */

        return GLPISESSIONTOKEN;
    }
}
