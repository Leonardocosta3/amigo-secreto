
import type {
  Response,
  NextFunction
} from "express";

import type {
  RequisicaoAutenticada
} from "./autenticacao.js";

import { prisma } from "../lib/prisma.js";
import { podeAdministrarEvento } from "./permissaoEvento.js";

type Recurso = "participantes" | "restricoes";

export function autorizarEventoDados(recurso: Recurso) {
  return async (
    req: RequisicaoAutenticada,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let eventoId: number;

      if (
        (req.method === "GET" || req.method === "POST") &&
        req.path === "/"
      ) {
        eventoId = Number(
          req.method === "GET"
            ? req.query.eventoId
            : req.body?.eventoId
        );
      } else if (
        req.method === "PUT" ||
        req.method === "DELETE"
      ) {
        const correspondencia = /^\/(\d+)\/?$/.exec(req.path);

        if (!correspondencia) {
          next();
          return;
        }

        const id = Number(correspondencia[1]);

        if (!Number.isSafeInteger(id) || id <= 0) {
          res.status(400).json({ erro: "ID inválido." });
          return;
        }

        const registro =
          recurso === "participantes"
            ? await prisma.participante.findUnique({
                where: { id },
                select: { eventoId: true }
              })
            : await prisma.restricao.findUnique({
                where: { id },
                select: { eventoId: true }
              });

        if (!registro) {
          res.status(404).json({
            erro: "Registro não encontrado."
          });
          return;
        }

        eventoId = registro.eventoId;
      } else {
        next();
        return;
      }

      if (!Number.isSafeInteger(eventoId) || eventoId <= 0) {
        res.status(400).json({
          erro: "Evento inválido."
        });
        return;
      }

      const autorizado =
        req.usuarioId !== undefined &&
        await podeAdministrarEvento(req.usuarioId, eventoId);

      if (!autorizado) {
        res.status(404).json({
          erro: "Evento não encontrado."
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Erro de autorização:", error);

      res.status(500).json({
        erro: "Erro ao verificar permissão."
      });
    }
  };
}
