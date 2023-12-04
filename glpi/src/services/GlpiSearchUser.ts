import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ApiGlpiTimeout } from "../settings/constants";
import GlpiSearchEntityService from "./GlpiSearchEntity";

export default class SearchUserService {
    public static async SearchUser(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        SessionToken: string,
        userPhone: string
    ): Promise<any> {
        if (userPhone) {
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
        // Definir usuário cliente pelo número de telefone
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

        let GlpiFullUser = {
            userID: FullUser.data[0][2],
            userName: FullUser.data[0][1],
            email: FullUser.data[0][5],
            mobile: FullUser.data[0][11],
            phone: FullUser.data[0][6],
            entityName: FullUser.data[0][77],
        };

        const entityID = await GlpiSearchEntityService.searchEntity(
            http,
            read,
            logger,
            SessionToken,
            GlpiFullUser
        );

        GlpiFullUser["entityID"] = entityID.entityID;

        if (logger) {
            // logger.debug("SearchUser 03 - ");
        }

        return GlpiFullUser;
    }
}
