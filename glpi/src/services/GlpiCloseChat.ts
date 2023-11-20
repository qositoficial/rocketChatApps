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

export default class GlpiCloseChatService {
    public static async GlpiCloseChat(
        http: IHttp,
        read: IRead,
        logger: ILogger,
        data: any,
        SessionToken: string,
        GlpiUserID: string
    ): Promise<void> {
        if (data && data.messages) {
            let text = "";

            for (let i: number = 0; i < data.messages.length; i++) {
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
                        formattedDate +
                        " - " +
                        data.messages[i].fullAgentData.name +
                        " (" +
                        data.messages[i].fullAgentData.username +
                        "): " +
                        data.messages[i].messageText +
                        "\n";
                } else {
                    text +=
                        formattedDate +
                        " - " +
                        data.messages[i].fullUserData.name +
                        " (" +
                        data.messages[i].fullUserData.phone +
                        "): " +
                        data.messages[i].messageText +
                        "\n";
                }
            }

            http.post(
                "https://webhook.site/1ec69daa-d4d1-4bc5-a6b0-34c71afa4e52",
                {
                    content: text,
                }
            );
        }
    }
}
