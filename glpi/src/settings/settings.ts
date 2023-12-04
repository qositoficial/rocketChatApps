import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export enum AppSetting {
    GlpiUrl = "glpi_url",
    GlpiAppToken = "glpi_app_token",
    GlpiUserToken = "glpi_user_token",
    GlpiRequestSource = "glpi_request_source",
    RocketChatAuthToken = "rocketchat_auth_token",
    RocketChatUserID = "rocketchat_user_id",
}

export enum DefaultMessage {
    DEFAULT_GlpiUrl = "https://glpi.qosit.com.br", // "http://glpi",
    DEFAULT_GlpiAppToken = "ZANLMVZsZGdVX5ssjT5qtEpuAWkwh6CFG8eO8JcN", // "Your API Client Token",
    DEFAULT_GlpiUserToken = "AvLTALMT41WOuTsIotJHA9wAdjQ0LSukIcI24NxU", //"Your API User Token",
    DEFAULT_GlpiRequestSource = "Your request source ID",
    DEFAULT_RocketChatAuthToken = "Your Auth Token",
    DEFAULT_RocketChatUserID = "Your User ID",
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
    {
        id: AppSetting.GlpiRequestSource,
        public: true,
        type: SettingType.NUMBER,
        packageValue: DefaultMessage.DEFAULT_GlpiRequestSource,
        i18nLabel: "glpi_request_source_label",
        i18nDescription: "glpi_request_source_description",
        required: true,
    },
    {
        id: AppSetting.RocketChatAuthToken,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_RocketChatAuthToken,
        i18nLabel: "rocketchat_auth_token_label",
        i18nDescription: "rocketchat_auth_token_description",
        required: true,
    },
    {
        id: AppSetting.RocketChatUserID,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_RocketChatUserID,
        i18nLabel: "rocketchat_user_id_label",
        i18nDescription: "rocketchat_user_id_description",
        required: true,
    },
];
