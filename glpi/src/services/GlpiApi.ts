import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    CONFIG_GLPI_URL,
    CONFIG_GLPI_APP_TOKEN,
    CONFIG_GLPI_DEFAULT_USER,
    CONFIG_GLPI_REQUEST_ORIGIN_ID,
    CONFIG_GLPI_SUBJECT_DEFAULT,
    CONFIG_GLPI_USER_TOKEN,
    getSettingValue,
} from "../settings/settings";
import { GlpiEnvironment, timeout } from "../settings/constants";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export default class GlpiApi {
    //retorna as variaveis de ambiente do GLPI
    private static async getEnv(read: IRead, logger: ILogger): Promise<any> {
        const GLPI_URL: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_URL
        );

        const GLPI_APP_TOKEN: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_APP_TOKEN
        );

        const GLPI_USER_TOKEN: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_USER_TOKEN
        );

        const GLPI_SUBJECT_DEFAULT: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_SUBJECT_DEFAULT
        );

        const GLPI_REQUEST_ORIGIN_ID: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_REQUEST_ORIGIN_ID
        );

        const GLPI_DEFAULT_USER: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_DEFAULT_USER
        );

        return {
            GLPI_URL,
            GLPI_APP_TOKEN,
            GLPI_USER_TOKEN,
            GLPI_SUBJECT_DEFAULT,
            GLPI_REQUEST_ORIGIN_ID,
            GLPI_DEFAULT_USER,
        };
    }
    //inicia sessão e retorna o token
    private static async initSession(
        http: IHttp,
        read: IRead,
        logger: ILogger
    ): Promise<string> {
        const { GLPI_URL, GLPI_APP_TOKEN, GLPI_USER_TOKEN } = await this.getEnv(
            read,
            logger
        );

        let glpiSessionToken: string = "";

        try {
            const apiResponse = await http.get(
                GLPI_URL + "/apirest.php/initSession/",
                {
                    timeout: timeout,
                    headers: {
                        "App-Token": GLPI_APP_TOKEN,
                        Authorization: `user_token ${GLPI_USER_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (
                apiResponse &&
                apiResponse.content &&
                JSON.parse(apiResponse.content).session_token
            ) {
                glpiSessionToken = JSON.parse(
                    apiResponse.content
                ).session_token;
            } else {
                logger.error(apiResponse.data);
                throw new Error(apiResponse.data);
            }

            return glpiSessionToken;
        } catch (error: any) {
            logger.error(error);
            throw new Error(error);
        }
    }

    //finaliza a sessão
    private static async killSession(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        glpiSessionToken: string
    ): Promise<void> {
        const { GLPI_URL, GLPI_APP_TOKEN, GLPI_USER_TOKEN } = await this.getEnv(
            read,
            logger
        );

        const response = await http.get(
            GLPI_URL + "/apirest.php/killSession/",
            {
                timeout: timeout,
                headers: {
                    "App-Token": GLPI_APP_TOKEN,
                    Authorization: `user_token ${GLPI_USER_TOKEN}`,
                    "Session-Token": glpiSessionToken,
                    "Content-Type": "application/json",
                },
            }
        );

        if (
            !response ||
            !response.statusCode ||
            response.statusCode !== 200 ||
            (response.content && JSON.parse(response.content)["ERROR"])
        ) {
            logger.error("GlpiKillSession.ts - Error 01: " + response.content);
            return undefined;
        }

        if (!response || !response.content) {
            logger.error("GlpiKillSession.ts - Error 02: NO return from GLPI");
            return undefined;
        }

        const GLPI_RESPONSE_KILL = JSON.parse(response.content);

        return GLPI_RESPONSE_KILL;
    }

    //retorna dados da entidade
    private static async getEntity(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        entityName: string
    ): Promise<any> {
        const { GLPI_URL, GLPI_APP_TOKEN, GLPI_USER_TOKEN } = await this.getEnv(
            read,
            logger
        );

        const glpiSessionToken = await this.initSession(http, read, logger);

        if (
            !GLPI_URL ||
            !GLPI_APP_TOKEN ||
            !GLPI_USER_TOKEN ||
            !glpiSessionToken
        ) {
            return undefined;
        }

        const entityResponse = await http.get(
            GLPI_URL + "/apirest.php/search/Entity",
            {
                timeout: timeout,
                headers: {
                    "App-Token": GLPI_APP_TOKEN,
                    "Session-Token": glpiSessionToken,
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
            logger.error("getEntity() - Error 01: " + entityResponse.content);
            return undefined;
        }
        if (!entityResponse || !entityResponse.content) {
            logger.error("getEntity() - Error 02: NO return from GLPI");
            return undefined;
        }
        const FULL_ENTITY = JSON.parse(entityResponse.content);

        this.killSession(http, read, logger, glpiSessionToken);

        return FULL_ENTITY;
    }

    //retorna dados do usuário
    private static async getUser(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        userEmail: string,
        userName: string,
        userPhone: string
    ): Promise<any> {
        const { GLPI_URL, GLPI_APP_TOKEN, GLPI_USER_TOKEN } = await this.getEnv(
            read,
            logger
        );

        const glpiSessionToken = await this.initSession(http, read, logger);

        if (
            !GLPI_URL ||
            !GLPI_APP_TOKEN ||
            !GLPI_USER_TOKEN ||
            !glpiSessionToken
        ) {
            return undefined;
        }

        const userResponse = await http.get(
            GLPI_URL + "/apirest.php/search/User/",
            {
                timeout: timeout,
                headers: {
                    "App-Token": GLPI_APP_TOKEN,
                    "Session-Token": glpiSessionToken,
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
            logger.error("getUser() - Error 01: " + userResponse.content);
            return undefined;
        }

        if (!userResponse || !userResponse.content) {
            logger.error("getUser() - Error 02: NO return from GLPI");
            return undefined;
        }

        const FULL_USER = JSON.parse(userResponse.content);

        this.killSession(http, read, logger, glpiSessionToken);

        return FULL_USER;
    }

    //retorna dados do usuário
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
        }

        if (userName) {
            userName = userName.replace(/\.com(\.br)?$/, "");
        }

        let glpiFullUser = await this.getUser(
            http,
            read,
            logger,
            userEmail,
            userName,
            userPhone
        );

        const { GLPI_DEFAULT_USER } = await this.getEnv(read, logger);

        if (!glpiFullUser || glpiFullUser.totalcount === 0) {
            glpiFullUser = await this.getUser(
                http,
                read,
                logger,
                GLPI_DEFAULT_USER,
                GLPI_DEFAULT_USER,
                userPhone
            );
        }

        if (!glpiFullUser) {
            return undefined;
        }

        const ENTITY_NAME = glpiFullUser.data[0][77];

        const GLPI_FULL_ENTITY = await this.getEntity(
            http,
            read,
            logger,
            ENTITY_NAME
        );

        const GLPI_FULL_USER = {
            userID: glpiFullUser.data[0][2],
            userName: glpiFullUser.data[0][1],
            email: glpiFullUser.data[0][5],
            phone: glpiFullUser.data[0][6],
            firstName: glpiFullUser.data[0][9],
            lastName: glpiFullUser.data[0][34],
            mobile: glpiFullUser.data[0][11],
            entity: {
                entityID: GLPI_FULL_ENTITY.data[0][2],
                entityFullName: GLPI_FULL_ENTITY.data[0][1],
                entityName: GLPI_FULL_ENTITY.data[0][14],
                entityCNPJ: GLPI_FULL_ENTITY.data[0][70],
            },
        };

        return GLPI_FULL_USER;
    }

    // cria o chamado no glpi
    public static async createTicket(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        GlpiFullUser: any,
        departmentName: string
    ): Promise<string | undefined> {
        const {
            GLPI_URL,
            GLPI_APP_TOKEN,
            GLPI_USER_TOKEN,
            GLPI_SUBJECT_DEFAULT,
            GLPI_REQUEST_ORIGIN_ID,
        } = await this.getEnv(read, logger);

        const glpiSessionToken = await this.initSession(http, read, logger);

        const ticketResponse = await http.post(
            GLPI_URL + "/apirest.php/Ticket",
            {
                timeout: timeout,
                headers: {
                    "App-Token": GLPI_APP_TOKEN,
                    "Session-Token": glpiSessionToken,
                    "Content-Type": "application/json",
                },
                data: {
                    input: {
                        name: GLPI_SUBJECT_DEFAULT,
                        content: `Ticket: ${GLPI_SUBJECT_DEFAULT} \nDepartamento: ${departmentName}`,
                        _users_id_requester: GlpiFullUser.userID,
                        requesttypes_id: GLPI_REQUEST_ORIGIN_ID,
                        entities_id: GlpiFullUser.entity.entityID,
                        type: "2",
                    },
                },
            }
        );

        if (
            !ticketResponse ||
            !ticketResponse.statusCode ||
            ticketResponse.statusCode !== 201 ||
            (ticketResponse.content &&
                JSON.parse(ticketResponse.content)["ERROR"])
        ) {
            logger.error(
                "GlpiCreateTicket.ts - Error 01: " + ticketResponse.content
            );
            return undefined;
        }

        if (!ticketResponse || !ticketResponse.content) {
            logger.error("GlpiCreateTicket.ts - Error 02: NO return from GLPI");
            return undefined;
        }

        let ticketNumber = JSON.parse(ticketResponse.content);

        ticketNumber = ticketNumber.id;

        this.killSession(http, read, logger, glpiSessionToken);

        return ticketNumber;
    }
}
