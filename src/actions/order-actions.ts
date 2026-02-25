"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { order } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function confirmOrderDelivery(orderId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Não autorizado" };
    }

    // Atualiza o STATUS geral para "completed" (Concluído)
    // O fulfillmentStatus já deve estar como "delivered" a esse ponto
    await db
      .update(order)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(and(eq(order.id, orderId), eq(order.userId, session.user.id)));

    revalidatePath("/minha-conta/compras");
    // Se o cliente puder ver isso no rastreio logado, vale revalidar a rota também:
    revalidatePath("/rastreio");

    return { success: true, message: "Pedido confirmado com sucesso!" };
  } catch (error) {
    console.error("Erro ao confirmar entrega:", error);
    return { success: false, error: "Erro interno ao confirmar entrega." };
  }
}
