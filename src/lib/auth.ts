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
    // Configuração para campos extras na tabela user
    additionalFields: {
      // 1. Configuração do Cargo (Mantida)
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // O usuário NÃO pode escolher ser admin
      },

      // 2. Configuração do Telefone (ADICIONADA)
      phoneNumber: {
        type: "string", // Tipo de dado (texto)
        required: false, // Não é obrigatório no nível do banco (pode vir null de login social)
        input: true, // <--- O SEGREDO: Permite receber este dado do frontend
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
