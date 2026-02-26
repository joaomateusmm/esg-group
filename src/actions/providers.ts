"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { serviceProvider } from "@/db/schema";
import { auth } from "@/lib/auth";

// --- SCHEMA DE VALIDAÇÃO (SEM EXPORT) ---
const providerSchema = z.object({
  categoryId: z.string().min(1, "Selecione uma categoria."),
  bio: z
    .string()
    .min(
      20,
      "Conte um pouco mais sobre sua experiência (mínimo 20 caracteres).",
    ),
  experienceYears: z.number().min(0, "Experiência inválida."),

  // NOVO CAMPO: Adicionado na validação do backend
  servicePrice: z.number().min(5, "O preço mínimo deve ser £5"),

  phone: z.string().min(10, "Telefone inválido."),
  location: z.string().min(3, "Informe sua cidade ou região de atuação."),
  portfolioUrl: z.string().optional(),

  // --- NOVOS CAMPOS ADICIONADOS AQUI ---
  detailedAddress: z.string().min(5, "Informe seu endereço completo."),
  educationLevel: z.string().min(1, "Selecione sua escolaridade."),
  howDidYouHear: z.string().min(1, "Informe como nos conheceu."),
  referralName: z.string().optional(),
  localContacts: z
    .string()
    .min(3, "Informe o nome de pelo menos um contato na região."),
  documentUrlFront: z
    .string()
    .min(1, "É necessário enviar a FRENTE do documento."),
  documentUrlBack: z
    .string()
    .min(1, "É necessário enviar o VERSO do documento."),
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
      console.error("Erro de validação Zod:", parsed.error.flatten());
      return { success: false, error: "Dados inválidos." };
    }

    // Extraindo TODOS os campos do parsed.data, incluindo o novo servicePrice
    const {
      categoryId,
      bio,
      experienceYears,
      servicePrice, // <-- EXTRAÍDO AQUI
      phone,
      location,
      portfolioUrl,
      detailedAddress,
      educationLevel,
      howDidYouHear,
      referralName,
      localContacts,
      documentUrlFront,
      documentUrlBack,
    } = parsed.data;

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

    // 4. Inserir no Banco (COM OS NOVOS CAMPOS)
    await db.insert(serviceProvider).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      categoryId,
      bio,
      experienceYears,

      // INSERIDO AQUI: Multiplicamos por 100 para salvar em centavos!
      // Exemplo: se ele digitou 50 no form, salva 5000 no banco.
      servicePrice: Math.round(servicePrice * 100),

      phone,
      location,
      portfolioUrl: portfolioUrl || null,

      // Salvando os novos campos no DB
      detailedAddress,
      educationLevel,
      howDidYouHear,
      referralName: referralName || null,
      localContacts,
      documentUrlFront,
      documentUrlBack,

      status: "pending", // Começa pendente de aprovação
    });

    revalidatePath("/admin/prestadores"); // Admin verá o novo cadastro
    revalidatePath("/minha-conta");

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
