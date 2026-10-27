import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import {
  autenticar,
  type RequisicaoAutenticada
} from "../middlewares/autenticacao.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      !email.trim() ||
      !senha
    ) {
      return res.status(400).json({
        erro: "Informe e-mail e senha."
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const usuario = await prisma.usuario.findUnique({
      where: { email: emailNormalizado }
    });

    if (!usuario) {
      return res.status(401).json({
        erro: "E-mail ou senha inválidos."
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senhaHash
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: "E-mail ou senha inválidos."
      });
    }

    const segredo = process.env.JWT_SECRET;

    if (!segredo || segredo.length < 32) {
      console.error("JWT_SECRET não configurado corretamente.");

      return res.status(500).json({
        erro: "Erro de configuração do servidor."
      });
    }

    const token = jwt.sign(
      {},
      segredo,
      {
        subject: String(usuario.id),
        expiresIn: "2h",
        algorithm: "HS256"
      }
    );

    return res.json({
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao realizar login."
    });
  }
});

router.get(
  "/me",
  autenticar,
  async (req: RequisicaoAutenticada, res) => {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.usuarioId },
        select: {
          id: true,
          nome: true,
          email: true
        }
      });

      if (!usuario) {
        return res.status(401).json({
          erro: "Usuário não encontrado."
        });
      }

      return res.json({ usuario });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        erro: "Erro ao consultar usuário."
      });
    }
  }
);

export default router;