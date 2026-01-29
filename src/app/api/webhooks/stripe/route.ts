import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

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

  // EVENTO DE CHECKOUT SESSION COMPLETED (Mais seguro para nosso fluxo atual)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Recupera o ID do pedido que enviamos no metadata ao criar a sessão
    const orderId = session.metadata?.orderId;

    if (orderId) {
      console.log(
        `💰 Pagamento confirmado via Checkout Session para o pedido: ${orderId}`,
      );

      try {
        // ATUALIZAÇÃO DOS STATUS (Financeiro e Logístico)
        // Não criamos pedido novo, apenas atualizamos o que já existe
        await db
          .update(order)
          .set({
            status: "paid", // Financeiro: Pago
            fulfillmentStatus: "processing", // Logístico: Em preparação (sai de 'idle')
            stripePaymentIntentId: session.payment_intent as string,
            // Opcional: Se quiser salvar o endereço que o usuário preencheu no Stripe (caso seja diferente)
            // shippingAddress: session.shipping_details?.address ...
          })
          .where(eq(order.id, orderId));

        return NextResponse.json({ received: true });
      } catch (error) {
        console.error("❌ Erro ao atualizar pedido:", error);
        return new NextResponse("Erro ao atualizar pedido", { status: 500 });
      }
    } else {
      console.warn("⚠️ Webhook recebido sem OrderID no metadata.");
    }
  }

  // FALLBACK: PAYMENT INTENT SUCCEEDED (Caso usemos Elements puro sem Checkout Session no futuro)
  // Mas no fluxo atual (createCheckoutSession), o evento acima é o principal.
  // Se você usa Elements com confirmParams, o payment_intent.succeeded também dispara.
  else if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Tentamos achar o pedido pelo metadata OU pelo paymentIntentId se já foi salvo
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      console.log(
        `💰 Pagamento confirmado via Payment Intent para: ${orderId}`,
      );

      await db
        .update(order)
        .set({
          status: "paid",
          fulfillmentStatus: "processing",
          stripePaymentIntentId: paymentIntent.id,
        })
        .where(eq(order.id, orderId));
    }
  }

  return NextResponse.json({ received: true });
}
