import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ApiGlpiTimeout } from "../settings/constants";
import GlpiSearchEntityService from "./GlpiSearchEntity";

export default class GlpiSearchAgentService {
    public static async searchAgent(
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
            // logger.debug("SearchAgent 02");
        }
        // Definir o agente pelo username e email
        if (fullAgentData && fullAgentData.username && fullAgentData.email) {
            const response = await http.get(
                GlpiUrl + "/apirest.php/search/User/",
                {
                    timeout: ApiGlpiTimeout,
                    headers: {
                        "App-Token": AppToken,
                        "Session-Token": SessionToken,
                        "Content-Type": "application/json",
                    },
                    params: {
                        "criteria[0][link]": "AND",
                        "criteria[0][field]": "1",
                        "criteria[0][searchtype]": "contains",
                        "criteria[0][value]": fullAgentData.username,
                        "criteria[1][link]": "AND",
                        "criteria[1][field]": "5",
                        "criteria[1][searchtype]": "contains",
                        "criteria[1][value]": fullAgentData.email,
                        "forcedisplay[2]": "2",
                        "forcedisplay[5]": "5",
                        "forcedisplay[11]": "11",
                        "forcedisplay[77]": "77",
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
                    "GlpiSearchAgent - Error calling GLPI: " + response.content
                );
                return undefined;
            }

            if (!response || !response.content) {
                logger.error(
                    "GlpiSearchAgent - Error calling GLPI: got NO return from GLPI"
                );
                return undefined;
            }

            const FullAgent = JSON.parse(response.content);

            let GlpiFullAgent = {
                userID: FullAgent.data[0][2],
                userName: FullAgent.data[0][1],
                email: FullAgent.data[0][5],
                mobile: FullAgent.data[0][11],
                phone: FullAgent.data[0][6],
                entityName: FullAgent.data[0][77],
            };

            const entityID = await GlpiSearchEntityService.searchEntity(
                http,
                read,
                logger,
                SessionToken,
                GlpiFullAgent
            );

            GlpiFullAgent["entityID"] = entityID.entityID;

            if (logger) {
                // logger.debug("SearchAgent 03 - ");
            }

            return GlpiFullAgent;
        }
    }
}
