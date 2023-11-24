const url =
    "http://127.0.0.1:3000/file-upload/LuthbRom9ojKp5Pwa/TcF8R5rxDPC1POYm%20(2).jpeg";
const authToken = "1rMX6Wti7iyyjGaEPTr9f_Qbxdg--V6QyinvfY6iuzf";
const userId = "rYNAMz9nmeysskEFp";

// Configuração do cabeçalho
const headers = {
    "X-Auth-Token": authToken,
    "X-User-Id": userId,
};

// Realiza a solicitação HTTP usando fetch
fetch(url, {
    headers,
    method: "GET",
})
    .then((response) => {
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.status}`);
        }

        // Obtém o Content-Type do cabeçalho da resposta
        const contentType = response.headers.get("Content-Type");

        return { data: response.arrayBuffer(), contentType };
    })
    .then(({ data, contentType }) => {
        // Converte a imagem para base64
        const base64Image = `data:${contentType};base64,${Buffer.from(
            data,
            "binary"
        ).toString("base64")}`;

        console.log(`Content-Type: ${contentType}`);
        console.log(base64Image);

        // Agora você pode usar a variável base64Image para enviar a imagem via API, se necessário.
    })
    .catch((error) => {
        console.error("Erro ao baixar a imagem:", error);
    });
