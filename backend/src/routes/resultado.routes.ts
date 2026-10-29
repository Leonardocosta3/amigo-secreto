
import { Router } from "express";
import { createHash } from "node:crypto";

import { prisma } from "../lib/prisma.js";

const router = Router();

// CONSULTAR RESULTADO INDIVIDUAL
// Rota pública, sem autenticação JWT.
router.get("/:token", async (req, res) => {
  // Evitar cache e exposição por referenciadores.
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  try {
    const token = String(req.params.token ?? "")
      .trim()
      .toLowerCase();

    // VALIDAR TOKEN
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(404).json({
        erro: "Link inválido ou expirado."
      });
    }

    // GERAR HASH SHA-256
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    // CONSULTAR RESULTADO NO BANCO
    const resultado = await prisma.resultadoSorteio.findUnique({
      where: {
        tokenHash
      },
      select: {
        evento: {
          select: {
            nome: true,
            dataEvento: true
          }
        },
        participante: {
          select: {
            nome: true
          }
        },
        sorteado: {
          select: {
            nome: true
          }
        }
      }
    });

    if (!resultado) {
      return res.status(404).json({
        erro: "Link inválido ou expirado."
      });
    }

    // RETORNAR SOMENTE O RESULTADO INDIVIDUAL
    return res.status(200).json({
      evento: resultado.evento.nome,
      dataEvento: resultado.evento.dataEvento,
      participante: resultado.participante.nome,
      sorteado: resultado.sorteado.nome
    });

  } catch (error) {
    console.error(
      "[RESULTADO] Erro ao consultar resultado:",
      error
    );

    return res.status(500).json({
      erro: "Não foi possível consultar o resultado."
    });
  }
});

export default router;
