"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { streaming } from "@/db/schema";

import { StreamingSchema, streamingSchema } from "./schema";

export async function createStreaming(data: StreamingSchema) {
  const result = streamingSchema.safeParse(data);

  if (!result.success) return { success: false, message: "Dados inválidos." };

  try {
    await db.insert(streaming).values({
      name: result.data.name,
    });

    revalidatePath("/admin/streamings");
    revalidatePath("/");
    return { success: true, message: "Streaming adicionado com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao criar streaming." };
  }
}

export async function deleteStreaming(id: string) {
  try {
    await db.delete(streaming).where(eq(streaming.id, id));
    revalidatePath("/admin/streamings");
    revalidatePath("/");
    return { success: true, message: "Streaming excluído." };
  } catch (error) {
    return { success: false, message: "Erro ao excluir." };
  }
}
