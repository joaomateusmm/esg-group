import "server-only"; // Mantém isso para garantir segurança

import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

// O Next.js já injeta o process.env.DATABASE_URL automaticamente
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

export const db = drizzle(process.env.DATABASE_URL, { schema });
