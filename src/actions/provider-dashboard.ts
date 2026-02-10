"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { serviceProvider, serviceRequest } from "@/db/schema";
import { auth } from "@/lib/auth";

// Função auxiliar para verificar se é o prestador dono do pedido
async function checkProviderOwnership(requestId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Não autenticado");

  // Busca o ID do prestador ligado a este usuário
  const provider = await db.query.serviceProvider.findFirst({
    where: eq(serviceProvider.userId, session.user.id),
  });

  if (!provider) throw new Error("Conta de prestador não encontrada");

  // Verifica se o pedido pertence a este prestador
  const request = await db.query.serviceRequest.findFirst({
    where: and(
      eq(serviceRequest.id, requestId),
      eq(serviceRequest.providerId, provider.id),
    ),
  });

  if (!request) throw new Error("Pedido não encontrado ou acesso negado");

  return { request, provider };
}

// --- ACEITAR PEDIDO ---
export async function acceptRequest(requestId: string) {
  try {
    await checkProviderOwnership(requestId);

    await db
      .update(serviceRequest)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(serviceRequest.id, requestId));

    revalidatePath("/painel-prestador");
    return {
      success: true,
      message: "Pedido aceito! Entre em contato com o cliente.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao aceitar pedido." };
  }
}

// --- RECUSAR PEDIDO ---
export async function rejectRequest(requestId: string) {
  try {
    await checkProviderOwnership(requestId);

    await db
      .update(serviceRequest)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(serviceRequest.id, requestId));

    revalidatePath("/painel-prestador");
    return { success: true, message: "Pedido recusado." };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao recusar pedido." };
  }
}

// --- FINALIZAR PEDIDO (Opcional, para depois) ---
export async function completeRequest(requestId: string) {
  try {
    await checkProviderOwnership(requestId);

    await db
      .update(serviceRequest)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(serviceRequest.id, requestId));

    revalidatePath("/painel-prestador");
    return { success: true, message: "Serviço marcado como concluído!" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao finalizar pedido." };
  }
}
