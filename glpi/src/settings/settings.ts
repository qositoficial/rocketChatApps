import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum AppSetting {
    GlpiUrl = "glpi_url",
    GlpiAppToken = "glpi_app_token",
    GlpiUserToken = "glpi_user_token",
}

export enum DefaultMessage {
    DEFAULT_GlpiUrl = "https://glpi.qosit.com.br", // "http://glpi",
    DEFAULT_GlpiAppToken = "ZANLMVZsZGdVX5ssjT5qtEpuAWkwh6CFG8eO8JcN", // "Your API Client Token",
    DEFAULT_GlpiUserToken = "AvLTALMT41WOuTsIotJHA9wAdjQ0LSukIcI24NxU", //"Your API User Token",
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
    {
        id: AppSetting.GlpiUserToken,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_GlpiUserToken,
        i18nLabel: "glpi_user_token_label",
        i18nDescription: "glpi_user_token_description",
        required: true,
    },
];
