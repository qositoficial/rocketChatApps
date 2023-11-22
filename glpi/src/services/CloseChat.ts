import * as fs from "fs";
import {
    IHttp,
    ILogger,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ILivechatMessage,
    ILivechatRoom,
} from "@rocket.chat/apps-engine/definition/livechat";
import ConvertBase64Service from "./ConvertBase64";
import { ApiGlpiTimeout } from "../settings/constants";

export default class CloseChatService {
    public static async CloseChat(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        data: any,
        SessionToken: string,
        GlpiFullUser: any
    ): Promise<void> {
        const GlpiUrl: string = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById("glpi_url");

        const AppToken: string = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById("glpi_app_token");

        if (data && data.messages) {
            let text = "";
            // let base64 = "";

            for (let i: number = 0; i < data.messages.length; i++) {
                if (logger) {
                    // logger.debug("GlpiCloseChat 1 - ");
                }

                if (data.tags) {
                    for (let i = 0; i < data.tags.length; i++) {
                        let ticketId = data.tags[i].replace("#", "");
                        data.tags[i] = ticketId;
                    }
                }
                //     if (data.messages[i].fileUpload) {
                //         const responseFile = await http.get(
                //             data.messages[i].fileUpload.publicFilePath,
                //             {
                //                 headers: {
                //                     "X-Auth-Token":
                //                         "1rMX6Wti7iyyjGaEPTr9f_Qbxdg--V6QyinvfY6iuzf",
                //                     "X-User-Id": "rYNAMz9nmeysskEFp",
                //                 },
                //             }
                //         );

                //         if (responseFile && responseFile.content) {
                //             const base64String = await Buffer.from(
                //                 responseFile.data,
                //                 "utf8"
                //             ).toString("base64");

                //             if (responseFile && responseFile.headers) {
                //                 const type = responseFile.headers["content-type"];
                //                 base64 = "data:" + type + ";base64," + base64String;
                //             }
                //         }
                //     }

                const updatedAtString = data.messages[i].updatedAt;
                const updatedAtDate = new Date(updatedAtString);

                // Formatando a data
                const formattedDate =
                    updatedAtDate.getFullYear() +
                    "-" +
                    String(updatedAtDate.getMonth() + 1).padStart(2, "0") +
                    "-" +
                    String(updatedAtDate.getDate()).padStart(2, "0") +
                    " " +
                    String(updatedAtDate.getHours()).padStart(2, "0") +
                    ":" +
                    String(updatedAtDate.getMinutes()).padStart(2, "0") +
                    ":" +
                    String(updatedAtDate.getSeconds()).padStart(2, "0");

                if (data.messages[i] && data.messages[i].fullAgentData) {
                    text +=
                        "<p>" +
                        formattedDate +
                        " - " +
                        data.messages[i].fullAgentData.name +
                        " (" +
                        data.messages[i].fullAgentData.username +
                        "): " +
                        data.messages[i].messageText +
                        "</p>";
                } else {
                    text +=
                        "<p>" +
                        formattedDate +
                        " - " +
                        data.messages[i].fullUserData.name +
                        " (" +
                        data.messages[i].fullUserData.phone +
                        "): " +
                        data.messages[i].messageText +
                        "</p>";
                }
            }

            const response = await http.post(
                GlpiUrl +
                    "/apirest.php/Ticket/" +
                    data.tags[0] +
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
                            items_id: data.tags[0],
                            users_id: GlpiFullUser.userID,
                            requesttypes_id: 9,
                            entities_id: 1,
                            content: text,
                        },
                    },
                }
            );
            if (logger) {
                logger.debug("GlpiCloseChat 2 - " + JSON.stringify(response));
            }
        }
    }
}
