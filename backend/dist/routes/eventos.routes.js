"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const autenticacao_js_1 = require("../middlewares/autenticacao.js");
const permissaoEvento_js_1 = require("../middlewares/permissaoEvento.js");
const router = (0, express_1.Router)();
// Todas as rotas exigem autenticação.
router.use(autenticacao_js_1.autenticar);
// =====================================================
// CRIAR EVENTO
// =====================================================
router.post("/", async (req, res) => {
    try {
        const { nome, descricao, dataEvento } = req.body ?? {};
        if (typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({
                erro: "Informe o nome do evento."
            });
        }
        const data = dataEvento ? new Date(dataEvento) : null;
        if (data && Number.isNaN(data.getTime())) {
            return res.status(400).json({
                erro: "Data inválida."
            });
        }
        const evento = await prisma_js_1.prisma.evento.create({
            data: {
                nome: nome.trim(),
                descricao: typeof descricao === "string"
                    ? descricao.trim()
                    : null,
                dataEvento: data,
                usuarioId: req.usuarioId
            }
        });
        return res.status(201).json(evento);
    }
    catch (error) {
        console.error("Erro ao criar evento:", error);
        return res.status(500).json({
            erro: "Erro ao criar evento."
        });
    }
});
// =====================================================
// LISTAR EVENTOS DO ORGANIZADOR
// =====================================================
router.get("/", async (req, res) => {
    try {
        const eventos = await prisma_js_1.prisma.evento.findMany({
            where: {
                usuarioId: req.usuarioId
            },
            orderBy: {
                criadoEm: "desc"
            },
            include: {
                _count: {
                    select: {
                        participantes: true
                    }
                }
            }
        });
        return res.json(eventos);
    }
    catch (error) {
        console.error("Erro ao listar eventos:", error);
        return res.status(500).json({
            erro: "Erro ao listar eventos."
        });
    }
});
// =====================================================
// CONSULTAR UM EVENTO
// =====================================================
router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID do evento inválido."
            });
        }
        const autorizado = await (0, permissaoEvento_js_1.podeAdministrarEvento)(req.usuarioId, id);
        if (!autorizado) {
            return res.status(404).json({
                erro: "Evento não encontrado."
            });
        }
        const evento = await prisma_js_1.prisma.evento.findUnique({
            where: { id },
            include: {
                participantes: true
            }
        });
        return res.json(evento);
    }
    catch (error) {
        console.error("Erro ao consultar evento:", error);
        return res.status(500).json({
            erro: "Erro ao consultar evento."
        });
    }
});
// =====================================================
// EXCLUIR EVENTO COMPLETAMENTE
// =====================================================
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        // Validar ID
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID do evento inválido."
            });
        }
        // Verificar se o evento pertence ao organizador
        const autorizado = await (0, permissaoEvento_js_1.podeAdministrarEvento)(req.usuarioId, id);
        if (!autorizado) {
            return res.status(404).json({
                erro: "Evento não encontrado ou sem permissão."
            });
        }
        // Excluir todos os dados em uma transação
        const resultado = await prisma_js_1.prisma.$transaction(async (tx) => {
            // Confirmar propriedade dentro da transação
            const evento = await tx.evento.findFirst({
                where: {
                    id,
                    usuarioId: req.usuarioId
                }
            });
            if (!evento) {
                throw new Error("EVENTO_NAO_ENCONTRADO");
            }
            // 1. Excluir resultados definitivos
            const resultados = await tx.resultadoSorteio.deleteMany({
                where: {
                    eventoId: id
                }
            });
            // 2. Excluir restrições
            const restricoes = await tx.restricao.deleteMany({
                where: {
                    eventoId: id
                }
            });
            // 3. Excluir acessos dos participantes
            const acessos = await tx.participanteAcesso.deleteMany({
                where: {
                    participante: {
                        eventoId: id
                    }
                }
            });
            // 4. Excluir participantes
            const participantes = await tx.participante.deleteMany({
                where: {
                    eventoId: id
                }
            });
            // 5. Excluir o evento
            await tx.evento.delete({
                where: {
                    id,
                    usuarioId: req.usuarioId
                }
            });
            return {
                nome: evento.nome,
                participantes: participantes.count,
                restricoes: restricoes.count,
                resultados: resultados.count,
                acessos: acessos.count
            };
        });
        return res.json({
            mensagem: "Evento excluído com sucesso!",
            evento: resultado.nome,
            excluidos: {
                participantes: resultado.participantes,
                restricoes: resultado.restricoes,
                resultados: resultado.resultados,
                acessos: resultado.acessos
            }
        });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message === "EVENTO_NAO_ENCONTRADO") {
            return res.status(404).json({
                erro: "Evento não encontrado."
            });
        }
        console.error("Erro ao excluir evento:", error);
        return res.status(500).json({
            erro: "Erro ao excluir evento."
        });
    }
});
exports.default = router;
//# sourceMappingURL=eventos.routes.js.map