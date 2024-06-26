import {
    IHttp,
    ILogger,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    CONFIG_GLPI_API_URL,
    CONFIG_GLPI_APP_TOKEN,
    CONFIG_GLPI_REQUEST_ORIGIN_ID,
    CONFIG_GLPI_SUBJECT_DEFAULT,
    CONFIG_GLPI_USER_TOKEN,
    getSettingValue,
} from "../settings/settings";
import GlpiInitSessionService from "./GlpiInitSession";
import GlpiKillSessionService from "./GlpiKillSession";
import { timeout } from "../models/Constants";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { ILivechatRoom } from "@rocket.chat/apps-engine/definition/livechat";

export default class GlpiCreateTicketService {
    public static async createTicket(
        room: IRoom,
        http: IHttp,
        read: IRead,
        logger: ILogger,
        GlpiFullUser: any,
        departmentName: string
    ) {
        let data: any = undefined;
        let roomMessages: any;
        const livechatRoom = room as ILivechatRoom;
        const roomPersisAss = new RocketChatAssociationRecord(
            RocketChatAssociationModel.ROOM,
            livechatRoom.id
        );

        const GLPIURL: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_API_URL
        );

        const GLPIAPPTOKEN: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_APP_TOKEN
        );

        const GLPIUSERTOKEN: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_USER_TOKEN
        );

        const GLPISESSIONTOKEN: string =
            await GlpiInitSessionService.GlpiInitSession(http, read, logger);

        const GLPISUBJECTDEFAULT: string = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_SUBJECT_DEFAULT
        );

        const GLPIREQUESTORIGINID: number = await getSettingValue(
            read.getEnvironmentReader(),
            CONFIG_GLPI_REQUEST_ORIGIN_ID
        );
        /*
        if (logger) {
            logger.debug(
                "GlpiCreateTicket.ts - Debug 01 - " + GLPISUBJECTDEFAULT
            );
        }
        */
        const ticketResponse = await http.post(
            GLPIURL + "/apirest.php/Ticket",
            {
                timeout: timeout,
                headers: {
                    "App-Token": GLPIAPPTOKEN,
                    "Session-Token": GLPISESSIONTOKEN,
                    "Content-Type": "application/json",
                },
                data: {
                    input: {
                        name: GLPISUBJECTDEFAULT,
                        content: `Ticket: ${GLPISUBJECTDEFAULT} \nDepartamento: ${departmentName}`,
                        _users_id_requester: GlpiFullUser.userID,
                        requesttypes_id: GLPIREQUESTORIGINID,
                        entities_id: GlpiFullUser.entity.entityID,
                        type: "2",
                    },
                },
            }
        );

        if (
            !ticketResponse ||
            !ticketResponse.statusCode ||
            ticketResponse.statusCode !== 201 ||
            (ticketResponse.content &&
                JSON.parse(ticketResponse.content)["ERROR"])
        ) {
            logger.error(
                "GlpiCreateTicket.ts - Error 01: " + ticketResponse.content
            );
            return undefined;
        }

        if (!ticketResponse || !ticketResponse.content) {
            logger.error("GlpiCreateTicket.ts - Error 02: NO return from GLPI");
            return undefined;
        }

        let ticketNumber = JSON.parse(ticketResponse.content);

        ticketNumber = ticketNumber.id;
        /*
        if (logger) {
            logger.debug(
                "GlpiCreateTicket.ts - Debug 02 - " +
                    JSON.stringify(ticketNumber)
            );
        }
        */

        roomMessages = await read
            .getPersistenceReader()
            .readByAssociation(roomPersisAss);

        data = {
            _id: livechatRoom.id,
            tags: `#${ticketNumber}`,
        };

        GlpiKillSessionService.GlpiKillSession(
            http,
            read,
            logger,
            GLPISESSIONTOKEN
        );

        return ticketNumber;
    }
}
