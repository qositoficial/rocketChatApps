import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ApiGlpiTimeout } from "../settings/constants";

export default class GlpiKillSessionService {
    public static async GlpiKillSession(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        SessionToken: string
    ): Promise<void> {
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
            // logger.debug("GlpiKillSession 01");
        }

        const response = await http.get(GlpiUrl + "/apirest.php/killSession/", {
            timeout: ApiGlpiTimeout,
            headers: {
                "App-Token": AppToken,
                Authorization: UserToken,
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
            logger.error(
                "GlpiKillSession - Error calling GLPI 01: " + response.content
            );
            return undefined;
        }

        if (!response || !response.content) {
            logger.error(
                "GlpiKillSession - Error calling GLPI 02: got NO return from GLPI"
            );
            return undefined;
        }

        const ResponseKill = JSON.parse(response.content);
        if (logger) {
            // logger.debug("GlpiKillSession 02");
        }
    }
}
