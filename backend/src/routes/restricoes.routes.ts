import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// CADASTRAR RESTRIÇÃO
router.post("/", async (req, res) => {
  try {
    const {
      eventoId,
      participanteId,
      destinatarioId,
      tipo
    } = req.body;

    if (
      !Number.isInteger(eventoId) ||
      !Number.isInteger(participanteId) ||
      !Number.isInteger(destinatarioId) ||
      eventoId <= 0 ||
      participanteId <= 0 ||
      destinatarioId <= 0 ||
      !["PERMITIDO", "PROIBIDO"].includes(tipo)
    ) {
      return res.status(400).json({
        erro: "Dados da restrição inválidos."
      });
    }

    if (participanteId === destinatarioId) {
      return res.status(400).json({
        erro: "Não é permitido criar uma restrição para a própria pessoa."
      });
    }

    const participantes = await prisma.participante.findMany({
      where: {
        eventoId,
        id: { in: [participanteId, destinatarioId] }
      }
    });

    if (participantes.length !== 2) {
      return res.status(400).json({
        erro: "Os dois participantes devem pertencer ao evento informado."
      });
    }

    const existente = await prisma.restricao.findUnique({
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

    const restricao = await prisma.restricao.create({
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

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao cadastrar restrição."
    });
  }
});

// LISTAR RESTRIÇÕES DE UM EVENTO
router.get("/", async (req, res) => {
  try {
    const eventoId = Number(req.query.eventoId);

    if (!Number.isInteger(eventoId) || eventoId <= 0) {
      return res.status(400).json({
        erro: "Informe um eventoId válido."
      });
    }

    const restricoes = await prisma.restricao.findMany({
      where: { eventoId },
      orderBy: { id: "asc" }
    });

    return res.json(restricoes);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao listar restrições."
    });
  }
});

// EXCLUIR RESTRIÇÃO
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        erro: "ID inválido."
      });
    }

    const existente = await prisma.restricao.findUnique({
      where: { id }
    });

    if (!existente) {
      return res.status(404).json({
        erro: "Restrição não encontrada."
      });
    }

    await prisma.restricao.delete({
      where: { id }
    });

    return res.json({
      mensagem: "Restrição excluída com sucesso!"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao excluir restrição."
    });
  }
});

export default router;