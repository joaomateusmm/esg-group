"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { review } from "@/db/schema";

export async function deleteReviewAction(reviewId: string) {
  try {
    await db.delete(review).where(eq(review.id, reviewId));

    // Atualiza a página para a review sumir da lista imediatamente
    revalidatePath("/admin/avaliacoes");

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar review:", error);
    return { success: false, error: "Erro ao deletar." };
  }
}
