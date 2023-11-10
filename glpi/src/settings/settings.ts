import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum AppSetting {
    GlpiUrl = "glpi_url",
    GlpiAppToken = "glpi_app_token",
}

export enum DefaultMessage {
    DEFAULT_GlpiUrl = "http://glpi",
    DEFAULT_GlpiAppToken = "Your API Client Token",
}

export const settings: Array<ISetting> = [
    {
        id: AppSetting.GlpiUrl,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_GlpiUrl,
        i18nLabel: "glpi_url_label",
        i18nDescription: "glpi_url_description",
        required: true,
    },
    {
        id: AppSetting.GlpiAppToken,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_GlpiAppToken,
        i18nLabel: "glpi_app_token_label",
        i18nDescription: "glpi_app_token_description",
        required: true,
    },
];
