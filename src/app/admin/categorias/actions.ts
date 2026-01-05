"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { category } from "@/db/schema"; // Importe a nova tabela

import { CategoryFormValues, categorySchema } from "./schema";

export async function createCategory(data: CategoryFormValues) {
  const parsed = categorySchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  await db.insert(category).values({
    name: parsed.data.name,
    description: parsed.data.description,
  });

  revalidatePath("/admin/categorias");
}

export async function deleteCategories(ids: string[]) {
  if (ids.length === 0) return;

  await db.delete(category).where(inArray(category.id, ids));

  revalidatePath("/admin/categorias");
}
