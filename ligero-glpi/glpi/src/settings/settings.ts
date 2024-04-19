import { IEnvironmentRead } from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export const CONFIG_GLPI_API_URL = "glpi_api_url";
export const CONFIG_GLPI_USER_TOKEN = "glpi_user_token";
export const CONFIG_GLPI_APP_TOKEN = "glpi_app_token";
export const CONFIG_GLPI_DEPARTMENTS = "glpi_departments";
export const CONFIG_GLPI_SUBJECT_DEFAULT = "glpi_subject_default";
export const CONFIG_GLPI_REQUEST_ORIGIN_ID = "glpi_request_origin_id";
export const CONFIG_GLPI_DEFAULT_USER = "glpi_default_user";
export const CONFIG_GLPI_NEW_TICKET_MESSAGE = "glpi_new_ticket_message";

export const SETTINGS: Array<ISetting> = [
    {
        id: CONFIG_GLPI_API_URL,
        type: SettingType.STRING,
        packageValue: "http://glpi",
        required: true,
        public: false,
        i18nLabel: `config_${CONFIG_GLPI_API_URL}_label`,
        i18nDescription: `config_${CONFIG_GLPI_API_URL}_description`,
    },
    {
        id: CONFIG_GLPI_USER_TOKEN,
        type: SettingType.STRING,
        packageValue: "glpi_user_token",
        required: true,
        public: false,
        i18nLabel: `config_${CONFIG_GLPI_USER_TOKEN}_label`,
        i18nDescription: `config_${CONFIG_GLPI_USER_TOKEN}_description`,
    },
    {
        id: CONFIG_GLPI_APP_TOKEN,
        type: SettingType.STRING,
        packageValue: "glpi_app_token",
        required: true,
        public: false,
        i18nLabel: `config_${CONFIG_GLPI_APP_TOKEN}_label`,
        i18nDescription: `config_${CONFIG_GLPI_APP_TOKEN}_description`,
    },
    {
        id: CONFIG_GLPI_DEPARTMENTS,
        type: SettingType.STRING,
        packageValue: "Depatamento 01, Departamento 02",
        required: true,
        public: false,
        i18nLabel: `config_${CONFIG_GLPI_DEPARTMENTS}_label`,
        i18nDescription: `config_${CONFIG_GLPI_DEPARTMENTS}_description`,
    },
    {
        id: CONFIG_GLPI_SUBJECT_DEFAULT,
        type: SettingType.STRING,
        packageValue: "Chat Ticket",
        required: true,
        public: false,
        i18nLabel: `config_${CONFIG_GLPI_SUBJECT_DEFAULT}_label`,
        i18nDescription: `config_${CONFIG_GLPI_SUBJECT_DEFAULT}_description`,
    },
    {
        id: CONFIG_GLPI_REQUEST_ORIGIN_ID,
        type: SettingType.NUMBER,
        packageValue: 6,
        required: true,
        public: false,
        i18nLabel: `config_${CONFIG_GLPI_REQUEST_ORIGIN_ID}_label`,
        i18nDescription: `config_${CONFIG_GLPI_REQUEST_ORIGIN_ID}_description`,
    },
    {
        id: CONFIG_GLPI_DEFAULT_USER,
        type: SettingType.STRING,
        packageValue: "rocketchat",
        required: true,
        public: false,
        i18nLabel: `config_${CONFIG_GLPI_DEFAULT_USER}_label`,
        i18nDescription: `config_${CONFIG_GLPI_DEFAULT_USER}_description`,
    },
    {
        id: CONFIG_GLPI_NEW_TICKET_MESSAGE,
        type: SettingType.STRING,
        packageValue: "The ticket %s was created for this chat session.",
        required: true,
        public: false,
        i18nLabel: `config_${CONFIG_GLPI_NEW_TICKET_MESSAGE}_label`,
        i18nDescription: `config_${CONFIG_GLPI_NEW_TICKET_MESSAGE}_description`,
    },
];

export async function getSettingValue(
    environmentRead: IEnvironmentRead,
    settingId: string
): Promise<any> {
    const setting = (await environmentRead
        .getSettings()
        .getById(settingId)) as ISetting;

    return setting.value;
}
