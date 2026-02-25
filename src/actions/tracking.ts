"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { order } from "@/db/schema";

export async function getOrderTracking(trackingCode: string) {
  if (!trackingCode) return null;

  try {
    // Busca o pedido baseado no trackingCode (ignorando maiúsculas/minúsculas não é necessário, mas é bom garantir exact match)
    const result = await db.query.order.findFirst({
      where: eq(order.trackingCode, trackingCode),
      with: {
        items: {
          with: {
            product: {
              columns: { name: true, images: true },
            },
          },
        },
      },
    });

    if (!result) return null;

    // Retornamos apenas os dados necessários para o rastreio (sem vazar dados sensíveis demais)
    return {
      id: result.id,
      status: result.status,
      fulfillmentStatus: result.fulfillmentStatus,
      paymentMethod: result.paymentMethod,
      trackingCode: result.trackingCode,
      createdAt: result.createdAt,
      estimatedDeliveryStart: result.estimatedDeliveryStart,
      estimatedDeliveryEnd: result.estimatedDeliveryEnd,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shippingAddress: result.shippingAddress as any,
      items: result.items.map((i) => ({
        name: i.productName,
        image: i.image || i.product?.images?.[0] || null,
        quantity: i.quantity,
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar rastreio:", error);
    return null;
  }
}
