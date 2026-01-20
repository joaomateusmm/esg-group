"use server";

import { and,eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { order } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function confirmOrderDelivery(orderId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Não autorizado");
  }

  // Atualiza apenas se o pedido pertencer ao usuário logado
  await db
    .update(order)
    .set({ status: "delivered", updatedAt: new Date() })
    .where(and(eq(order.id, orderId), eq(order.userId, session.user.id)));

  revalidatePath("/minha-conta/compras");
}
