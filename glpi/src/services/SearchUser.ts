import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";

export default class SearchUserService {
    public static async SearchUser(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        userPhone: string
    ): Promise<any> {
        // Extrair código de área
        const codeArea = userPhone.slice(2, 4);
        // remover prefixo "55" + codeArea
        userPhone = userPhone.slice(4);
        // Verificar se o primeiro dígito é 7, 8 ou 9
        const firstDigit = userPhone.charAt(0);
        const isMobile = ["7", "8", "9"].includes(firstDigit);
        if (isMobile && userPhone.length < 9) {
            userPhone = "9" + userPhone;
        }
        userPhone = codeArea + userPhone;
        if (logger) {
            // logger.debug("SearchUser 01");
        }

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

        const ResponseSessionToken = await http.get(
            GlpiUrl + "/apirest.php/initSession/",
            {
                timeout: 30000,
                headers: {
                    "App-Token": AppToken,
                    Authorization: UserToken,
                    "Content-Type": "application/json",
                },
            }
        );

        if (
            !ResponseSessionToken ||
            !ResponseSessionToken.statusCode ||
            ResponseSessionToken.statusCode !== 200 ||
            (ResponseSessionToken.content &&
                JSON.parse(ResponseSessionToken.content)["ERROR"])
        ) {
            logger.error(
                "Error calling GLPI 01: " + ResponseSessionToken.content
            );
            return undefined;
        }

        if (!ResponseSessionToken || !ResponseSessionToken.content) {
            logger.error("Error calling GLPI 02: got NO return from GLPI");
            return undefined;
        }

        const SessionToken = JSON.parse(
            ResponseSessionToken.content
        ).session_token;
        if (logger) {
            // logger.debug("SearchUser 03");
        }

        const ResponseUserID = await http.get(
            GlpiUrl + "/apirest.php/search/User/",
            {
                params: {
                    "criteria[0][link]": "OR",
                    "criteria[0][field]": "6",
                    "criteria[0][searchtype]": "contains",
                    "criteria[0][value]": userPhone,
                    "criteria[1][link]": "OR",
                    "criteria[1][field]": "11",
                    "criteria[1][searchtype]": "contains",
                    "criteria[1][value]": userPhone,
                    // "criteria[2][link]": "AND",
                    // "criteria[2][field]": "2",
                    // "criteria[2][searchtype]": "contains",
                    // "criteria[2][value]": "",
                },
                headers: {
                    "App-Token": AppToken,
                    "Session-Token": SessionToken,
                    "Content-Type": "application/json",
                },
            }
        );

        if (
            !ResponseUserID ||
            !ResponseUserID.statusCode ||
            ResponseUserID.statusCode !== 200 ||
            (ResponseUserID.content &&
                JSON.parse(ResponseUserID.content)["ERROR"])
        ) {
            logger.error("Error calling GLPI 03: " + ResponseUserID.content);
            return undefined;
        }

        if (!ResponseUserID || !ResponseUserID.content) {
            logger.error("Error calling GLPI 04: got NO return from GLPI");
            return undefined;
        }

        const UserID = JSON.parse(ResponseUserID.content);

        if (logger) {
            logger.debug(
                "SearchUser 03 - " + JSON.stringify(UserID.data[0][11])
            );
        }
    }
}
