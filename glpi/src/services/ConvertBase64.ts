import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import * as fs from "fs";

export default class ConvertBase64Service {
    public static async ConvertBase64(
        http: IHttp,
        publicFilePath: any
    ): Promise<any> {
        const response = await http.get(publicFilePath, {
            headers: {
                "X-Auth-Token": "1rMX6Wti7iyyjGaEPTr9f_Qbxdg--V6QyinvfY6iuzf",
                "X-User-Id header": "rYNAMz9nmeysskEFp",
            },
        });

        return JSON.stringify(response);

        // if (
        //     !response ||
        //     !response.statusCode ||
        //     response.statusCode !== 200 ||
        //     (response.content && JSON.parse(response.content)["ERROR"])
        // ) {
        //     // logger.error(
        //     //     "GlpiInitSession - Error calling GLPI 01: " + response.content
        //     // );
        //     return undefined;
        // }

        // if (!response || !response.content) {
        //     // logger.error(
        //     //     "GlpiInitSession - Error calling GLPI 02: got NO return from GLPI"
        //     // );
        //     return undefined;
        // }

        // return JSON.stringify(response);
    }
}
// const imageBuffer = fs.readFileSync(response.);

// // Codificação para Base64
// const base64String = imageBuffer.toString("base64");

// return base64String;
