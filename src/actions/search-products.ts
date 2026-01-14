"use server";

import { ilike } from "drizzle-orm";

import { db } from "@/db";
import { product } from "@/db/schema";

export async function searchProductsAction(query: string) {
  if (!query || query.length < 2) return [];

  try {
    // Busca produtos onde o nome contém o texto (case insensitive)
    // Limita a 5 resultados para o dropdown não ficar gigante
    const results = await db
      .select({
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        discountPrice: product.discountPrice,
      })
      .from(product)
      .where(ilike(product.name, `%${query}%`))
      .limit(5);

    return results;
  } catch (error) {
    console.error("Erro na busca:", error);
    return [];
  }
}
