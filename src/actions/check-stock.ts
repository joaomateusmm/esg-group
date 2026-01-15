"use server";

import { inArray } from "drizzle-orm";

import { db } from "@/db";
import { product } from "@/db/schema";

export async function checkStockAvailability(
  items: { id: string; quantity: number }[],
) {
  if (items.length === 0) return { outOfStockItems: [] };

  const productIds = items.map((i) => i.id);

  // Busca os produtos no banco
  const productsInDb = await db
    .select({
      id: product.id,
      name: product.name,
      stock: product.stock,
      isStockUnlimited: product.isStockUnlimited,
    })
    .from(product)
    .where(inArray(product.id, productIds));

  const outOfStockItems: { id: string; name: string }[] = [];

  for (const item of items) {
    const dbProduct = productsInDb.find((p) => p.id === item.id);

    // Se o produto não existe mais ou está esgotado
    if (
      !dbProduct ||
      (!dbProduct.isStockUnlimited && (dbProduct.stock ?? 0) <= 0)
    ) {
      outOfStockItems.push({
        id: item.id,
        name: dbProduct?.name || "Produto indisponível",
      });
    }
  }

  return { outOfStockItems };
}
