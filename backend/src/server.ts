import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import participantesRoutes from "./routes/participantes.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import eventosRoutes from "./routes/eventos.routes.js";
import restricoesRoutes from "./routes/restricoes.routes.js";
import sorteioRoutes from "./routes/sorteio.routes.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    mensagem: "API Amigo Secreto funcionando!"
  });
});

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

app.use("/api/participantes", participantesRoutes);

const PORT = Number(process.env.PORT ?? 3001);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/restricoes", restricoesRoutes);
app.use("/api/sorteio", sorteioRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});