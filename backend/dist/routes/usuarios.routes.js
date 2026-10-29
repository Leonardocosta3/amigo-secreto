"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_js_1 = require("../lib/prisma.js");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        if (typeof nome !== "string" ||
            !nome.trim() ||
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            typeof senha !== "string" ||
            senha.length < 8) {
            return res.status(400).json({
                erro: "Informe nome, e-mail válido e senha com pelo menos 8 caracteres."
            });
        }
        const emailNormalizado = email.trim().toLowerCase();
        const existente = await prisma_js_1.prisma.usuario.findUnique({
            where: { email: emailNormalizado }
        });
        if (existente) {
            return res.status(409).json({
                erro: "Este e-mail já está cadastrado."
            });
        }
        const senhaHash = await bcrypt_1.default.hash(senha, 12);
        const usuario = await prisma_js_1.prisma.usuario.create({
            data: {
                nome: nome.trim(),
                email: emailNormalizado,
                senhaHash
            },
            select: {
                id: true,
                nome: true,
                email: true,
                criadoEm: true
            }
        });
        return res.status(201).json({
            mensagem: "Organizador cadastrado com sucesso!",
            usuario
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            erro: "Erro ao cadastrar organizador."
        });
    }
});
exports.default = router;
//# sourceMappingURL=usuarios.routes.js.map