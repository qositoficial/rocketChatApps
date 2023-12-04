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
        ticketID: [],
        userID: number,
        entityID: number,
        text: string
    ): Promise<void> {
        if (!ticketID) {
            return;
        }
        if (logger) {
            logger.debug("GlpiGlpiITILFollowup 1 - " + ticketID.length);
        }
        for (let i = 0; i < ticketID.length; i++) {
            const ticketNumber = ticketID[i];
            if (logger) {
                logger.debug("GlpiGlpiITILFollowup 2 - " + ticketNumber);
            }
            // Definir variaveis Glpi
            const GlpiUrl: string = await read
                .getEnvironmentReader()
                .getSettings()
                .getValueById("glpi_url");

            const AppToken: string = await read
                .getEnvironmentReader()
                .getSettings()
                .getValueById("glpi_app_token");

            const GlpiRequestSource: number = await read
                .getEnvironmentReader()
                .getSettings()
                .getValueById("glpi_request_source");

            // Atualiza ticket
            const response = await http.post(
                GlpiUrl +
                    "/apirest.php/Ticket/" +
                    ticketNumber +
                    "/ITILFollowup",
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
                            items_id: ticketNumber,
                            users_id: userID,
                            requesttypes_id: GlpiRequestSource,
                            entities_id: entityID,
                            content: text,
                        },
                    },
                }
            );

            if (logger) {
                // logger.debug("GlpiGlpiITILFollowup 3 - ");
            }
        }
    }
}
