"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { affiliate } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function registerAffiliate() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Você precisa estar logado.");
  }

  const user = session.user;

  // 1. Verifica se já é afiliado
  const existingAffiliate = await db.query.affiliate.findFirst({
    where: eq(affiliate.userId, user.id),
  });

  if (existingAffiliate) {
    return { success: true, redirectUrl: "/afiliados/painel" };
  }

  // 2. Gerar um código único (Ex: JOAO-X92)
  // Pegamos o primeiro nome e adicionamos 4 caracteres aleatórios
  const firstName = user.name
    .split(" ")[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `${firstName}-${randomSuffix}`;

  try {
    // 3. Criar o registro no banco
    await db.insert(affiliate).values({
      userId: user.id,
      code: code,
      status: "active",
      balance: 0,
      totalEarnings: 0,
    });

    return { success: true, redirectUrl: "/afiliados/painel" };
  } catch (error) {
    console.error("Erro ao criar afiliado:", error);
    throw new Error("Erro ao criar conta de afiliado.");
  }
}
