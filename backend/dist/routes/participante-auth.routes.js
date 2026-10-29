"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = require("node:crypto");
const express_rate_limit_1 = require("express-rate-limit");
// IMPORTANTE: use o mesmo import do Prisma das outras rotas.
const prisma_js_1 = require("../lib/prisma.js");
const router = (0, express_1.Router)();
const limitarTentativas = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        erro: "Muitas tentativas. Aguarde 15 minutos."
    }
});
function hashToken(token) {
    return (0, node_crypto_1.createHash)("sha256")
        .update(token)
        .digest("hex");
}
function chaveJwt() {
    const chave = process.env.PARTICIPANTE_JWT_SECRET;
    if (!chave || chave.length < 32) {
        throw new Error("PARTICIPANTE_JWT_SECRET não configurada corretamente.");
    }
    return chave;
}
function gerarJwt(participanteId) {
    return jsonwebtoken_1.default.sign({ participanteId, tipo: "participante" }, chaveJwt(), { expiresIn: "12h" });
}
// Consultar convite, sem revelar o sorteado.
router.get("/convite/:token", async (req, res) => {
    try {
        const token = String(req.params.token ?? "");
        if (!/^[a-f0-9]{64}$/i.test(token)) {
            return res.status(400).json({
                erro: "Convite inválido."
            });
        }
        const resultado = await prisma_js_1.prisma.resultadoSorteio.findUnique({
            where: { tokenHash: hashToken(token) },
            include: {
                evento: true,
                participante: {
                    include: { acesso: true }
                }
            }
        });
        if (!resultado) {
            return res.status(404).json({
                erro: "Convite não encontrado ou expirado."
            });
        }
        return res.json({
            eventoId: resultado.eventoId,
            evento: resultado.evento.nome,
            participante: resultado.participante.nome,
            cadastrado: Boolean(resultado.participante.acesso)
        });
    }
    catch (error) {
        console.error("Erro ao consultar convite:", error);
        return res.status(500).json({
            erro: "Erro ao consultar convite."
        });
    }
});
// Primeiro acesso: cadastrar senha.
router.post("/cadastrar", limitarTentativas, async (req, res) => {
    try {
        const { token, senha } = req.body ?? {};
        if (typeof token !== "string" ||
            !/^[a-f0-9]{64}$/i.test(token) ||
            typeof senha !== "string" ||
            senha.length < 8 ||
            senha.length > 72) {
            return res.status(400).json({
                erro: "Convite ou senha inválidos."
            });
        }
        const resultado = await prisma_js_1.prisma.resultadoSorteio.findUnique({
            where: { tokenHash: hashToken(token) },
            include: {
                participante: {
                    include: { acesso: true }
                }
            }
        });
        if (!resultado) {
            return res.status(404).json({
                erro: "Convite inválido ou expirado."
            });
        }
        if (resultado.participante.acesso) {
            return res.status(409).json({
                erro: "Participante já cadastrado. Faça login."
            });
        }
        const senhaHash = await bcryptjs_1.default.hash(senha, 12);
        // A restrição unique no participanteId também impede
        // cadastros simultâneos duplicados.
        try {
            await prisma_js_1.prisma.participanteAcesso.create({
                data: {
                    participanteId: resultado.participanteId,
                    senhaHash
                }
            });
        }
        catch (error) {
            console.error("Falha ao cadastrar acesso:", error);
            return res.status(409).json({
                erro: "Não foi possível cadastrar. Verifique se o participante já possui acesso."
            });
        }
        return res.status(201).json({
            mensagem: "Senha cadastrada com sucesso.",
            participante: resultado.participante.nome,
            token: gerarJwt(resultado.participanteId)
        });
    }
    catch (error) {
        console.error("Erro no cadastro:", error);
        return res.status(500).json({
            erro: "Erro ao cadastrar participante."
        });
    }
});
// Login do participante.
router.post("/login", limitarTentativas, async (req, res) => {
    try {
        const { eventoId, nome, senha } = req.body ?? {};
        const id = Number(eventoId);
        if (!Number.isSafeInteger(id) ||
            id <= 0 ||
            typeof nome !== "string" ||
            !nome.trim() ||
            typeof senha !== "string") {
            return res.status(400).json({
                erro: "Informe evento, nome e senha."
            });
        }
        const participantes = await prisma_js_1.prisma.participante.findMany({
            where: {
                eventoId: id,
                nome: nome.trim()
            },
            include: { acesso: true },
            take: 2
        });
        if (participantes.length > 1) {
            return res.status(409).json({
                erro: "Existem participantes com o mesmo nome neste evento. Contate o organizador."
            });
        }
        const participante = participantes[0];
        if (!participante?.acesso) {
            return res.status(401).json({
                erro: "Credenciais inválidas."
            });
        }
        const senhaValida = await bcryptjs_1.default.compare(senha, participante.acesso.senhaHash);
        if (!senhaValida) {
            return res.status(401).json({
                erro: "Credenciais inválidas."
            });
        }
        return res.json({
            mensagem: "Login realizado com sucesso.",
            participante: participante.nome,
            token: gerarJwt(participante.id)
        });
    }
    catch (error) {
        console.error("Erro no login:", error);
        return res.status(500).json({
            erro: "Erro ao realizar login."
        });
    }
});
// Consultar exclusivamente o próprio resultado.
router.get("/resultado", async (req, res) => {
    try {
        const autorizacao = req.headers.authorization;
        if (!autorizacao?.startsWith("Bearer ")) {
            return res.status(401).json({
                erro: "Faça login para visualizar o resultado."
            });
        }
        const token = autorizacao.slice(7);
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, chaveJwt(), {
                algorithms: ["HS256"]
            });
        }
        catch {
            return res.status(401).json({
                erro: "Sessão inválida ou expirada."
            });
        }
        if (typeof payload === "string" ||
            payload.tipo !== "participante" ||
            typeof payload.participanteId !== "number") {
            return res.status(401).json({
                erro: "Sessão inválida."
            });
        }
        const resultado = await prisma_js_1.prisma.resultadoSorteio.findUnique({
            where: {
                participanteId: payload.participanteId
            },
            include: {
                evento: true,
                participante: {
                    include: { acesso: true }
                },
                sorteado: true
            }
        });
        if (!resultado?.participante.acesso) {
            return res.status(404).json({
                erro: "Resultado não encontrado."
            });
        }
        return res.json({
            evento: resultado.evento.nome,
            dataEvento: resultado.evento.dataEvento,
            participante: resultado.participante.nome,
            sorteado: resultado.sorteado.nome
        });
    }
    catch (error) {
        console.error("Erro ao consultar resultado:", error);
        return res.status(500).json({
            erro: "Erro ao consultar resultado."
        });
    }
});
exports.default = router;
//# sourceMappingURL=participante-auth.routes.js.map