import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ApiGlpiTimeout } from "../settings/constants";

export default class GlpiITILFollowupService {
    public static async updateTicket(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        SessionToken: string,
        ticketID: number,
        userID: number,
        entityID: number,
        text: string
    ): Promise<void> {
        // Definir variaveis Glpi
        const GlpiUrl: string = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById("glpi_url");

        const AppToken: string = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById("glpi_app_token");

        // Atualiza ticket
        const response = await http.post(
            GlpiUrl + "/apirest.php/Ticket/" + ticketID + "/ITILFollowup",
            {
                timeout: ApiGlpiTimeout,
                headers: {
                    "App-Token": AppToken,
                    "Session-Token": SessionToken,
                    "Content-Type": "application/json",
                },
                data: {
                    input: {
                        itemtype: "Ticket",
                        items_id: ticketID,
                        users_id: userID,
                        requesttypes_id: 9,
                        entities_id: entityID,
                        content: text,
                    },
                },
            }
        );
        if (logger) {
            logger.debug(
                "GlpiGlpiITILFollowup 2 - " + JSON.stringify(response)
            );
        }
    }
}
