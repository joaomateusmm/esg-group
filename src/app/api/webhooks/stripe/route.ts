import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { decreaseProductStock } from "@/actions/stock";
import { db } from "@/db";
import { order } from "@/db/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const orderId = session.metadata?.orderId;

    if (orderId) {
      console.log(
        `💰 Pagamento confirmado via Checkout Session para o pedido: ${orderId}`,
      );

      try {
        await db
          .update(order)
          .set({
            status: "paid", // Financeiro: Pago
            fulfillmentStatus: "processing", // Logístico: Em preparação
            stripePaymentIntentId: session.payment_intent as string,
          })
          .where(eq(order.id, orderId));

        try {
          await decreaseProductStock(orderId);
          console.log(`📦 Estoque atualizado para o pedido ${orderId}`);
        } catch (stockError) {
          console.error(
            "❌ Erro ao atualizar estoque (não crítico):",
            stockError,
          );
        }

        return NextResponse.json({ received: true });
      } catch (error) {
        console.error("❌ Erro ao atualizar pedido:", error);
        return new NextResponse("Erro ao atualizar pedido", { status: 500 });
      }
    } else {
      console.warn("⚠️ Webhook recebido sem OrderID no metadata.");
    }
  } else if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      console.log(
        `💰 Pagamento confirmado via Payment Intent para: ${orderId}`,
      );

      try {
        await db
          .update(order)
          .set({
            status: "paid",
            fulfillmentStatus: "processing",
            stripePaymentIntentId: paymentIntent.id,
          })
          .where(eq(order.id, orderId));

        try {
          await decreaseProductStock(orderId);
          console.log(`📦 Estoque atualizado para o pedido ${orderId}`);
        } catch (stockError) {
          console.error(
            "❌ Erro ao atualizar estoque (não crítico):",
            stockError,
          );
        }
      } catch (dbError) {
        console.error("❌ Erro ao salvar status no banco:", dbError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
