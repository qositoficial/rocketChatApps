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

export default class GlpiApi {
    //retorna as variaveis de ambiente do GLPI
    private static async getEnv(
        http: IHttp,
        read: IRead,
        logger: ILogger
    ): Promise<GlpiEnvironment> {
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
    ): Promise<string | Error> {
        const { GLPI_URL, GLPI_APP_TOKEN, GLPI_USER_TOKEN } = await this.getEnv(
            http,
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

        return "";
    }
    //finaliza a sessão
    private static async killSession() {}
    //retorna dados da entidade
    private static async getEntity() {}
    //retorna dados do usuário
    public static async getUser() {}
}
