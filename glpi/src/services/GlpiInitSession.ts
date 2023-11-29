import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ApiGlpiTimeout } from "../settings/constants";

export default class GlpiInitSessionService {
    public static async GlpiInitSession(
        http: IHttp,
        read: IRead,
        logger: ILogger
    ): Promise<any> {
        const GlpiUrl: string = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById("glpi_url");

        const AppToken: string = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById("glpi_app_token");

        const UserToken: string =
            "user_token " +
            (await read
                .getEnvironmentReader()
                .getSettings()
                .getValueById("glpi_user_token"));

        if (logger) {
            // logger.debug("GlpiInitSession 01");
        }

        const response = await http.get(GlpiUrl + "/apirest.php/initSession/", {
            timeout: ApiGlpiTimeout,
            headers: {
                "App-Token": AppToken,
                Authorization: UserToken,
                "Content-Type": "application/json",
            },
        });

        if (
            !response ||
            !response.statusCode ||
            response.statusCode !== 200 ||
            (response.content && JSON.parse(response.content)["ERROR"])
        ) {
            logger.error(
                "GlpiInitSession - Error calling GLPI 01: " + response.content
            );
            return undefined;
        }

        if (!response || !response.content) {
            logger.error(
                "GlpiInitSession - Error calling GLPI 02: got NO return from GLPI"
            );
            return undefined;
        }

        const SessionToken = JSON.parse(response.content).session_token;
        if (logger) {
            // logger.debug("GlpiInitSession 02");
        }

        return SessionToken;
    }
}
