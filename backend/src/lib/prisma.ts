
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

// Configurar TLS somente quando solicitado
const usarSSL = process.env.DB_SSL === "true";

const ssl = usarSSL
  ? {
      ca: readFileSync(
        resolve(
          process.cwd(),
          process.env.DB_SSL_CA ?? "certs/ca.pem"
        ),
        "utf8"
      ),
      rejectUnauthorized: true,
    }
  : undefined;

// Configuração MySQL / TiDB Cloud
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: obterVariavel("DB_USER"),
  password: obterVariavel("DB_PASSWORD"),
  database: obterVariavel("DB_NAME"),
  connectionLimit: 5,
  connectTimeout: 10000,
  ...(ssl ? { ssl } : {}),
});

// Instância do Prisma
export const prisma = new PrismaClient({
  adapter,
});
