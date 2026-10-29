
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

// Validar variáveis obrigatórias
function obterVariavel(nome: string): string {
  const valor = process.env[nome];

  if (!valor) {
    throw new Error(
      `A variável de ambiente ${nome} não foi configurada.`
    );
  }

  return valor;
}

// Configuração da conexão MariaDB/MySQL
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: obterVariavel("DB_USER"),
  password: obterVariavel("DB_PASSWORD"),
  database: obterVariavel("DB_NAME"),
  connectionLimit: 5,
});

// Instância do Prisma
export const prisma = new PrismaClient({
  adapter,
});
