import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { order, orderItem, product } from "@/db/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover", // Ajuste se necessário para sua versão
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      // Se não tiver secret (ex: desenvolvimento local sem CLI), tenta parsear direto
      // PERIGO: Apenas para debug local rápido, em produção precisa do secret
      console.warn(
        "⚠️ STRIPE_WEBHOOK_SECRET ausente. Validando sem assinatura (DEV ONLY).",
      );
      event = JSON.parse(body);
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
  } catch (err) {
    console.error(`❌ Erro Webhook: ${(err as Error).message}`);
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, {
      status: 400,
    });
  }

  // --- Processar Evento: Pagamento Bem-sucedido ---
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Recuperamos os metadados que enviamos na criação do PaymentIntent
    // Precisamos garantir que enviamos isso na rota /api/create-payment-intent
    const { userId, itemsJson, shippingAddressJson } = paymentIntent.metadata;

    if (!userId || !itemsJson) {
      console.error("❌ Metadados incompletos no PaymentIntent");
      return new NextResponse("Metadados inválidos", { status: 400 });
    }

    const items = JSON.parse(itemsJson);
    const shippingAddress = shippingAddressJson
      ? JSON.parse(shippingAddressJson)
      : null;

    console.log(`💰 Pagamento recebido! Criando pedido para User: ${userId}`);

    try {
      // 1. Criar o Pedido
      const [newOrder] = await db
        .insert(order)
        .values({
          userId: userId,
          amount: paymentIntent.amount, // Valor em centavos
          status: "paid", // Já nasce pago
          stripePaymentIntentId: paymentIntent.id,
          stripeClientSecret: paymentIntent.client_secret,
          shippingAddress: shippingAddress,
          shippingCost: 0, // Se tiver frete separado, precisa vir nos metadados também
        })
        .returning();

      // 2. Criar os Itens do Pedido
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderItemsData = items.map((item: any) => ({
        orderId: newOrder.id,
        productId: item.id,
        productName: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      await db.insert(orderItem).values(orderItemsData);

      // 3. Baixar Estoque
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      console.log(`✅ Pedido #${newOrder.id} criado com sucesso!`);
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("❌ Erro ao salvar pedido no banco:", error);
      return new NextResponse("Erro interno ao salvar pedido", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

// Helper para o 'and' do drizzle que esqueci no import acima
import { and } from "drizzle-orm";
