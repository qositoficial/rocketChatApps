import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { apiTimeout } from "../helpers/constants";
import {
    CONFIG_GLPI_API_URL,
    CONFIG_GLPI_APP_TOKEN,
    CONFIG_GLPI_USER_TOKEN,
    getSettingValue,
} from "../settings/settings";

export default class SearchUserService {
    public static async SearchUser(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        SessionToken: string,
        userPhone: string,
        userName: string
    ): Promise<any> {
        if (userPhone) {
            // Remover 0 do início
            if (userPhone.startsWith("0")) {
                userPhone = userPhone.slice(1);
            }
            // Remover código do Brasil
            if (userPhone.length > 11 && userPhone.startsWith("55")) {
                userPhone = userPhone.slice(2);
            }
            // Extrair código de área
            const phoneAreaCode = userPhone.slice(0, 2);
            // remover código de área
            userPhone = userPhone.slice(2);
            // Verificar se o primeiro dígito é 7, 8 ou 9
            const firstDigit = userPhone.charAt(0);
            const isMobile = ["7", "8", "9"].includes(firstDigit);
            if (isMobile && userPhone.length < 9) {
                userPhone = "9" + userPhone;
            }
            userPhone = phoneAreaCode + userPhone;

            if (logger) {
                logger.debug("GlpiUserData.ts - Debug 01 - " + userPhone);
            }
        }

        /*
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

        const response = await http.get(GlpiUrl + "/apirest.php/search/User/", {
            timeout: ApiGlpiTimeout,
            headers: {
                "App-Token": AppToken,
                "Session-Token": SessionToken,
                "Content-Type": "application/json",
            },
            params: {
                "criteria[0][link]": "OR",
                "criteria[0][field]": "6",
                "criteria[0][searchtype]": "contains",
                "criteria[0][value]": userPhone,
                "criteria[1][link]": "OR",
                "criteria[1][field]": "11",
                "criteria[1][searchtype]": "contains",
                "criteria[1][value]": userPhone,
                "forcedisplay[2]": "2",
                "forcedisplay[5]": "5",
                "forcedisplay[11]": "11",
                "forcedisplay[77]": "77",
            },
        });

        if (
            !response ||
            !response.statusCode ||
            response.statusCode !== 200 ||
            (response.content && JSON.parse(response.content)["ERROR"])
        ) {
            logger.error("Error calling GLPI 03: " + response.content);
            return undefined;
        }

        if (!response || !response.content) {
            logger.error("Error calling GLPI 04: got NO return from GLPI");
            return undefined;
        }

        const FullUser = JSON.parse(response.content);

        const GlpiFullUser = {
            userID: FullUser.data[0][2],
            userName: FullUser.data[0][1],
            email: FullUser.data[0][5],
            mobile: FullUser.data[0][11],
            phone: FullUser.data[0][6],
            entityName: FullUser.data[0][77],
        };

        if (logger) {
            // logger.debug("SearchUser 03");
        }

        return GlpiFullUser;
        */
    }
}
