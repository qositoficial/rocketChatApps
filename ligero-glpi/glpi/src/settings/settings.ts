import { IEnvironmentRead } from "@rocket.chat/apps-engine/definition/accessors";
import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

export const CONFIG_GLPI_API_URL = "glpi_api_url";
export const CONFIG_GLPI_USER_TOKEN = "glpi_user_token";
export const CONFIG_GLPI_APP_TOKEN = "glpi_app_token";
export const CONFIG_GLPI_DEPARTMENTS = "glpi_departments";

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
