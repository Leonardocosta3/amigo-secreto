"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../lib/prisma.js");
const autenticacao_js_1 = require("../middlewares/autenticacao.js");
const router = (0, express_1.Router)();
router.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body ?? {};
        if (typeof email !== "string" ||
            typeof senha !== "string" ||
            !email.trim() ||
            !senha) {
            return res.status(400).json({
                erro: "Informe e-mail e senha."
            });
        }
        const emailNormalizado = email.trim().toLowerCase();
        const usuario = await prisma_js_1.prisma.usuario.findUnique({
            where: { email: emailNormalizado }
        });
        if (!usuario) {
            return res.status(401).json({
                erro: "E-mail ou senha inválidos."
            });
        }
        const senhaCorreta = await bcrypt_1.default.compare(senha, usuario.senhaHash);
        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "E-mail ou senha inválidos."
            });
        }
        const segredo = process.env.JWT_SECRET;
        if (!segredo || segredo.length < 32) {
            console.error("JWT_SECRET não configurado corretamente.");
            return res.status(500).json({
                erro: "Erro de configuração do servidor."
            });
        }
        const token = jsonwebtoken_1.default.sign({}, segredo, {
            subject: String(usuario.id),
            expiresIn: "2h",
            algorithm: "HS256"
        });
        return res.json({
            mensagem: "Login realizado com sucesso!",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            erro: "Erro ao realizar login."
        });
    }
});
router.get("/me", autenticacao_js_1.autenticar, async (req, res) => {
    try {
        const usuario = await prisma_js_1.prisma.usuario.findUnique({
            where: { id: req.usuarioId },
            select: {
                id: true,
                nome: true,
                email: true
            }
        });
        if (!usuario) {
            return res.status(401).json({
                erro: "Usuário não encontrado."
            });
        }
        return res.json({ usuario });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            erro: "Erro ao consultar usuário."
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map