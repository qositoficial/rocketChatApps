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

export default class GlpiUserDataService {
    public static async searchUser(
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
            /*
            if (logger) {
                logger.debug("GlpiUserData.ts - Debug 01 - " + userPhone);
            }
            */
        }

        if (userName) {
            userName = userName.replace(/\.com(\.br)?$/, "");
            /*
            if (logger) {
                logger.debug("GlpiUserData.ts - Debug 02 - " + userName);
            }
            */
        }

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

        const userResponse = await http.get(
            GLPIURL + "/apirest.php/search/User/",
            {
                timeout: apiTimeout,
                headers: {
                    "App-Token": GLPIAPPTOKEN,
                    "Session-Token": SessionToken,
                    "Content-Type": "application/json",
                },
                params: {
                    // username - 1
                    "criteria[1][link]": "OR",
                    "criteria[1][field]": "1",
                    "criteria[1][searchtype]": "contains",
                    "criteria[1][value]": userName,
                    // email - 5
                    "criteria[5][link]": "OR",
                    "criteria[5][field]": "5",
                    "criteria[5][searchtype]": "contains",
                    "criteria[5][value]": userName,
                    // telefone - 6
                    "criteria[6][link]": "OR",
                    "criteria[6][field]": "6",
                    "criteria[6][searchtype]": "contains",
                    "criteria[6][value]": userPhone,
                    // celular - 11
                    "criteria[11][link]": "OR",
                    "criteria[11][field]": "11",
                    "criteria[11][searchtype]": "contains",
                    "criteria[11][value]": userPhone,
                    // username - 1
                    "forcedisplay[1]": "1",
                    // userID - 2
                    "forcedisplay[2]": "2",
                    // email - 5
                    "forcedisplay[5]": "5",
                    // telefone - 6
                    "forcedisplay[6]": "6",
                    // primeiro nome - 9
                    "forcedisplay[9]": "9",
                    // último nome - 34
                    "forcedisplay[34]": "34",
                    // celular - 11
                    "forcedisplay[11]": "11",
                    // entidade padrão - 77
                    "forcedisplay[77]": "77",
                },
            }
        );

        if (
            !userResponse ||
            !userResponse.statusCode ||
            userResponse.statusCode !== 200 ||
            (userResponse.content && JSON.parse(userResponse.content)["ERROR"])
        ) {
            logger.error("GlpiUserData.ts - Error 01: " + userResponse.content);
            return undefined;
        }

        if (!userResponse || !userResponse.content) {
            logger.error("GlpiUserData.ts - Error 02: NO return from GLPI");
            return undefined;
        }

        const FULLUSER = JSON.parse(userResponse.content);
        const ENTITYNAME = FULLUSER.data[0][77];
        /*
        if (logger) {
            logger.debug(
                "GlpiUserData.ts - Debug 03 - " +
                    JSON.stringify(FULLUSER) +
                    " - " +
                    ENTITYNAME
            );
        }
        */
        const entityResponse = await http.get(
            GLPIURL + "/apirest.php/search/Entity",
            {
                timeout: apiTimeout,
                headers: {
                    "App-Token": GLPIAPPTOKEN,
                    "Session-Token": SessionToken,
                    "Content-Type": "application/json",
                },
                params: {
                    // nome da entidade - 14
                    "criteria[14][field]": "14",
                    "criteria[14][searchtype]": "contains",
                    "criteria[14][value]": ENTITYNAME,
                    // entityFullName - 1
                    "forcedisplay[1]": "1",
                    // entityID - 2
                    "forcedisplay[2]": "2",
                    // entityName - 14
                    "forcedisplay[14]": "14",
                    // entityCNPJ - 70
                    "forcedisplay[70]": "70",
                },
            }
        );

        if (
            !entityResponse ||
            !entityResponse.statusCode ||
            entityResponse.statusCode !== 200 ||
            (entityResponse.content &&
                JSON.parse(entityResponse.content)["ERROR"])
        ) {
            logger.error(
                "GlpiUserData.ts - Error 03: " + entityResponse.content
            );
            return undefined;
        }

        if (!entityResponse || !entityResponse.content) {
            logger.error("GlpiUserData.ts - Error 04: NO return from GLPI");
            return undefined;
        }

        const FULLENTITY = JSON.parse(entityResponse.content);

        const GLPIFULLUSER = {
            userID: FULLUSER.data[0][2],
            userName: FULLUSER.data[0][1],
            email: FULLUSER.data[0][5],
            phone: FULLUSER.data[0][6],
            firstName: FULLUSER.data[0][9],
            lastName: FULLUSER.data[0][34],
            mobile: FULLUSER.data[0][11],
            entity: {
                entityID: FULLENTITY.data[0][2],
                entityFullName: FULLENTITY.data[0][1],
                entityName: FULLENTITY.data[0][14],
                entityCNPJ: FULLENTITY.data[0][70],
            },
        };

        if (logger) {
            logger.debug(
                "GlpiUserData.ts - Debug 05 - " + JSON.stringify(GLPIFULLUSER)
            );
        }

        return GLPIFULLUSER;
    }
}
