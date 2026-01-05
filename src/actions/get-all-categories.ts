"use server";

import { db } from "@/db";
import { category } from "@/db/schema";

export async function getAllCategories() {
  try {
    const categories = await db.select().from(category);
    return categories.map((c) => ({
      label: c.name,
      // Gera o slug a partir do nome (ex: "Mod Som" -> "mod-som")
      href: `/categorias/${c.name.toLowerCase().replace(/\s+/g, "-")}`,
    }));
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }
}
