"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settings = exports.DefaultMessage = exports.AppSetting = void 0;
const settings_1 = require("@rocket.chat/apps-engine/definition/settings");
var AppSetting;
(function (AppSetting) {
    AppSetting["GlpiUrl"] = "glpi_url";
    AppSetting["GlpiAppToken"] = "glpi_app_token";
    AppSetting["GlpiUserToken"] = "glpi_user_token";
})(AppSetting || (exports.AppSetting = AppSetting = {}));
var DefaultMessage;
(function (DefaultMessage) {
    DefaultMessage["DEFAULT_GlpiUrl"] = "https://glpi.qosit.com.br";
    DefaultMessage["DEFAULT_GlpiAppToken"] = "ZANLMVZsZGdVX5ssjT5qtEpuAWkwh6CFG8eO8JcN";
    DefaultMessage["DEFAULT_GlpiUserToken"] = "AvLTALMT41WOuTsIotJHA9wAdjQ0LSukIcI24NxU";
})(DefaultMessage || (exports.DefaultMessage = DefaultMessage = {}));
exports.settings = [
    {
        id: AppSetting.GlpiUrl,
        public: true,
        type: settings_1.SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_GlpiUrl,
        i18nLabel: "glpi_url_label",
        i18nDescription: "glpi_url_description",
        required: true,
    },
    {
        id: AppSetting.GlpiAppToken,
        public: true,
        type: settings_1.SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_GlpiAppToken,
        i18nLabel: "glpi_app_token_label",
        i18nDescription: "glpi_app_token_description",
        required: true,
    },
    {
        id: AppSetting.GlpiUserToken,
        public: true,
        type: settings_1.SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_GlpiUserToken,
        i18nLabel: "glpi_user_token_label",
        i18nDescription: "glpi_user_token_description",
        required: true,
    },
];
