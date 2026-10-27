import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// CADASTRAR EVENTO
router.post("/", async (req, res) => {
  try {
    const { nome, descricao, dataEvento, usuarioId } = req.body;

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0
    ) {
      return res.status(400).json({
        erro: "Nome do evento e usuarioId válido são obrigatórios."
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return res.status(404).json({
        erro: "Organizador não encontrado."
      });
    }

    const data = dataEvento ? new Date(dataEvento) : null;

    if (data && Number.isNaN(data.getTime())) {
      return res.status(400).json({
        erro: "Data do evento inválida."
      });
    }

    const evento = await prisma.evento.create({
      data: {
        nome: nome.trim(),
        descricao: descricao || null,
        dataEvento: data,
        usuarioId
      }
    });

    return res.status(201).json({
      mensagem: "Evento cadastrado com sucesso!",
      evento
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao cadastrar evento."
    });
  }
});

// LISTAR EVENTOS DE UM ORGANIZADOR
router.get("/", async (req, res) => {
  try {
    const usuarioId = Number(req.query.usuarioId);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({
        erro: "Informe um usuarioId válido."
      });
    }

    const eventos = await prisma.evento.findMany({
      where: { usuarioId },
      include: {
        _count: {
          select: { participantes: true }
        }
      },
      orderBy: { criadoEm: "desc" }
    });

    return res.json(eventos);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao listar eventos."
    });
  }
});

// CONSULTAR UM EVENTO
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        erro: "ID inválido."
      });
    }

    const evento = await prisma.evento.findUnique({
      where: { id },
      include: { participantes: true }
    });

    if (!evento) {
      return res.status(404).json({
        erro: "Evento não encontrado."
      });
    }

    return res.json(evento);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao consultar evento."
    });
  }
});

export default router;