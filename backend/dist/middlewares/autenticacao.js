"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autenticar = autenticar;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function autenticar(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
            erro: "Token de autenticação não informado."
        });
        return;
    }
    const token = authorization.slice(7);
    const segredo = process.env.JWT_SECRET;
    if (!segredo || segredo.length < 32) {
        res.status(500).json({
            erro: "Erro de configuração do servidor."
        });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, segredo, {
            algorithms: ["HS256"]
        });
        if (typeof payload === "string" ||
            typeof payload.sub !== "string") {
            res.status(401).json({
                erro: "Token inválido."
            });
            return;
        }
        const usuarioId = Number(payload.sub);
        if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
            res.status(401).json({
                erro: "Token inválido."
            });
            return;
        }
        req.usuarioId = usuarioId;
        next();
    }
    catch {
        res.status(401).json({
            erro: "Token inválido ou expirado."
        });
    }
}
//# sourceMappingURL=autenticacao.js.map