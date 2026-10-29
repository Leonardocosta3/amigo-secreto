
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// Listar participantes de um evento
router.get("/", async (req, res) => {
  try {
    const eventoId = Number(req.query.eventoId);

    if (!Number.isInteger(eventoId) || eventoId <= 0) {
      return res.status(400).json({
        erro: "Informe um eventoId válido."
      });
    }

    const participantes = await prisma.participante.findMany({
      where: { eventoId },
      orderBy: { nome: "asc" }
    });

    return res.json(participantes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao listar participantes."
    });
  }
});

// Cadastrar participante
router.post("/", async (req, res) => {
  try {
    const { nome, email, telefone, eventoId } = req.body;

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      !Number.isInteger(eventoId) ||
      eventoId <= 0
    ) {
      return res.status(400).json({
        erro: "Nome e eventoId válido são obrigatórios."
      });
    }

    const evento = await prisma.evento.findUnique({
      where: { id: eventoId }
    });

    if (!evento) {
      return res.status(404).json({
        erro: "Evento não encontrado."
      });
    }

    if (evento.sorteioRealizadoEm !== null) {
      return res.status(409).json({
        erro: "Não é possível cadastrar participantes após o sorteio definitivo."
      });
    }

    const participante = await prisma.participante.create({
      data: {
        nome: nome.trim(),
        email: email || null,
        telefone: telefone || null,
        eventoId
      }
    });

    return res.status(201).json(participante);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao cadastrar participante."
    });
  }
});

// Editar participante
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        erro: "ID inválido."
      });
    }

    const { nome, email, telefone, ativo } = req.body;

    if (typeof nome !== "string" || !nome.trim()) {
      return res.status(400).json({
        erro: "Nome é obrigatório."
      });
    }

    if (ativo !== undefined && typeof ativo !== "boolean") {
      return res.status(400).json({
        erro: "Status ativo inválido."
      });
    }

    const existente = await prisma.participante.findUnique({
      where: { id },
      include: {
        evento: true
      }
    });

    if (!existente) {
      return res.status(404).json({
        erro: "Participante não encontrado."
      });
    }

    if (existente.evento.sorteioRealizadoEm !== null) {
      return res.status(409).json({
        erro: "Não é possível editar participantes após o sorteio definitivo."
      });
    }

    const participante = await prisma.participante.update({
      where: { id },
      data: {
        nome: nome.trim(),
        email: email || null,
        telefone: telefone || null,
        ...(ativo !== undefined ? { ativo } : {})
      }
    });

    return res.json(participante);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao editar participante."
    });
  }
});

// Excluir participante e suas restrições
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        erro: "ID inválido."
      });
    }

    const resultado = await prisma.$transaction(async (tx) => {

      // Localizar participante e evento
      const existente = await tx.participante.findUnique({
        where: { id },
        include: {
          evento: true
        }
      });

      if (!existente) {
        return {
          status: 404,
          erro: "Participante não encontrado."
        };
      }

      const eventoId = existente.eventoId;

      // Bloquear exclusão após sorteio definitivo
      const resultadoExistente =
        await tx.resultadoSorteio.findFirst({
          where: {
            eventoId
          },
          select: { id: true }
        });

      if (
        existente.evento.sorteioRealizadoEm !== null ||
        resultadoExistente
      ) {
        return {
          status: 409,
          erro: "Não é possível excluir participantes após o sorteio definitivo."
        };
      }

      // Remover restrições em que a pessoa aparece
      // como participante ou destinatário
      const restricoesExcluidas =
        await tx.restricao.deleteMany({
          where: {
            eventoId,
            OR: [
              { participanteId: id },
              { destinatarioId: id }
            ]
          }
        });

      // Remover eventual cadastro de acesso
      await tx.participanteAcesso.deleteMany({
        where: {
          participanteId: id
        }
      });

      // Excluir o participante
      await tx.participante.delete({
        where: { id }
      });

      return {
        status: 200,
        mensagem: "Participante excluído com sucesso!",
        restricoesExcluidas: restricoesExcluidas.count
      };
    });

    return res.status(resultado.status).json(
      resultado.status === 200
        ? {
            mensagem: resultado.mensagem,
            restricoesExcluidas: resultado.restricoesExcluidas
          }
        : {
            erro: resultado.erro
          }
    );

  } catch (error) {
    console.error("Erro ao excluir participante:", error);

    return res.status(500).json({
      erro: "Erro ao excluir participante."
    });
  }
});

export default router;
