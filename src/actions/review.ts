"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
// Adicionei 'product' aos imports para podermos buscar o nome dele
import { product, review } from "@/db/schema";
import { auth } from "@/lib/auth";
// Importe a função de envio para o Discord
import { sendReviewToDiscord } from "@/lib/discord";

// 1. Definição do Tipo de Retorno (Estado)
export type ReviewState = {
  success: boolean;
  message: string;
  errors?: {
    [key: string]: string[];
  };
} | null;

const createReviewSchema = z.object({
  productId: z.string().uuid("ID do produto inválido"),
  rating: z.number().int().min(1).max(5, "A nota deve ser entre 1 e 5"),
  comment: z
    .string()
    .trim()
    .max(155, "O comentário não pode ter mais de 155 caracteres")
    .optional()
    .or(z.literal("")),
});

export async function createReviewAction(
  prevState: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  try {
    // Verificar Autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        message: "Você precisa estar logado para avaliar.",
      };
    }

    // Transformar FormData em Objeto
    const rawData = {
      productId: formData.get("productId"),
      rating: Number(formData.get("rating")),
      comment: formData.get("comment"),
    };

    // Validar com Zod
    const validatedFields = createReviewSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Dados inválidos.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { productId, rating, comment } = validatedFields.data;

    // Garante que o comentário seja uma string (se undefined, vira "")
    const safeComment = comment || "";

    // 1. Inserir no Banco de Dados
    await db.insert(review).values({
      userId: session.user.id,
      productId: productId,
      rating: rating,
      comment: safeComment, // <--- CORREÇÃO AQUI (Banco)
    });

    // --- NOVA LÓGICA DE DISCORD ---
    // Buscamos o nome do produto para a mensagem ficar bonita no Discord
    try {
      const productData = await db.query.product.findFirst({
        where: eq(product.id, productId),
        columns: { name: true },
      });

      const productName = productData?.name || "Produto da Loja";

      // Enviamos para o webhook (sem travar a resposta se der erro no Discord)
      await sendReviewToDiscord(
        session.user.name,
        productName,
        rating,
        safeComment, // <--- CORREÇÃO AQUI (Discord)
      );
    } catch (discordError) {
      // Apenas logamos o erro, não impedimos o sucesso da action
      console.error("Falha ao enviar webhook para o Discord:", discordError);
    }
    // ------------------------------

    // Revalidar a página
    revalidatePath(`/produto/${productId}`);

    return {
      success: true,
      message: "Avaliação enviada com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao criar avaliação:", error);
    return {
      success: false,
      message: "Ocorreu um erro ao enviar sua avaliação. Tente novamente.",
    };
  }
}

export async function deleteReviewAction(reviewId: string, productId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, message: "Não autorizado." };
    }

    // Deleta APENAS se o ID bater E o userId for o mesmo da sessão
    const deleted = await db
      .delete(review)
      .where(and(eq(review.id, reviewId), eq(review.userId, session.user.id)))
      .returning();

    if (!deleted.length) {
      return { success: false, message: "Erro ao apagar ou permissão negada." };
    }

    revalidatePath(`/produto/${productId}`);

    return { success: true, message: "Avaliação removida." };
  } catch (error) {
    console.error("Erro ao deletar review:", error);
    return { success: false, message: "Erro interno." };
  }
}
