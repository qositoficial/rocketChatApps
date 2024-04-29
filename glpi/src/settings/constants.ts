export interface GlpiEnvironment {
    GLPI_API_URL: string;
    GLPI_APP_TOKEN: string;
    GLPI_USER_TOKEN: string;
    GLPI_SUBJECT_DEFAULT: string;
    GLPI_REQUEST_ORIGIN_ID: string;
    GLPI_DEFAULT_USER: string;
}

export interface GlpiEntity {}

export interface GlpiUser {}

export const timeout = 30000;
