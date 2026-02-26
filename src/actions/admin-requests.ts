"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
// CORREÇÃO: Importando a tabela nova (serviceOrder)
import { serviceOrder } from "@/db/schema";
import { auth } from "@/lib/auth";

// Função auxiliar para verificar se é admin
async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Acesso negado.");
  }
}

// --- EXCLUIR PEDIDO ---
export async function deleteRequest(requestId: string) {
  try {
    await checkAdmin();

    // CORREÇÃO: Usando serviceOrder no delete e no eq()
    await db.delete(serviceOrder).where(eq(serviceOrder.id, requestId));

    revalidatePath("/admin/solicitacoes");
    return { success: true, message: "Solicitação excluída com sucesso." };
  } catch (error) {
    console.error("Erro ao excluir solicitação:", error);
    return { success: false, error: "Erro ao excluir o registro." };
  }
}
