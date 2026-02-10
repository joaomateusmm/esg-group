"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { serviceProvider } from "@/db/schema";
import { auth } from "@/lib/auth";

// --- SCHEMA DE VALIDAÇÃO (SEM EXPORT) ---
// Removemos o 'export' aqui para corrigir o erro do Next.js
const providerSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria."),
  bio: z
    .string()
    .min(
      20,
      "Conte um pouco mais sobre sua experiência (mínimo 20 caracteres).",
    ),
  experienceYears: z.number().min(0, "Experiência inválida."),
  phone: z.string().min(10, "Telefone inválido."),
  location: z.string().min(3, "Informe sua cidade ou região de atuação."),
  portfolioUrl: z.string().optional(),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

export async function registerProvider(data: ProviderFormValues) {
  try {
    // 1. Autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Você precisa estar logado." };
    }

    // 2. Validação Zod
    const parsed = providerSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Dados inválidos." };
    }

    const { categoryId, bio, experienceYears, phone, location, portfolioUrl } =
      parsed.data;

    // 3. Verificar se já é prestador NESTA categoria
    const existing = await db.query.serviceProvider.findFirst({
      where: and(
        eq(serviceProvider.userId, session.user.id),
        eq(serviceProvider.categoryId, categoryId),
      ),
    });

    if (existing) {
      return {
        success: false,
        error: "Você já tem um cadastro para esta categoria.",
      };
    }

    // 4. Inserir no Banco
    await db.insert(serviceProvider).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      categoryId,
      bio,
      experienceYears,
      phone,
      location,
      portfolioUrl: portfolioUrl || null,
      status: "pending", // Começa pendente de aprovação
    });

    revalidatePath("/admin/prestadores"); // Admin verá o novo cadastro
    revalidatePath("/conta");

    return {
      success: true,
      message: "Candidatura enviada! Aguarde a aprovação.",
    };
  } catch (error) {
    console.error("Erro ao registrar prestador:", error);
    return { success: false, error: "Erro interno ao salvar candidatura." };
  }
}

export async function resetProviderApplication() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) return { success: false, error: "Não autenticado." };

    // Só permite deletar se estiver REJEITADO
    const provider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.userId, session.user.id),
    });

    if (!provider || provider.status !== "rejected") {
      return { success: false, error: "Ação não permitida." };
    }

    // Deleta o registro antigo
    await db.delete(serviceProvider).where(eq(serviceProvider.id, provider.id));

    revalidatePath("/minha-conta/trabalhe-conosco");
    return {
      success: true,
      message: "Agora você pode enviar uma nova candidatura.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao resetar candidatura." };
  }
}
