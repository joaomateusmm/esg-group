"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid"; // ou crypto.randomUUID()
import { headers } from "next/headers";

import { db } from "@/db";
import { affiliate, user } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function registerAffiliate() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, message: "Você precisa estar logado." };
  }

  const userId = session.user.id;

  try {
    // 1. Verificar se já existe (opcional, mas bom pra evitar duplicatas)
    const existingAffiliate = await db.query.affiliate.findFirst({
      where: eq(affiliate.userId, userId),
    });

    if (existingAffiliate) {
      // Se já existe, garante que o user tem a flag true e redireciona
      await db
        .update(user)
        .set({ isAffiliate: true })
        .where(eq(user.id, userId));
      return { success: true, redirectUrl: "/afiliados/painel" };
    }

    // 2. Criar registro na tabela 'affiliate'
    await db.insert(affiliate).values({
      userId: userId,
      code: nanoid(10), // Gera um código único
      balance: 0,
      totalEarnings: 0,
      status: "active",
    });

    // 3. ATUALIZAR O USUÁRIO PARA SER AFILIADO (CRUCIAL!)
    await db
      .update(user)
      .set({ isAffiliate: true }) // <--- ISTO QUE ESTAVA FALTANDO OU FALHANDO
      .where(eq(user.id, userId));

    return { success: true, redirectUrl: "/afiliados/painel" };
  } catch (error) {
    console.error("Erro ao registrar afiliado:", error);
    return {
      success: false,
      message: "Erro interno ao criar conta de afiliado.",
    };
  }
}
