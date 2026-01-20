import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { order, orderItem, product } from "@/db/schema";

// Interface para os itens recuperados dos metadados
interface WebhookItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Correção do 'as any' para 'as unknown as ...' para evitar o erro de lint
  apiVersion: "2025-12-15.clover" as unknown as Stripe.LatestApiVersion,
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`❌ Erro Webhook: ${(err as Error).message}`);
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, {
      status: 400,
    });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { userId, itemsJson, shippingAddressJson, shippingCost } =
      paymentIntent.metadata;

    if (!userId || !itemsJson) {
      console.error("❌ Metadados incompletos");
      return new NextResponse("Metadados inválidos", { status: 400 });
    }

    // Tipamos o JSON.parse com a interface criada
    const items = JSON.parse(itemsJson) as WebhookItem[];

    // Parse seguro do endereço e conversão do frete
    const shippingAddress = shippingAddressJson
      ? JSON.parse(shippingAddressJson)
      : null;
    const shippingCostValue = shippingCost ? parseInt(shippingCost) : 0;

    try {
      // 1. Criar o Pedido com os dados corretos
      const [newOrder] = await db
        .insert(order)
        .values({
          userId: userId,
          amount: paymentIntent.amount, // Valor total pago (já inclui o frete)
          status: "paid",
          stripePaymentIntentId: paymentIntent.id,
          stripeClientSecret: paymentIntent.client_secret,
          shippingAddress: shippingAddress, // Salva o JSON completo do endereço
          shippingCost: shippingCostValue, // Salva o valor do frete separado
        })
        .returning();

      // 2. Criar Itens
      // Agora 'item' é inferido como WebhookItem, não precisamos de 'any'
      const orderItemsData = items.map((item) => ({
        orderId: newOrder.id,
        productId: item.id,
        productName: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      await db.insert(orderItem).values(orderItemsData);

      // 3. Atualizar Estoque
      for (const item of items) {
        await db
          .update(product)
          .set({ sales: sql`${product.sales} + ${item.quantity}` })
          .where(eq(product.id, item.id));

        await db
          .update(product)
          .set({ stock: sql`${product.stock} - ${item.quantity}` })
          .where(
            and(eq(product.id, item.id), eq(product.isStockUnlimited, false)),
          );
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("❌ Erro ao salvar pedido:", error);
      return new NextResponse("Erro interno", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
