import { Router } from "express";
import { prisma } from "../lib/prisma.js";

import {
  autenticar,
  type RequisicaoAutenticada
} from "../middlewares/autenticacao.js";

import { podeAdministrarEvento } from "../middlewares/permissaoEvento.js";

const router = Router();

router.use(autenticar);

// CRIAR EVENTO
router.post("/", async (req: RequisicaoAutenticada, res) => {
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

    const evento = await prisma.evento.create({
      data: {
        nome: nome.trim(),
        descricao: typeof descricao === "string" ? descricao : null,
        dataEvento: data,
        usuarioId: req.usuarioId!
      }
    });

    return res.status(201).json(evento);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao criar evento."
    });
  }
});

// LISTAR EVENTOS DO ORGANIZADOR
router.get("/", async (req: RequisicaoAutenticada, res) => {
  try {
    const eventos = await prisma.evento.findMany({
      where: { usuarioId: req.usuarioId! },
      orderBy: { criadoEm: "desc" },
      include: {
        _count: {
          select: { participantes: true }
        }
      }
    });

    return res.json(eventos);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao listar eventos."
    });
  }
});

// CONSULTAR EVENTO
router.get("/:id", async (req: RequisicaoAutenticada, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    if (!(await podeAdministrarEvento(req.usuarioId!, id))) {
      return res.status(404).json({
        erro: "Evento não encontrado."
      });
    }

    const evento = await prisma.evento.findUnique({
      where: { id },
      include: { participantes: true }
    });

    return res.json(evento);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao consultar evento."
    });
  }
});

export default router;