import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { orderItem, product } from "@/db/schema";

export async function decreaseProductStock(orderId: string) {
  // 1. Buscar os itens do pedido
  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId));

  // 2. Iterar sobre os itens
  for (const item of items) {
    // Busca dados ATUAIS do produto
    const productData = await db.query.product.findFirst({
      where: eq(product.id, item.productId),
      columns: {
        id: true,
        stock: true,
        isStockUnlimited: true, // Importante buscar isso
      },
    });

    // Se não existe, ignora
    if (!productData) continue;

    // Se for ilimitado, NÃO mexe no estoque
    if (productData.isStockUnlimited) continue;

    // 3. Atualizar o estoque (apenas se for limitado)
    await db
      .update(product)
      .set({
        stock: sql`${product.stock} - ${item.quantity}`,
      })
      .where(eq(product.id, item.productId));
  }
}
