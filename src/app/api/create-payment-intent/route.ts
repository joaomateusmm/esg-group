import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { order, orderItem, product } from "@/db/schema";
import { auth } from "@/lib/auth";

// Initialize Stripe
const stripeSecret = process.env.STRIPE_SECRET_KEY;

export async function POST(req: Request) {
  try {
    // 1. Validação da Chave Stripe
    if (!stripeSecret) {
      console.error(
        "❌ STRIPE_SECRET_KEY not defined in environment variables.",
      );
      return NextResponse.json(
        { error: "Server configuration error (Stripe Key Missing)" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
      typescript: true,
    });

    // 2. Ler Corpo da Requisição
    const body = await req.json();
    const { items, currency, shippingAddress } = body;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // 3. Calcular Totais (Produtos + Frete) e Preparar Itens
    let itemsTotal = 0;
    let shippingTotal = 0; // Acumulador de frete
    const orderItemsToInsert = [];

    for (const item of items) {
      // Busca dados frescos do banco
      const productData = await db.query.product.findFirst({
        where: eq(product.id, item.id),
      });

      if (!productData) continue;

      // 3.1 Calcular Preço do Produto
      const finalPrice = productData.discountPrice || productData.price;
      itemsTotal += finalPrice * item.quantity;

      // 3.2 Calcular Frete deste Item
      // Lógica simplificada: Se for fixo, soma. Se for grátis, é 0.
      // Se for "calculated" (ex: Correios), aqui você chamaria uma API externa.
      // Por enquanto, assumiremos que "calculated" ou sem tipo definido é 0 ou um valor base se necessário.

      let itemShippingCost = 0;

      if (productData.shippingType === "fixed") {
        // Se o frete é fixo, multiplicamos pela quantidade?
        // Geralmente sim, ou cobra uma vez só. Aqui vou assumir por unidade para simplificar,
        // mas você pode mudar para cobrar uma vez se preferir.
        itemShippingCost =
          (productData.fixedShippingPrice || 0) * item.quantity;
      } else if (productData.shippingType === "free") {
        itemShippingCost = 0;
      }
      // Caso precise de lógica para "calculated", adicione aqui.
      // Por padrão, deixamos 0 se não for 'fixed'.

      shippingTotal += itemShippingCost;

      // Prepara objeto para inserção
      orderItemsToInsert.push({
        productId: item.id,
        productName: productData.name,
        quantity: item.quantity,
        price: finalPrice,
        image: productData.images?.[0] || null,
      });
    }

    // Soma final: Produtos + Frete Total
    const totalAmount = itemsTotal + shippingTotal;

    // 4. Sanitização do Endereço
    const rawAddress = shippingAddress || {};
    const sanitizedAddress = {
      street: rawAddress.street || "Not provided",
      number: rawAddress.number || "N/A",
      complement: rawAddress.complement || "",
      city: rawAddress.city || "",
      state: rawAddress.state || "",
      zipCode: rawAddress.zipCode || "",
      country: rawAddress.country || "BR",
    };

    // 5. CRIAR PEDIDO NO BANCO
    const [newOrder] = await db
      .insert(order)
      .values({
        userId: session.user.id,
        amount: totalAmount, // Total cobrado do cliente
        status: "pending",
        fulfillmentStatus: "idle",
        currency: currency || "GBP",
        shippingCost: shippingTotal, // Salva quanto foi de frete
        shippingAddress: sanitizedAddress,
        customerName: session.user.name,
        customerEmail: session.user.email,
      })
      .returning();

    console.log(
      `📝 Order created: ${newOrder.id} | Total: ${totalAmount} | Shipping: ${shippingTotal}`,
    );

    // 6. Inserir Itens
    if (orderItemsToInsert.length > 0) {
      await db.insert(orderItem).values(
        orderItemsToInsert.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
      );
    }

    // 7. Criar Payment Intent na Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency || "gbp",

      payment_method_types: ["card"], // Forçar cartão para evitar erros

      metadata: {
        orderId: newOrder.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: newOrder.id,
    });
  } catch (error) {
    console.error("❌ Error creating Payment Intent:", error);
    return NextResponse.json(
      {
        error: `Error processing payment: ${error instanceof Error ? error.message : "Unknown"}`,
      },
      { status: 500 },
    );
  }
}
