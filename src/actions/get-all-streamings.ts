"use server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { streaming } from "@/db/schema";

// Função robusta para gerar slugs seguros
function generateSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Separa acentos das letras
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .replace(/\s+/g, "-") // Substitui espaços por hifens
    .replace(/\+/g, "-plus") // Substitui '+' por '-plus' (Essencial para Disney+ e Star+)
    .replace(/[^\w\-]+/g, "") // Remove caracteres especiais restantes
    .replace(/\-\-+/g, "-") // Remove hifens duplicados
    .replace(/^-+/, "") // Remove hifens do começo
    .replace(/-+$/, ""); // Remove hifens do fim
}

export async function getAllStreamings() {
  const data = await db
    .select()
    .from(streaming)
    .orderBy(desc(streaming.createdAt));

  return data.map((s) => ({
    label: s.name,
    // Garante que o link aponte para a pasta /streamings/ correta
    href: `/streamings/${generateSlug(s.name)}`,
  }));
}
