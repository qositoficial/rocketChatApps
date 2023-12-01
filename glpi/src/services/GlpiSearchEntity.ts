import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ApiGlpiTimeout } from "../settings/constants";

export default class GlpiSearchEntityService {
    public static async searchEntity(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        SessionToken: string,
        fullAgentData: any
    ): Promise<any> {
        // Retorna se nao vier agente
        if (!fullAgentData) {
            return;
        }
        // Variaveis Glpi
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
            // logger.debug("SearchUser 02");
        }
        // Definir a entidade pelo agente
        if (fullAgentData && fullAgentData.entityName) {
            const response = await http.get(
                GlpiUrl + "/apirest.php/search/Entity/",
                {
                    timeout: ApiGlpiTimeout,
                    headers: {
                        "App-Token": AppToken,
                        "Session-Token": SessionToken,
                        "Content-Type": "application/json",
                    },
                    params: {
                        "criteria[0][field]": "1",
                        "criteria[0][searchtype]": "equals",
                        "criteria[0][value]": fullAgentData.entityName,
                        "forcedisplay[2]": "2",
                        "forcedisplay[14]": "14",
                    },
                }
            );

            if (
                !response ||
                !response.statusCode ||
                response.statusCode !== 200 ||
                (response.content && JSON.parse(response.content)["ERROR"])
            ) {
                logger.error(
                    "GlpiSearchEntity - Error calling GLPI: " + response.content
                );
                return undefined;
            }

            if (!response || !response.content) {
                logger.error(
                    "GlpiSearchEntity - Error calling GLPI: got NO return from GLPI"
                );
                return undefined;
            }

            const FullEntity = JSON.parse(response.content);

            const GlpiFullEntity = {
                entityID: FullEntity.data[0][2],
                entityName: FullEntity.data[0][1],
                entityFullName: FullEntity.data[0][5],
            };

            if (logger) {
                // logger.debug("GlpiSearchEntity 03 - ");
            }

            return GlpiFullEntity;
        }
    }
}
