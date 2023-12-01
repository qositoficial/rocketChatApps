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
import { ApiGlpiTimeout } from "../settings/constants";
import GlpiITILFollowupService from "./GlpiITILFollowup";

export default class CloseChatService {
    public static async CloseChat(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        data: any,
        SessionToken: string,
        GlpiFullUser: any,
        GlpiFullAgent: any
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
            let base64Full = "";

            for (let i = data.messages.length - 1; i >= 0; i--) {
                // Remover o # dos tickets
                if (data.tags) {
                    for (let i = 0; i < data.tags.length; i++) {
                        let ticketId = data.tags[i].replace("#", "");
                        data.tags[i] = ticketId;
                    }
                }
                // Formatando a data
                const updatedAtString = data.messages[i].updatedAt;
                const updatedAtDate = new Date(updatedAtString);

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

                // Se tiver anexos
                if (data.messages[i].fileUpload) {
                    // montar requisição get
                    const res = await http.get(
                        data.messages[i].fileUpload.publicFilePath,
                        {
                            encoding: null,
                            timeout: ApiGlpiTimeout,
                            headers: {
                                "X-Auth-Token":
                                    "nLWKl4eZPlzWsDhCvafpcuNU90eBBaV4oDR4m6eYG3V",
                                "X-User-Id": "yqsoCiT3qSQnF6B7Y",
                            },
                        }
                    );

                    if (res && res.content && res.headers) {
                        const typeFile = res.headers["content-type"];
                        if (logger) {
                            logger.debug(
                                "GlpiCloseChat 5 - " +
                                    JSON.stringify(res.headers)
                            );
                        }
                        const base64String = Buffer.from(
                            res.content,
                            "binary"
                        ).toString("base64");
                        base64Full = typeFile;
                        if (typeFile.toLowerCase().startsWith("audio")) {
                            base64Full =
                                "<audio controls><source src='data:image/jpeg;base64," +
                                base64String +
                                "' type='" +
                                typeFile +
                                "'>Your browser does not support the audio element.</audio>";
                        } else if (typeFile.toLowerCase().startsWith("image")) {
                            base64Full =
                                "<img height='100' src='data:image/jpeg;base64," +
                                base64String +
                                "' type='" +
                                typeFile +
                                "' alt='image'/>";
                        } else if (typeFile.toLowerCase().startsWith("video")) {
                            base64Full =
                                "<video width='160' height='120' controls><source src='data:image/jpeg;base64," +
                                base64String +
                                "' type='" +
                                typeFile +
                                "'>Your browser does not support the video element.</video>";
                        } else if (
                            typeFile.toLowerCase().startsWith("application")
                        ) {
                            base64Full =
                                "<object width='160' height='120' src='data:image/jpeg;base64," +
                                base64String +
                                "' type='" +
                                typeFile +
                                "'>Your browser does not support the object element.</object>";
                        }

                        if (logger) {
                            // logger.debug("GlpiCloseChat 5 - ");
                        }
                    }
                }

                if (data.messages[i] && data.messages[i].fullAgentData) {
                    if (data.messages[i].fileUpload) {
                        text =
                            "<p>" +
                            formattedDate +
                            " - " +
                            data.messages[i].fullAgentData.name +
                            " (" +
                            data.messages[i].fullAgentData.username +
                            "): <br> " +
                            base64Full +
                            "</p>";
                    } else {
                        text =
                            "<p>" +
                            formattedDate +
                            " - " +
                            data.messages[i].fullAgentData.name +
                            " (" +
                            data.messages[i].fullAgentData.username +
                            "): <br> " +
                            data.messages[i].messageText +
                            "</p>";
                    }
                    await GlpiITILFollowupService.updateTicket(
                        http,
                        read,
                        logger,
                        SessionToken,
                        data.tags[0],
                        GlpiFullAgent.userID,
                        GlpiFullAgent.entityID,
                        text
                    );
                } else {
                    if (data.messages[i].fileUpload) {
                        text =
                            "<p>" +
                            formattedDate +
                            " - " +
                            data.messages[i].fullUserData.name +
                            " (" +
                            data.messages[i].fullUserData.phone +
                            "): <br> " +
                            base64Full +
                            "</p>";
                    } else {
                        text =
                            "<p>" +
                            formattedDate +
                            " - " +
                            data.messages[i].fullUserData.name +
                            " (" +
                            data.messages[i].fullUserData.phone +
                            "): <br> " +
                            data.messages[i].messageText +
                            "</p>";
                    }
                    await GlpiITILFollowupService.updateTicket(
                        http,
                        read,
                        logger,
                        SessionToken,
                        data.tags[0],
                        GlpiFullUser.userID,
                        GlpiFullUser.entityID,
                        text
                    );
                }
            }
            if (logger) {
                // logger.debug("GlpiCloseChat 2 - ");
            }
        }
    }
}
