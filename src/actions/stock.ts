import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { orderItem, product } from "@/db/schema";

export async function decreaseProductStock(orderId: string) {
  // 1. Buscar os itens do pedido
  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId));

  // 2. Iterar sobre os itens e atualizar o produto correspondente
  for (const item of items) {
    const productData = await db.query.product.findFirst({
      where: eq(product.id, item.productId),
    });

    // Se o produto não existir ou tiver estoque "infinito" (ex: null), ignoramos
    // Ajuste a lógica de "infinito" conforme seu banco (alguns usam -1 ou null)
    if (!productData || productData.stock === null) continue;

    // 3. Atualizar o estoque
    await db
      .update(product)
      .set({
        // SQL raw para garantir atomicidade: stock = stock - quantity
        stock: sql`${product.stock} - ${item.quantity}`,
      })
      .where(eq(product.id, item.productId));
  }
}
