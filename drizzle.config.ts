import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle", // Pasta onde ficarão as migrações (se usarmos)
  schema: "./src/db/schema.ts", // Onde está o nosso esquema de tabelas
  dialect: "postgresql", // O tipo de banco de dados
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Lê a URL do ficheiro .env
  },
});
