
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

// Middleware de autenticação
import { autenticar } from "./middlewares/autenticacao.js";

// Inicializar Express
const app = express();

// Configurações
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]
}));

app.use(express.json());

// Rota inicial
app.get("/", (_req, res) => {
  res.json({
    mensagem: "API Amigo Secreto funcionando!"
  });
});

// Testar conexão com MySQL
app.get("/api/testar-banco", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      sucesso: true,
      mensagem: "MySQL conectado com sucesso!"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao conectar ao MySQL."
    });
  }
});

// ROTAS PÚBLICAS
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/auth", authRoutes);

// ROTAS PROTEGIDAS
app.use("/api/eventos", autenticar, eventosRoutes);
app.use("/api/participantes", autenticar, participantesRoutes);
app.use("/api/restricoes", autenticar, restricoesRoutes);
app.use("/api/sorteio", autenticar, sorteioRoutes);

// Iniciar servidor
const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
