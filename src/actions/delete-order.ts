"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { order, orderItem } from "@/db/schema"; // Importe orderItem para apagar os itens primeiro (cascata)

export async function deleteOrder(orderId: string) {
  try {
    // 1. Apagar itens do pedido primeiro (boa prática, embora alguns bancos façam cascata)
    await db.delete(orderItem).where(eq(orderItem.orderId, orderId));

    // 2. Apagar o pedido
    await db.delete(order).where(eq(order.id, orderId));

    // 3. Atualizar a página para sumir da lista
    revalidatePath("/minha-conta/compras");

    return { success: true };
  } catch (error) {
    console.error("Erro ao apagar pedido:", error);
    return { success: false, error: "Erro ao excluir pedido" };
  }
}
