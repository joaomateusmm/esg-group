"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { category } from "@/db/schema";

import { CategoryFormValues, categorySchema } from "./schema";

// Função auxiliar para criar SLUG (transforma "Promoção de Verão" em "promocao-de-verao")
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD") // Remove acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-") // Substitui espaços e símbolos por hífens
    .replace(/^-+|-+$/g, ""); // Remove hífens do começo/fim
}

export async function createCategory(data: CategoryFormValues) {
  const parsed = categorySchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  // Gera o slug automaticamente a partir do nome
  const slug = generateSlug(parsed.data.name);

  await db.insert(category).values({
    name: parsed.data.name,
    description: parsed.data.description,
    slug: slug, // Salva o slug para a URL funcionar
  });

  revalidatePath("/admin/categorias");
}

export async function deleteCategories(ids: string[]) {
  if (ids.length === 0) return;

  await db.delete(category).where(inArray(category.id, ids));

  revalidatePath("/admin/categorias");
}
