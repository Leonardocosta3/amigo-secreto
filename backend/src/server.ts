
import "dotenv/config";

import express from "express";
import cors from "cors";

import { prisma } from "./lib/prisma.js";

// Rotas
import usuariosRoutes from "./routes/usuarios.routes.js";
import authRoutes from "./routes/auth.routes.js";
import eventosRoutes from "./routes/eventos.routes.js";
import participantesRoutes from "./routes/participantes.routes.js";
import restricoesRoutes from "./routes/restricoes.routes.js";
import sorteioRoutes from "./routes/sorteio.routes.js";
import resultadoRoutes from "./routes/resultado.routes.js";
import participanteAuthRoutes from "./routes/participante-auth.routes.js";

// Autenticação
import { autenticar } from "./middlewares/autenticacao.js";

const app = express();

// CONFIGURAÇÕES
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ]
  })
);

app.use(express.json());

// ROTA INICIAL
app.get("/", (_req, res) => {
  return res.json({
    mensagem: "API Amigo Secreto funcionando!"
  });
});

// TESTAR CONEXÃO COM O BANCO
app.get("/api/testar-banco", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.json({
      sucesso: true,
      mensagem: "MySQL conectado com sucesso!"
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao conectar ao MySQL."
    });
  }
});

// ROTAS PÚBLICAS
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/resultado", resultadoRoutes);

// ROTAS COM AUTENTICAÇÃO PRÓPRIA
// Estes roteadores já utilizam router.use(autenticar).
app.use("/api/eventos", eventosRoutes);
app.use("/api/sorteio", sorteioRoutes);
app.use("/api/participante-auth", participanteAuthRoutes);

// ROTAS PROTEGIDAS
app.use(
  "/api/participantes",
  autenticar,
  participantesRoutes
);

app.use(
  "/api/restricoes",
  autenticar,
  restricoesRoutes
);

// TRATAMENTO DE ROTAS NÃO ENCONTRADAS
app.use((req, res) => {
  console.warn(
    "[404]",
    req.method,
    req.originalUrl
  );

  return res.status(404).json({
    erro: "Rota não encontrada.",
    metodo: req.method,
    caminho: req.originalUrl
  });
});

// INICIAR SERVIDOR
const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
