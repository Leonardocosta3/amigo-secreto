import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { realizarSorteio } from "../algorithms/sorteio.js";

const router = Router();

router.post("/simular/:eventoId", async (req, res) => {
  try {
    const eventoId = Number(req.params.eventoId);

    if (!Number.isInteger(eventoId) || eventoId <= 0) {
      return res.status(400).json({
        erro: "ID do evento inválido."
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

    const participantes = await prisma.participante.findMany({
      where: {
        eventoId,
        ativo: true
      },
      select: {
        id: true,
        nome: true
      }
    });

    const restricoes = await prisma.restricao.findMany({
      where: { eventoId },
      select: {
        participanteId: true,
        destinatarioId: true,
        tipo: true
      }
    });

    const resultado = realizarSorteio(
      participantes,
      restricoes
    );

    if (!resultado) {
      return res.status(422).json({
        erro: "Não foi possível realizar o sorteio com as regras atuais."
      });
    }

    const nomes = new Map(
      participantes.map(p => [p.id, p.nome])
    );

    const resultadoDetalhado = resultado.map(item => ({
      participanteId: item.participanteId,
      participante: nomes.get(item.participanteId),
      destinatarioId: item.destinatarioId,
      destinatario: nomes.get(item.destinatarioId)
    }));

    return res.json({
      mensagem: "Simulação realizada com sucesso!",
      totalParticipantes: participantes.length,
      resultado: resultadoDetalhado
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao simular sorteio."
    });
  }
});

export default router;