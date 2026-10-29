
import { prisma } from "./lib/prisma.js";

async function testarConexao() {
  try {
    console.log("Conectando ao TiDB Cloud...");

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    console.log("Conexão realizada com sucesso!");
    console.table(usuarios);
  } catch (erro) {
    console.error("Erro ao conectar ao TiDB:", erro);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testarConexao();
