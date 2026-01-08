"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { review } from "@/db/schema";
import { auth } from "@/lib/auth";

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
    .trim() // Remove espaços em branco no início e fim
    .min(3, "O comentário deve ter pelo menos 3 caracteres.") // <--- AQUI ESTÁ A TRAVA
    .max(500, "O comentário não pode ter mais de 500 caracteres"),
});

export async function createReviewAction(
  prevState: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  // Também tipamos o retorno para garantir consistência
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

    // Inserir no Banco de Dados
    await db.insert(review).values({
      userId: session.user.id,
      productId: productId,
      rating: rating,
      comment: comment || "",
    });

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
      .where(
        and(
          eq(review.id, reviewId),
          eq(review.userId, session.user.id)
        )
      )
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
