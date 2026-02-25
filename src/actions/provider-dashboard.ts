"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { serviceRequest } from "@/db/schema";
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

// --- ACEITAR SOLICITAÇÃO ---
export async function acceptRequest(requestId: string) {
  try {
    await checkProviderAuth();

    await db
      .update(serviceRequest)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(serviceRequest.id, requestId));

    revalidatePath("/painel-prestador");
    return { success: true, message: "Solicitação aceita com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao aceitar solicitação." };
  }
}

// --- REJEITAR SOLICITAÇÃO ---
export async function rejectRequest(requestId: string) {
  try {
    await checkProviderAuth();

    await db
      .update(serviceRequest)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(serviceRequest.id, requestId));

    revalidatePath("/painel-prestador");
    return { success: true, message: "Solicitação recusada." };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao recusar solicitação." };
  }
}

// --- CONCLUIR SERVIÇO ---
export async function completeRequest(requestId: string) {
  try {
    await checkProviderAuth();

    await db
      .update(serviceRequest)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(serviceRequest.id, requestId));

    revalidatePath("/painel-prestador");
    return { success: true, message: "Serviço marcado como concluído!" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao concluir serviço." };
  }
}
