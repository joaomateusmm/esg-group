"use server";

import { db } from "@/db";
import { category } from "@/db/schema";

export async function getAllCategories() {
  try {
    const categories = await db.select().from(category);

    return categories.map((c) => {
      // LÓGICA MANTIDA: Priorizamos o 'slug' salvo no banco.
      // Se não existir (banco antigo), geramos um slug limpo removendo acentos.
      const rawSlug = c.slug || c.name;

      const cleanSlug = rawSlug
        .toLowerCase()
        .normalize("NFD") // Separa os acentos das letras
        .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
        .replace(/[^a-z0-9]+/g, "-") // Substitui espaços e símbolos por hífens
        .replace(/^-+|-+$/g, ""); // Remove hífens do começo e do fim

      return {
        id: c.id, // <--- ADICIONADO: O ID original que o formulário precisa!
        label: c.name,
        href: `/categorias/${cleanSlug}`,
      };
    });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }
}
