"use server";

import { eq, ilike, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { order, user } from "@/db/schema"; // CORREÇÃO: 'user' adicionado

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
    const updateData: {
      updatedAt: Date;
      status?: string;
      fulfillmentStatus?: string;
    } = {
      updatedAt: new Date(),
    };

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
      })
      .where(eq(order.id, orderId));

    revalidatePath("/admin/pedidos");
    return { success: true, message: "Rastreio salvo!" };
  } catch (error) {
    console.error("Erro ao salvar rastreio:", error);
    return { success: false, message: "Erro ao salvar rastreio." };
  }
}

// Exclusão em massa
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

// Busca IDs para seleção global
export async function getAllOrderIds(search?: string) {
  const baseQuery = db
    .select({ id: order.id })
    .from(order)
    .leftJoin(user, eq(order.userId, user.id));

  if (search) {
    baseQuery.where(
      or(
        ilike(order.id, `%${search}%`),
        ilike(order.customerName, `%${search}%`),
        ilike(user.name, `%${search}%`),
        ilike(order.customerEmail, `%${search}%`),
        ilike(user.email, `%${search}%`),
      ),
    );
  }

  const result = await baseQuery;
  return result.map((o) => o.id);
}
