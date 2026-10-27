import type {
  Request,
  Response,
  NextFunction
} from "express";

import jwt, { type JwtPayload } from "jsonwebtoken";

export interface RequisicaoAutenticada extends Request {
  usuarioId?: number;
}

export function autenticar(
  req: RequisicaoAutenticada,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      erro: "Token de autenticação não informado."
    });
    return;
  }

  const token = authorization.slice(7);
  const segredo = process.env.JWT_SECRET;

  if (!segredo || segredo.length < 32) {
    res.status(500).json({
      erro: "Erro de configuração do servidor."
    });
    return;
  }

  try {
    const payload = jwt.verify(token, segredo, {
      algorithms: ["HS256"]
    });

    if (
      typeof payload === "string" ||
      typeof (payload as JwtPayload).sub !== "string"
    ) {
      res.status(401).json({
        erro: "Token inválido."
      });
      return;
    }

    const usuarioId = Number(payload.sub);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
      res.status(401).json({
        erro: "Token inválido."
      });
      return;
    }

    req.usuarioId = usuarioId;
    next();

  } catch {
    res.status(401).json({
      erro: "Token inválido ou expirado."
    });
  }
}