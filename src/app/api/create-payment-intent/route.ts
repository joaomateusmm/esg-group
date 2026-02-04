import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { coupon, order, orderItem, product } from "@/db/schema";
import { auth } from "@/lib/auth";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

// Taxa fixa de segurança (BRL -> GBP) caso o cupom fixo esteja em reais
const BRL_TO_GBP_RATE = 1 / 7.35;

export async function POST(req: Request) {
  try {
    if (!stripeSecret) {
      return NextResponse.json(
        { error: "Stripe Key Missing" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
      typescript: true,
    });

    const body = await req.json();
    const { items, currency, shippingAddress, couponCode, existingOrderId } =
      body;

    const session = await auth.api.getSession({ headers: await headers() });

    const userId = session?.user?.id || "guest-user";
    const userName = session?.user?.name || "Guest User";
    const userEmail = session?.user?.email || "guest@example.com";

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // --- 1. CÁLCULO DOS PRODUTOS ---
    let itemsTotal = 0;
    let shippingTotal = 0;
    const orderItemsToInsert = [];

    for (const item of items) {
      const productData = await db.query.product.findFirst({
        where: eq(product.id, item.id),
      });

      if (!productData) continue;

      const finalPrice = productData.discountPrice || productData.price;
      itemsTotal += finalPrice * item.quantity;

      // Frete simples
      let itemShipping = 0;
      if (productData.shippingType === "fixed") {
        itemShipping = (productData.fixedShippingPrice || 0) * item.quantity;
      }
      shippingTotal += itemShipping;

      orderItemsToInsert.push({
        productId: item.id,
        productName: productData.name,
        quantity: item.quantity,
        price: finalPrice,
        image: productData.images?.[0] || null,
      });
    }

    // --- 2. CÁLCULO DO DESCONTO ---
    let discountAmount = 0;
    let activeCouponId = null;

    if (couponCode) {
      const foundCoupon = await db.query.coupon.findFirst({
        where: eq(coupon.code, couponCode.toString().toUpperCase()),
      });

      if (
        foundCoupon &&
        foundCoupon.isActive &&
        (!foundCoupon.expiresAt || new Date() < foundCoupon.expiresAt) &&
        (foundCoupon.maxUses === null ||
          foundCoupon.usedCount < foundCoupon.maxUses)
      ) {
        if (foundCoupon.type === "percent") {
          discountAmount = Math.round(itemsTotal * (foundCoupon.value / 100));
        } else {
          // Se for fixo e a loja for GBP, aplica conversão de segurança
          if (currency?.toUpperCase() === "GBP") {
            discountAmount = Math.round(foundCoupon.value * BRL_TO_GBP_RATE);
          } else {
            discountAmount = foundCoupon.value;
          }
        }

        if (discountAmount > itemsTotal) discountAmount = itemsTotal;
        activeCouponId = foundCoupon.id;
      }
    }

    // --- 3. TOTAL FINAL ---
    const totalAmount =
      Math.max(0, itemsTotal - discountAmount) + shippingTotal;

    const sanitizedAddress = {
      street: shippingAddress?.street || "Not provided",
      number: shippingAddress?.number || "N/A",
      complement: shippingAddress?.complement || "",
      city: shippingAddress?.city || "",
      state: shippingAddress?.state || "",
      zipCode: shippingAddress?.zipCode || "",
      country: shippingAddress?.country || "BR",
    };

    // --- 4. ATUALIZAR OU CRIAR PEDIDO ---
    let orderId = existingOrderId;

    if (existingOrderId) {
      // MODO ATUALIZAÇÃO: Se já existe ID, atualiza os valores
      await db
        .update(order)
        .set({
          amount: totalAmount,
          discountAmount: discountAmount,
          couponId: activeCouponId,
          shippingCost: shippingTotal,
          updatedAt: new Date(), // Atualiza data
        })
        .where(eq(order.id, existingOrderId));
    } else {
      // MODO CRIAÇÃO: Cria novo
      const [newOrder] = await db
        .insert(order)
        .values({
          userId: userId,
          amount: totalAmount,
          discountAmount: discountAmount,
          couponId: activeCouponId,
          status: "pending",
          fulfillmentStatus: "idle",
          currency: currency || "GBP",
          shippingCost: shippingTotal,
          shippingAddress: sanitizedAddress,
          customerName: userName,
          customerEmail: userEmail,
        })
        .returning();

      orderId = newOrder.id;

      // Insere itens apenas se for novo pedido
      if (orderItemsToInsert.length > 0) {
        await db
          .insert(orderItem)
          .values(orderItemsToInsert.map((i) => ({ ...i, orderId: orderId })));
      }
    }

    // --- 5. STRIPE INTENT ---
    // Se for atualização e o valor mudou, criamos um novo intent ou atualizamos
    // Por simplicidade e segurança, criamos um novo intent com o valor correto
    // O Stripe gerencia intents pendentes sem problemas.

    if (totalAmount >= 30) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: currency || "gbp",
        payment_method_types: ["card"],
        metadata: {
          orderId: orderId,
          userId: userId,
          couponCode: couponCode || "",
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        orderId: orderId,
      });
    } else {
      return NextResponse.json({
        clientSecret: null,
        orderId: orderId,
        message: "Order is free",
      });
    }
  } catch (error: unknown) {
    console.error("❌ API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
