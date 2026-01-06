"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { game } from "@/db/schema";

import { GameSchema, gameSchema } from "./schema";

// --- CRIAR JOGO ---
export async function createGame(data: GameSchema) {
  const result = gameSchema.safeParse(data);

  if (!result.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    await db.insert(game).values({
      name: result.data.name,
    });

    revalidatePath("/admin/jogos");
    revalidatePath("/"); // Atualiza o menu do site

    return { success: true, message: "Jogo adicionado com sucesso!" };
  } catch (error) {
    console.error("Erro ao criar jogo:", error);
    return { success: false, message: "Erro ao criar jogo." };
  }
}

// --- DELETAR JOGO ---
export async function deleteGame(id: string) {
  try {
    // Tenta deletar. Se tiver produtos vinculados com "Set Null", vai funcionar.
    // Se tiver constraints rígidas, pode dar erro (igual vimos em produtos).
    await db.delete(game).where(eq(game.id, id));

    revalidatePath("/admin/jogos");
    revalidatePath("/");

    return { success: true, message: "Jogo excluído com sucesso." };
  } catch (error) {
    console.error("Erro ao deletar jogo:", error);
    return {
      success: false,
      message: "Erro ao excluir. Verifique se há produtos vinculados.",
    };
  }
}
