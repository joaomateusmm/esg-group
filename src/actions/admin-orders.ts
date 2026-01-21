"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { order } from "@/db/schema";

// Atualiza o status de UM pedido
export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    await db
      .update(order)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(order.id, orderId));

    revalidatePath("/admin/pedidos");
    return { success: true, message: "Status atualizado com sucesso!" };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { success: false, message: "Erro ao atualizar status." };
  }
}

// Atualiza o código de rastreio
export async function updateTrackingCode(orderId: string, code: string) {
  try {
    await db
      .update(order)
      .set({ trackingCode: code, updatedAt: new Date() })
      .where(eq(order.id, orderId));

    revalidatePath("/admin/pedidos");
    return { success: true, message: "Rastreio salvo!" };
  } catch (error) {
    console.error("Erro ao salvar rastreio:", error);
    return { success: false, message: "Erro ao salvar rastreio." };
  }
}

// Exclusão em massa (para limpeza, use com cuidado)
export async function deleteOrders(ids: string[]) {
  try {
    await db.delete(order).where(inArray(order.id, ids));
    revalidatePath("/admin/pedidos");
    return { success: true, message: `${ids.length} pedidos excluídos.` };
  } catch (error) {
    console.error("Erro ao excluir pedidos:", error);
    return { success: false, message: "Erro ao excluir pedidos." };
  }
}
