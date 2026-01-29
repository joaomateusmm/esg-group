"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { order } from "@/db/schema";

/**
 * Atualiza o status do pedido.
 * @param orderId ID do pedido
 * @param newStatus Novo status (ex: 'paid', 'shipped')
 * @param type Tipo de status: 'financial' (padrão) ou 'fulfillment' (logístico)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  type: "financial" | "fulfillment" = "financial",
) {
  try {
    // Definimos explicitamente o tipo do objeto para evitar 'any'
    const updateData: {
      updatedAt: Date;
      status?: string;
      fulfillmentStatus?: string;
    } = {
      updatedAt: new Date(),
    };

    // Decide qual coluna atualizar baseado no tipo
    if (type === "fulfillment") {
      updateData.fulfillmentStatus = newStatus;
    } else {
      updateData.status = newStatus;
    }

    await db.update(order).set(updateData).where(eq(order.id, orderId));

    revalidatePath("/admin/pedidos");

    return {
      success: true,
      message: `Status ${type === "fulfillment" ? "logístico" : "financeiro"} atualizado com sucesso!`,
    };
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
      .set({
        trackingCode: code,
        updatedAt: new Date(),
        // Opcional: Se quiser forçar o status logístico para 'shipped' automaticamente ao inserir rastreio, descomente abaixo:
        // fulfillmentStatus: "shipped"
      })
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
