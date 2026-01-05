import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db"; // Certifique-se que o caminho está correto
import * as schema from "@/db/schema"; // Importa todo o schema

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // Você está usando Neon (Postgres)
    schema: schema,
  }),
  user: {
    // Configuração crucial para o Painel Admin
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // Impede que o usuário defina seu próprio cargo no frontend
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
