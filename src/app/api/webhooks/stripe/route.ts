import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { order, orderItem, product } from "@/db/schema";

// Interface para os itens
interface WebhookItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

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

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { userId, itemsJson, shippingAddressJson, shippingCost } =
      paymentIntent.metadata;

    if (!userId || !itemsJson) {
      console.error("❌ Metadados incompletos");
      return new NextResponse("Metadados inválidos", { status: 400 });
    }

    const items = JSON.parse(itemsJson) as WebhookItem[];
    const shippingCostValue = shippingCost ? parseInt(shippingCost) : 0;

    // --- LÓGICA DE RECUPERAÇÃO DE ENDEREÇO (AQUI ESTÁ A CORREÇÃO) ---
    // 1. Tenta pegar dos metadados (se o seu front enviou)
    let finalAddress = shippingAddressJson
      ? JSON.parse(shippingAddressJson)
      : null;

    // 2. Se não tiver nos metadados (ou for "Não informado"), pega do objeto nativo do Stripe
    // Isso acontece quando o usuário preenche o endereço no próprio formulário do Stripe
    if (
      !finalAddress ||
      !finalAddress.street ||
      finalAddress.street === "Não informado"
    ) {
      if (paymentIntent.shipping?.address) {
        const stripeAddr = paymentIntent.shipping.address;
        finalAddress = {
          street: stripeAddr.line1 || "Endereço Stripe",
          number: "", // O Stripe muitas vezes junta numero e rua no line1
          complement: stripeAddr.line2 || "",
          city: stripeAddr.city || "",
          state: stripeAddr.state || "",
          zipCode: stripeAddr.postal_code || "",
          country: stripeAddr.country || "BR",
        };
        console.log("📦 Endereço recuperado do objeto Shipping do Stripe.");
      }
    }

    try {
      // 1. Criar o Pedido
      const [newOrder] = await db
        .insert(order)
        .values({
          userId: userId,
          amount: paymentIntent.amount,
          status: "paid",
          stripePaymentIntentId: paymentIntent.id,
          stripeClientSecret: paymentIntent.client_secret,
          shippingAddress: finalAddress, // Salva o endereço recuperado
          shippingCost: shippingCostValue,
        })
        .returning();

      // 2. Criar Itens
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
