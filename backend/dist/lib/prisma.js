"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const client_js_1 = require("../generated/prisma/client.js");
const adapter = new adapter_mariadb_1.PrismaMariaDb({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
});
exports.prisma = new client_js_1.PrismaClient({ adapter });
//# sourceMappingURL=prisma.js.map