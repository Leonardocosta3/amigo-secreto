"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const prisma_js_1 = require("./lib/prisma.js");
// Rotas
const usuarios_routes_js_1 = __importDefault(require("./routes/usuarios.routes.js"));
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const eventos_routes_js_1 = __importDefault(require("./routes/eventos.routes.js"));
const participantes_routes_js_1 = __importDefault(require("./routes/participantes.routes.js"));
const restricoes_routes_js_1 = __importDefault(require("./routes/restricoes.routes.js"));
const sorteio_routes_js_1 = __importDefault(require("./routes/sorteio.routes.js"));
const resultado_routes_js_1 = __importDefault(require("./routes/resultado.routes.js"));
const participante_auth_routes_js_1 = __importDefault(require("./routes/participante-auth.routes.js"));
// Autenticação
const autenticacao_js_1 = require("./middlewares/autenticacao.js");
const app = (0, express_1.default)();
// CONFIGURAÇÕES
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
}));
app.use(express_1.default.json());
// ROTA INICIAL
app.get("/", (_req, res) => {
    return res.json({
        mensagem: "API Amigo Secreto funcionando!"
    });
});
// TESTAR CONEXÃO COM O BANCO
app.get("/api/testar-banco", async (_req, res) => {
    try {
        await prisma_js_1.prisma.$queryRaw `SELECT 1`;
        return res.json({
            sucesso: true,
            mensagem: "MySQL conectado com sucesso!"
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao conectar ao MySQL."
        });
    }
});
// ROTAS PÚBLICAS
app.use("/api/usuarios", usuarios_routes_js_1.default);
app.use("/api/auth", auth_routes_js_1.default);
app.use("/api/resultado", resultado_routes_js_1.default);
// ROTAS COM AUTENTICAÇÃO PRÓPRIA
// Estes roteadores já utilizam router.use(autenticar).
app.use("/api/eventos", eventos_routes_js_1.default);
app.use("/api/sorteio", sorteio_routes_js_1.default);
app.use("/api/participante-auth", participante_auth_routes_js_1.default);
// ROTAS PROTEGIDAS
app.use("/api/participantes", autenticacao_js_1.autenticar, participantes_routes_js_1.default);
app.use("/api/restricoes", autenticacao_js_1.autenticar, restricoes_routes_js_1.default);
// TRATAMENTO DE ROTAS NÃO ENCONTRADAS
app.use((req, res) => {
    console.warn("[404]", req.method, req.originalUrl);
    return res.status(404).json({
        erro: "Rota não encontrada.",
        metodo: req.method,
        caminho: req.originalUrl
    });
});
// INICIAR SERVIDOR
const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
//# sourceMappingURL=server.js.map