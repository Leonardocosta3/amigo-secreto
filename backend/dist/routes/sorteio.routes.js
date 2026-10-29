"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_crypto_1 = require("node:crypto");
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_rate_limit_1 = require("express-rate-limit");
const prisma_js_1 = require("../lib/prisma.js");
const sorteio_js_1 = require("../algorithms/sorteio.js");
const autenticacao_js_1 = require("../middlewares/autenticacao.js");
const permissaoEvento_js_1 = require("../middlewares/permissaoEvento.js");
const router = (0, express_1.Router)();
const limitarConsultaResultados = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        erro: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente."
    }
});
// Todas as rotas exigem autenticação.
router.use(autenticacao_js_1.autenticar);
function validarId(valor) {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}
function criarToken() {
    const token = (0, node_crypto_1.randomBytes)(32).toString("hex");
    const tokenHash = (0, node_crypto_1.createHash)("sha256")
        .update(token)
        .digest("hex");
    return { token, tokenHash };
}
async function verificarEvento(usuarioId, eventoId) {
    return (0, permissaoEvento_js_1.podeAdministrarEvento)(usuarioId, eventoId);
}
// SIMULAR SORTEIO
router.post("/simular/:eventoId", async (req, res) => {
    try {
        const eventoId = validarId(req.params.eventoId);
        if (!eventoId) {
            return res.status(400).json({
                erro: "ID do evento inválido."
            });
        }
        if (!(await verificarEvento(req.usuarioId, eventoId))) {
            return res.status(404).json({
                erro: "Evento não encontrado."
            });
        }
        const evento = await prisma_js_1.prisma.evento.findUnique({
            where: { id: eventoId },
            select: { sorteioRealizadoEm: true }
        });
        if (evento?.sorteioRealizadoEm) {
            return res.status(409).json({
                erro: "Este evento já possui sorteio definitivo."
            });
        }
        const participantes = await prisma_js_1.prisma.participante.findMany({
            where: { eventoId, ativo: true },
            select: { id: true, nome: true }
        });
        if (participantes.length < 3) {
            return res.status(422).json({
                erro: "Cadastre pelo menos 3 participantes ativos."
            });
        }
        const idsAtivos = participantes.map(p => p.id);
        const restricoes = await prisma_js_1.prisma.restricao.findMany({
            where: {
                eventoId,
                participanteId: { in: idsAtivos },
                destinatarioId: { in: idsAtivos }
            },
            select: {
                participanteId: true,
                destinatarioId: true,
                tipo: true
            }
        });
        const resultado = (0, sorteio_js_1.realizarSorteio)(participantes, restricoes);
        if (!resultado) {
            return res.status(422).json({
                erro: "Não foi possível simular o sorteio."
            });
        }
        const nomes = new Map(participantes.map(p => [p.id, p.nome]));
        return res.json({
            mensagem: "Simulação realizada com sucesso!",
            totalParticipantes: participantes.length,
            resultado: resultado.map(item => ({
                participanteId: item.participanteId,
                participante: nomes.get(item.participanteId),
                destinatarioId: item.destinatarioId,
                destinatario: nomes.get(item.destinatarioId)
            }))
        });
    }
    catch (error) {
        console.error("[SORTEIO] Simulação:", error);
        return res.status(500).json({
            erro: "Erro ao simular sorteio."
        });
    }
});
// CONSULTAR STATUS
router.get("/status/:eventoId", async (req, res) => {
    try {
        const eventoId = validarId(req.params.eventoId);
        if (!eventoId) {
            return res.status(400).json({
                erro: "ID do evento inválido."
            });
        }
        if (!(await verificarEvento(req.usuarioId, eventoId))) {
            return res.status(404).json({
                erro: "Evento não encontrado."
            });
        }
        const evento = await prisma_js_1.prisma.evento.findUnique({
            where: { id: eventoId },
            select: { sorteioRealizadoEm: true }
        });
        const resultados = await prisma_js_1.prisma.resultadoSorteio.findMany({
            where: { eventoId },
            select: {
                participanteId: true,
                participante: {
                    select: {
                        nome: true,
                        telefone: true
                    }
                }
            }
        });
        return res.json({
            realizado: Boolean(evento?.sorteioRealizadoEm),
            realizadoEm: evento?.sorteioRealizadoEm ?? null,
            participantes: resultados.map(item => ({
                participanteId: item.participanteId,
                nome: item.participante.nome,
                telefone: item.participante.telefone,
                token: null
            }))
        });
    }
    catch (error) {
        console.error("[SORTEIO] Status:", error);
        return res.status(500).json({
            erro: "Erro ao consultar status do sorteio."
        });
    }
});
// VISUALIZAR RESULTADOS COMPLETOS
// Somente o organizador proprietário do evento.
// router.get(
//   "/resultados/:eventoId",
//   async (req: RequisicaoAutenticada, res) => {
//     res.setHeader("Cache-Control", "no-store");
//     try {
//       const eventoId = validarId(req.params.eventoId);
//       if (!eventoId) {
//         return res.status(400).json({
//           erro: "ID do evento inválido."
//         });
//       }
//       if (!(await verificarEvento(req.usuarioId!, eventoId))) {
//         return res.status(404).json({
//           erro: "Evento não encontrado."
//         });
//       }
//       const evento = await prisma.evento.findUnique({
//         where: { id: eventoId },
//         select: {
//           nome: true,
//           sorteioRealizadoEm: true
//         }
//       });
//       if (!evento?.sorteioRealizadoEm) {
//         return res.status(409).json({
//           erro: "O sorteio definitivo ainda não foi realizado."
//         });
//       }
//       const resultados = await prisma.resultadoSorteio.findMany({
//         where: { eventoId },
//         select: {
//           participanteId: true,
//           participante: {
//             select: {
//               nome: true,
//               telefone: true
//             }
//           },
//           sorteadoId: true,
//           sorteado: {
//             select: {
//               nome: true
//             }
//           }
//         }
//       });
//       resultados.sort((a, b) =>
//         a.participante.nome.localeCompare(
//           b.participante.nome,
//           "pt-BR"
//         )
//       );
//       return res.json({
//         evento: evento.nome,
//         realizadoEm: evento.sorteioRealizadoEm,
//         totalParticipantes: resultados.length,
//         resultados: resultados.map(item => ({
//           participanteId: item.participanteId,
//           participante: item.participante.nome,
//           telefone: item.participante.telefone,
//           sorteadoId: item.sorteadoId,
//           sorteado: item.sorteado.nome
//         }))
//       });
//     } catch (error) {
//       console.error("[SORTEIO] Resultados:", error);
//       return res.status(500).json({
//         erro: "Erro ao consultar resultados do sorteio."
//       });
//     }
//   }
// );
// =====================================================
// VISUALIZAR RESULTADOS COMPLETOS
// EXIGE A SENHA DO ORGANIZADOR
// =====================================================
router.post("/resultados/:eventoId", limitarConsultaResultados, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
        const eventoId = validarId(req.params.eventoId);
        const { senha } = req.body ?? {};
        // Validar ID
        if (!eventoId) {
            return res.status(400).json({
                erro: "ID do evento inválido."
            });
        }
        // Verificar autenticação e propriedade do evento
        if (!(await verificarEvento(req.usuarioId, eventoId))) {
            return res.status(404).json({
                erro: "Evento não encontrado."
            });
        }
        // Validar senha informada
        if (typeof senha !== "string" ||
            senha.length === 0 ||
            senha.length > 1024) {
            return res.status(400).json({
                erro: "Informe a senha do organizador."
            });
        }
        // Consultar organizador autenticado
        const usuario = await prisma_js_1.prisma.usuario.findUnique({
            where: {
                id: req.usuarioId
            },
            select: {
                senhaHash: true
            }
        });
        if (!usuario) {
            return res.status(401).json({
                erro: "Usuário não encontrado."
            });
        }
        // Conferir senha usando bcrypt
        const senhaCorreta = await bcrypt_1.default.compare(senha, usuario.senhaHash);
        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "Senha do organizador incorreta."
            });
        }
        // Consultar evento
        const evento = await prisma_js_1.prisma.evento.findUnique({
            where: {
                id: eventoId
            },
            select: {
                nome: true,
                sorteioRealizadoEm: true
            }
        });
        if (!evento?.sorteioRealizadoEm) {
            return res.status(409).json({
                erro: "O sorteio definitivo ainda não foi realizado."
            });
        }
        // Buscar resultados completos
        const resultados = await prisma_js_1.prisma.resultadoSorteio.findMany({
            where: {
                eventoId
            },
            select: {
                participanteId: true,
                participante: {
                    select: {
                        nome: true,
                        telefone: true
                    }
                },
                sorteadoId: true,
                sorteado: {
                    select: {
                        nome: true
                    }
                }
            }
        });
        // Ordenar alfabeticamente
        resultados.sort((a, b) => a.participante.nome.localeCompare(b.participante.nome, "pt-BR"));
        // Retornar somente após validar a senha
        return res.json({
            evento: evento.nome,
            realizadoEm: evento.sorteioRealizadoEm,
            totalParticipantes: resultados.length,
            resultados: resultados.map(item => ({
                participanteId: item.participanteId,
                participante: item.participante.nome,
                telefone: item.participante.telefone,
                sorteadoId: item.sorteadoId,
                sorteado: item.sorteado.nome
            }))
        });
    }
    catch (error) {
        console.error("[SORTEIO] Resultados completos:", error);
        return res.status(500).json({
            erro: "Erro ao consultar resultados do sorteio."
        });
    }
});
// REALIZAR SORTEIO DEFINITIVO
router.post("/realizar/:eventoId", async (req, res) => {
    try {
        const eventoId = validarId(req.params.eventoId);
        if (!eventoId) {
            return res.status(400).json({
                erro: "ID do evento inválido."
            });
        }
        if (!(await verificarEvento(req.usuarioId, eventoId))) {
            return res.status(404).json({
                erro: "Evento não encontrado."
            });
        }
        const evento = await prisma_js_1.prisma.evento.findUnique({
            where: { id: eventoId },
            select: { sorteioRealizadoEm: true }
        });
        if (evento?.sorteioRealizadoEm) {
            return res.status(409).json({
                erro: "Este evento já foi sorteado."
            });
        }
        const participantes = await prisma_js_1.prisma.participante.findMany({
            where: { eventoId, ativo: true },
            select: { id: true, nome: true }
        });
        if (participantes.length < 3) {
            return res.status(422).json({
                erro: "Cadastre pelo menos 3 participantes ativos."
            });
        }
        const idsAtivos = participantes.map(p => p.id);
        const restricoes = await prisma_js_1.prisma.restricao.findMany({
            where: {
                eventoId,
                participanteId: { in: idsAtivos },
                destinatarioId: { in: idsAtivos }
            },
            select: {
                participanteId: true,
                destinatarioId: true,
                tipo: true
            }
        });
        const resultado = (0, sorteio_js_1.realizarSorteio)(participantes, restricoes);
        if (!resultado) {
            return res.status(422).json({
                erro: "Não foi possível realizar o sorteio com as restrições atuais."
            });
        }
        const origens = resultado.map(r => r.participanteId);
        const destinos = resultado.map(r => r.destinatarioId);
        const ids = new Set(idsAtivos);
        const valido = resultado.length === participantes.length &&
            new Set(origens).size === participantes.length &&
            new Set(destinos).size === participantes.length &&
            resultado.every(r => ids.has(r.participanteId) &&
                ids.has(r.destinatarioId) &&
                r.participanteId !== r.destinatarioId);
        if (!valido) {
            return res.status(422).json({
                erro: "O algoritmo retornou um sorteio inválido."
            });
        }
        const registros = resultado.map(item => ({
            ...criarToken(),
            eventoId,
            participanteId: item.participanteId,
            sorteadoId: item.destinatarioId
        }));
        await prisma_js_1.prisma.$transaction(async (tx) => {
            const atualizado = await tx.evento.updateMany({
                where: {
                    id: eventoId,
                    usuarioId: req.usuarioId,
                    sorteioRealizadoEm: null
                },
                data: {
                    sorteioRealizadoEm: new Date()
                }
            });
            if (atualizado.count !== 1) {
                throw new Error("SORTEIO_JA_REALIZADO");
            }
            await tx.resultadoSorteio.createMany({
                data: registros.map(({ token, ...registro }) => registro)
            });
        });
        return res.status(201).json({
            mensagem: "Sorteio definitivo realizado com sucesso!",
            totalParticipantes: participantes.length,
            links: registros.map(item => ({
                participanteId: item.participanteId,
                token: item.token
            }))
        });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message === "SORTEIO_JA_REALIZADO") {
            return res.status(409).json({
                erro: "O sorteio já foi realizado."
            });
        }
        console.error("[SORTEIO] Definitivo:", error);
        return res.status(500).json({
            erro: "Erro ao realizar sorteio definitivo."
        });
    }
});
// GERAR NOVO LINK INDIVIDUAL
router.post("/link/:eventoId/:participanteId", async (req, res) => {
    try {
        const eventoId = validarId(req.params.eventoId);
        const participanteId = validarId(req.params.participanteId);
        if (!eventoId || !participanteId) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }
        if (!(await verificarEvento(req.usuarioId, eventoId))) {
            return res.status(404).json({
                erro: "Evento não encontrado."
            });
        }
        const resultado = await prisma_js_1.prisma.resultadoSorteio.findFirst({
            where: {
                eventoId,
                participanteId
            },
            select: { id: true }
        });
        if (!resultado) {
            return res.status(404).json({
                erro: "Resultado do participante não encontrado."
            });
        }
        const { token, tokenHash } = criarToken();
        await prisma_js_1.prisma.resultadoSorteio.update({
            where: { id: resultado.id },
            data: { tokenHash }
        });
        return res.json({
            mensagem: "Novo link gerado com sucesso.",
            participanteId,
            token
        });
    }
    catch (error) {
        console.error("[SORTEIO] Novo link:", error);
        return res.status(500).json({
            erro: "Erro ao gerar novo link."
        });
    }
});
exports.default = router;
//# sourceMappingURL=sorteio.routes.js.map