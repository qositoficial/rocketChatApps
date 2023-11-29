"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const url = "http://127.0.0.1:3000/file-upload/LuthbRom9ojKp5Pwa/TcF8R5rxDPC1POYm%20(2).jpeg";
const authToken = "1rMX6Wti7iyyjGaEPTr9f_Qbxdg--V6QyinvfY6iuzf";
const userId = "rYNAMz9nmeysskEFp";
// Configuração do cabeçalho
const headers = {
    "X-Auth-Token": authToken,
    "X-User-Id": userId,
};
// Realiza a solicitação HTTP
axios_1.default
    .get(url, { headers, responseType: "arraybuffer" })
    .then((response) => {
    // Obtém o Content-Type do cabeçalho da resposta
    const contentType = response.headers["content-type"];
    // Converte a imagem para base64
    const base64Image = Buffer.from(response.data, "binary").toString("base64");
    console.log(`Content-Type: ${contentType}`);
    console.log(`data:${contentType};base64,${base64Image}`);
    // Agora você pode usar a variável base64Image para enviar a imagem via API, se necessário.
})
    .catch((error) => {
    console.error("Erro ao baixar a imagem:", error);
});
