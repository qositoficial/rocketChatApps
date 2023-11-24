import {} from "meteor-promise";
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
                if (data.tags) {
                    for (let i = 0; i < data.tags.length; i++) {
                        let ticketId = data.tags[i].replace("#", "");
                        data.tags[i] = ticketId;
                    }
                }

                if (data.messages[i].fileUpload) {
                    // montar requisição get
                    const res = await http.get(
                        data.messages[i].fileUpload.publicFilePath,
                        {
                            encoding: null,
                            timeout: ApiGlpiTimeout,
                            headers: {
                                "X-Auth-Token":
                                    "1rMX6Wti7iyyjGaEPTr9f_Qbxdg--V6QyinvfY6iuzf",
                                "X-User-Id": "rYNAMz9nmeysskEFp",
                            },
                        }
                    );

                    if (res && res.content && res.headers) {
                        const typeFile = res.headers["content-type"];
                        const base64String = Buffer.from(
                            res.content,
                            "binary"
                        ).toString("base64");
                        let base64Full = typeFile;
                        if (typeFile.toLowerCase().startsWith("audio")) {
                            base64Full =
                                "<p><audio controls><source src='data:" +
                                typeFile +
                                ";base64," +
                                base64String +
                                "' type='" +
                                typeFile +
                                "'>Your browser does not support the audio element.</audio></p>";
                        } else if (typeFile.toLowerCase().startsWith("image")) {
                            base64Full =
                                '<p><img height="100" src="data:' +
                                typeFile +
                                ";base64," +
                                base64String +
                                '" alt="image"/></p>';
                        } else if (typeFile.toLowerCase().startsWith("video")) {
                            base64Full =
                                "<p><video width='160' height='120' controls><source src='data:" +
                                typeFile +
                                ";base64," +
                                base64String +
                                "' type='" +
                                typeFile +
                                "'>Your browser does not support the video element.</video></p>";
                        } else if (
                            typeFile.toLowerCase().startsWith("application")
                        ) {
                            base64Full =
                                "<p><object width='160' height='120' data='data:" +
                                typeFile +
                                ";base64," +
                                base64String +
                                "' type='" +
                                typeFile +
                                "'>Your browser does not support the object element.</object></p>";
                        }

                        if (logger) {
                            logger.debug(
                                "GlpiCloseChat 5 - " +
                                    JSON.stringify(base64Full)
                            );
                            await http.post(
                                "https://webhook.site/1ec69daa-d4d1-4bc5-a6b0-34c71afa4e52",
                                { content: base64Full }
                            );
                        }
                    }
                }

                //     const responseFile = await http.get(
                //         data.messages[i].fileUpload.publicFilePath +
                //             "?Download",
                //         {
                //             timeout: ApiGlpiTimeout,
                //             headers: {
                //                 "X-Auth-Token":
                //                     "1rMX6Wti7iyyjGaEPTr9f_Qbxdg--V6QyinvfY6iuzf",
                //                 "X-User-Id": "rYNAMz9nmeysskEFp",
                //             },
                //         }
                //     );

                //     if (logger) {
                //         // logger.debug("GlpiCloseChat 2 - ");
                //     }

                //     if (responseFile && responseFile.headers) {
                //         const typeFile = responseFile.headers["content-type"];
                //         if (responseFile.content) {
                //             const binaryBuffer = Buffer.from(
                //                 responseFile.content,
                //                 "binary"
                //             );
                //             const base64String =
                //                 binaryBuffer.toString("base64");

                //             const base64Full =
                //                 '<img height="100" src="data:' +
                //                 typeFile +
                //                 ";base64," +
                //                 base64String +
                //                 '" alt="image"/>';

                //             if (logger) {
                //                 logger.debug("GlpiCloseChat 5 - " + base64Full);
                //                 await http.post(
                //                     "https://webhook.site/1ec69daa-d4d1-4bc5-a6b0-34c71afa4e52",
                //                     { content: JSON.stringify(responseFile) }
                //                 );
                //             }
                //         }
                //     }
                // }

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
