import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";

import {
    CONFIG_GLPI_API_URL,
    CONFIG_GLPI_APP_TOKEN,
    CONFIG_GLPI_DEFAULT_USER,
    CONFIG_GLPI_USER_TOKEN,
    getSettingValue,
} from "../settings/settings";
import GlpiInitSessionService from "./GlpiInitSession";
import GlpiKillSessionService from "./GlpiKillSession";
import { timeout } from "../models/Constants";

export default class GlpiUserDataService {
    private static async getEnv(
        http: IHttp,
        read: IRead,
        logger: ILogger
    ): Promise<any> {
        // Variaveis
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

        const GLPISESSIONTOKEN: string =
            await GlpiInitSessionService.GlpiInitSession(http, read, logger);

        const GLPIDEFAULTUSER: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_DEFAULT_USER
        );

        const ENV = {
            GLPIURL,
            GLPIAPPTOKEN,
            GLPIUSERTOKEN,
            GLPISESSIONTOKEN,
            GLPIDEFAULTUSER,
        };
        /*
        if (logger) {
            logger.debug(`GlpiUserData.ts 01 - getEnv - ${JSON.stringify(ENV)}`);
        }
        */

        return ENV;
    }

    private static async getUser(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        userEmail: string,
        userName: string,
        userPhone: string
    ): Promise<any> {
        const { GLPIURL, GLPIAPPTOKEN, GLPIUSERTOKEN, GLPISESSIONTOKEN } =
            await this.getEnv(http, read, logger);

        if (!GLPIURL || !GLPIAPPTOKEN || !GLPIUSERTOKEN || !GLPISESSIONTOKEN) {
            return undefined;
        }

        const userResponse = await http.get(
            GLPIURL + "/apirest.php/search/User/",
            {
                timeout: timeout,
                headers: {
                    "App-Token": GLPIAPPTOKEN,
                    "Session-Token": GLPISESSIONTOKEN,
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
                    "criteria[5][value]": userEmail,
                    // telefone - 6
                    "criteria[6][link]": "OR",
                    "criteria[6][field]": "6",
                    "criteria[6][searchtype]": "contains",
                    "criteria[6][value]": userPhone,
                    // celular - 11
                    "criteria[11][link]": "AND",
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
            logger.error(
                "GlpiUserData.ts - getUser() - Error 01: " +
                    userResponse.content
            );
            return undefined;
        }

        if (!userResponse || !userResponse.content) {
            logger.error(
                "GlpiUserData.ts - getUser() - Error 02: NO return from GLPI"
            );
            return undefined;
        }

        const FULLUSER = JSON.parse(userResponse.content);

        GlpiKillSessionService.GlpiKillSession(
            http,
            read,
            logger,
            GLPISESSIONTOKEN
        );

        return FULLUSER;
    }

    private static async getEntity(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        entityName: string
    ): Promise<any> {
        const { GLPIURL, GLPIAPPTOKEN, GLPIUSERTOKEN, GLPISESSIONTOKEN } =
            await this.getEnv(http, read, logger);

        if (!GLPIURL || !GLPIAPPTOKEN || !GLPIUSERTOKEN || !GLPISESSIONTOKEN) {
            return undefined;
        }

        const entityResponse = await http.get(
            GLPIURL + "/apirest.php/search/Entity",
            {
                timeout: timeout,
                headers: {
                    "App-Token": GLPIAPPTOKEN,
                    "Session-Token": GLPISESSIONTOKEN,
                    "Content-Type": "application/json",
                },
                params: {
                    // nome da entidade - 14
                    "criteria[14][field]": "14",
                    "criteria[14][searchtype]": "contains",
                    "criteria[14][value]": entityName,
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
                "GlpiUserData.ts - getEntity() - Error 01: " +
                    entityResponse.content
            );
            return undefined;
        }
        if (!entityResponse || !entityResponse.content) {
            logger.error(
                "GlpiUserData.ts - getEntity() - Error 02: NO return from GLPI"
            );
            return undefined;
        }
        const FULLENTITY = JSON.parse(entityResponse.content);

        GlpiKillSessionService.GlpiKillSession(
            http,
            read,
            logger,
            GLPISESSIONTOKEN
        );

        return FULLENTITY;
    }

    public static async searchUser(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        userEmail: string,
        userName: string,
        userPhone: string
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

        let FULLUSER = await this.getUser(
            http,
            read,
            logger,
            userEmail,
            userName,
            userPhone
        );

        const { GLPIDEFAULTUSER } = await this.getEnv(http, read, logger);

        if (!FULLUSER || FULLUSER.totalcount === 0) {
            FULLUSER = await this.getUser(
                http,
                read,
                logger,
                GLPIDEFAULTUSER,
                GLPIDEFAULTUSER,
                userPhone
            );
        }

        if (!FULLUSER) {
            return undefined;
        }

        const ENTITYNAME = FULLUSER.data[0][77];

        const FULLENTITY = await this.getEntity(http, read, logger, ENTITYNAME);

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

        return GLPIFULLUSER;
    }
}
