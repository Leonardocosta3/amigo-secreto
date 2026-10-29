"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const router = (0, express_1.Router)();
// =====================================================
// VERIFICAR SE O SORTEIO DEFINITIVO JÁ FOI REALIZADO
// =====================================================
async function verificarSorteioDefinitivo(eventoId) {
    const evento = await prisma_js_1.prisma.evento.findUnique({
        where: { id: eventoId },
        select: {
            id: true,
            sorteioRealizadoEm: true
        }
    });
    if (!evento) {
        return {
            bloqueado: true,
            status: 404,
            erro: "Evento não encontrado."
        };
    }
    // Verificar se existem resultados definitivos
    const resultadoExistente = await prisma_js_1.prisma.resultadoSorteio.findFirst({
        where: { eventoId },
        select: { id: true }
    });
    if (evento.sorteioRealizadoEm !== null ||
        resultadoExistente !== null) {
        return {
            bloqueado: true,
            status: 409,
            erro: "Não é possível alterar restrições após o sorteio definitivo."
        };
    }
    return {
        bloqueado: false,
        status: 200,
        erro: ""
    };
}
// =====================================================
// CADASTRAR RESTRIÇÃO
// =====================================================
router.post("/", async (req, res) => {
    try {
        const { eventoId, participanteId, destinatarioId, tipo } = req.body;
        // Validar os dados recebidos
        if (!Number.isInteger(eventoId) ||
            !Number.isInteger(participanteId) ||
            !Number.isInteger(destinatarioId) ||
            eventoId <= 0 ||
            participanteId <= 0 ||
            destinatarioId <= 0 ||
            !["PERMITIDO", "PROIBIDO"].includes(tipo)) {
            return res.status(400).json({
                erro: "Dados da restrição inválidos."
            });
        }
        // Impedir restrição para a própria pessoa
        if (participanteId === destinatarioId) {
            return res.status(400).json({
                erro: "Não é permitido criar uma restrição para a própria pessoa."
            });
        }
        // Verificar se o sorteio já foi realizado
        const verificacao = await verificarSorteioDefinitivo(eventoId);
        if (verificacao.bloqueado) {
            return res.status(verificacao.status).json({
                erro: verificacao.erro
            });
        }
        // Verificar se ambos pertencem ao evento
        const participantes = await prisma_js_1.prisma.participante.findMany({
            where: {
                eventoId,
                id: {
                    in: [participanteId, destinatarioId]
                }
            }
        });
        if (participantes.length !== 2) {
            return res.status(400).json({
                erro: "Os dois participantes devem pertencer ao evento informado."
            });
        }
        // Verificar se a restrição já existe
        const existente = await prisma_js_1.prisma.restricao.findUnique({
            where: {
                eventoId_participanteId_destinatarioId_tipo: {
                    eventoId,
                    participanteId,
                    destinatarioId,
                    tipo
                }
            }
        });
        if (existente) {
            return res.status(409).json({
                erro: "Esta restrição já está cadastrada."
            });
        }
        // Cadastrar restrição
        const restricao = await prisma_js_1.prisma.restricao.create({
            data: {
                eventoId,
                participanteId,
                destinatarioId,
                tipo
            }
        });
        return res.status(201).json({
            mensagem: "Restrição cadastrada com sucesso!",
            restricao
        });
    }
    catch (error) {
        console.error("Erro ao cadastrar restrição:", error);
        return res.status(500).json({
            erro: "Erro ao cadastrar restrição."
        });
    }
});
// =====================================================
// LISTAR RESTRIÇÕES DE UM EVENTO
// =====================================================
router.get("/", async (req, res) => {
    try {
        const eventoId = Number(req.query.eventoId);
        if (!Number.isInteger(eventoId) ||
            eventoId <= 0) {
            return res.status(400).json({
                erro: "Informe um eventoId válido."
            });
        }
        const restricoes = await prisma_js_1.prisma.restricao.findMany({
            where: { eventoId },
            orderBy: { id: "asc" }
        });
        return res.json(restricoes);
    }
    catch (error) {
        console.error("Erro ao listar restrições:", error);
        return res.status(500).json({
            erro: "Erro ao listar restrições."
        });
    }
});
// =====================================================
// EXCLUIR RESTRIÇÃO
// =====================================================
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) ||
            id <= 0) {
            return res.status(400).json({
                erro: "ID inválido."
            });
        }
        // Localizar restrição
        const existente = await prisma_js_1.prisma.restricao.findUnique({
            where: { id }
        });
        if (!existente) {
            return res.status(404).json({
                erro: "Restrição não encontrada."
            });
        }
        // Verificar se o sorteio definitivo já ocorreu
        const verificacao = await verificarSorteioDefinitivo(existente.eventoId);
        if (verificacao.bloqueado) {
            return res.status(verificacao.status).json({
                erro: verificacao.erro
            });
        }
        // Excluir restrição
        await prisma_js_1.prisma.restricao.delete({
            where: { id }
        });
        return res.json({
            mensagem: "Restrição excluída com sucesso!"
        });
    }
    catch (error) {
        console.error("Erro ao excluir restrição:", error);
        return res.status(500).json({
            erro: "Erro ao excluir restrição."
        });
    }
});
exports.default = router;
//# sourceMappingURL=restricoes.routes.js.map