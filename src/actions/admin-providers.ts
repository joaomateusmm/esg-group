"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { serviceProvider } from "@/db/schema";
import { auth } from "@/lib/auth";

// --- VERIFICAÇÃO DE ADMIN ---
async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Acesso negado.");
  }
  return session;
}

// --- APROVAR PRESTADOR ---
export async function approveProvider(providerId: string) {
  try {
    await checkAdmin();

    await db
      .update(serviceProvider)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(serviceProvider.id, providerId));

    revalidatePath("/admin/prestadores");
    return { success: true, message: "Prestador aprovado com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao aprovar prestador." };
  }
}

// --- REJEITAR PRESTADOR ---
export async function rejectProvider(providerId: string) {
  try {
    await checkAdmin();

    await db
      .update(serviceProvider)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(serviceProvider.id, providerId));

    revalidatePath("/admin/prestadores");
    return { success: true, message: "Prestador rejeitado." };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao rejeitar prestador." };
  }
}

export async function deleteProvider(providerId: string) {
  try {
    await checkAdmin();

    await db.delete(serviceProvider).where(eq(serviceProvider.id, providerId));

    revalidatePath("/admin/prestadores");
    return { success: true, message: "Registro de prestador excluído." };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao excluir registro." };
  }
}
