"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { serviceOrder } from "@/db/schema"; // CORREÇÃO AQUI: Importando serviceOrder
import { auth } from "@/lib/auth";

// --- VERIFICAÇÃO DE AUTENTICAÇÃO ---
async function checkProviderAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Não autenticado");
  }
  return session;
}

// --- ACEITAR SOLICITAÇÃO (MUDOU PARA IN_PROGRESS POIS O WEBHOOK JÁ "ACEITA") ---
export async function acceptRequest(requestId: string) {
  try {
    await checkProviderAuth();

    await db
      .update(serviceOrder)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(serviceOrder.id, requestId));

    revalidatePath("/painel-prestador");
    return { success: true, message: "Serviço marcado como em andamento!" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao aceitar solicitação." };
  }
}

// --- REJEITAR / CANCELAR SOLICITAÇÃO ---
export async function rejectRequest(requestId: string) {
  try {
    await checkProviderAuth();

    await db
      .update(serviceOrder)
      .set({ status: "canceled", updatedAt: new Date() }) // Mudei pra canceled para bater com o novo schema
      .where(eq(serviceOrder.id, requestId));

    revalidatePath("/painel-prestador");
    return { success: true, message: "Solicitação cancelada." };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao cancelar solicitação." };
  }
}

// --- CONCLUIR SERVIÇO ---
export async function completeRequest(requestId: string) {
  try {
    await checkProviderAuth();

    await db
      .update(serviceOrder)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(serviceOrder.id, requestId));

    revalidatePath("/painel-prestador");
    return { success: true, message: "Serviço marcado como concluído!" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao concluir serviço." };
  }
}
