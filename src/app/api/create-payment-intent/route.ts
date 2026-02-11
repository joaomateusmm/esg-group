import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { coupon, order, orderItem, product, user } from "@/db/schema";
import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
  typescript: true,
});

// --- FUNÇÃO AUXILIAR SHADOW ACCOUNT ---
async function getOrCreateGuestUser(email: string, name: string) {
  const normalizedEmail = email.toLowerCase();

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, normalizedEmail),
  });

  if (existingUser) {
    return existingUser.id;
  }

  const now = new Date();
  const [newUser] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: name || "Visitante",
      email: normalizedEmail,
      image: "",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      role: "user",
    })
    .returning();

  return newUser.id;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, existingOrderId, guestEmail, guestName, couponCode } = body;

    if (!items || items.length === 0) {
      return new NextResponse("Carrinho vazio", { status: 400 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Variáveis de controle
    let userId: string | undefined;
    let customerEmail: string | undefined;
    let customerName: string | undefined;
    let shouldSaveToDb = false; // Flag para controlar se salvamos no banco

    if (session) {
      userId = session.user.id;
      customerEmail = session.user.email;
      customerName = session.user.name;
      shouldSaveToDb = true;
    } else {
      if (guestEmail) {
        // Se tiver e-mail de convidado, criamos/buscamos o usuário e salvamos o pedido
        userId = await getOrCreateGuestUser(
          guestEmail,
          guestName || "Visitante",
        );
        customerEmail = guestEmail;
        customerName = guestName || "Visitante";
        shouldSaveToDb = true;
      }
    }

    // 3. Verifica endereço existente para cálculo de frete (Apenas se tiver ID de pedido)
    let cityForShipping = undefined;
    if (existingOrderId) {
      const existingOrderData = await db.query.order.findFirst({
        where: eq(order.id, existingOrderId),
        columns: { shippingAddress: true },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addr = existingOrderData?.shippingAddress as any;
      if (addr?.city) {
        cityForShipping = addr.city;
      }
    }

    // 4. Calcula Totais
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productIds = items.map((i: any) => i.id);
    const productsDb = await db.query.product.findMany({
      where: inArray(product.id, productIds),
    });

    let subtotal = 0;
    let totalShippingCost = 0;

    // LÓGICA DE FRETE GRÁTIS PARA LONDRES (NO BACKEND)
    const isLondon =
      cityForShipping?.trim().toLowerCase() === "london" ||
      cityForShipping?.trim().toLowerCase() === "londres";

    if (!isLondon) {
      for (const item of items) {
        const prodInfo = productsDb.find((p) => p.id === item.id);
        if (prodInfo) {
          const finalPrice = prodInfo.discountPrice || prodInfo.price;
          subtotal += finalPrice * item.quantity;

          if (prodInfo.shippingType === "fixed") {
            totalShippingCost +=
              (prodInfo.fixedShippingPrice || 0) * item.quantity;
          }
        }
      }
    } else {
      for (const item of items) {
        const prodInfo = productsDb.find((p) => p.id === item.id);
        if (prodInfo) {
          const finalPrice = prodInfo.discountPrice || prodInfo.price;
          subtotal += finalPrice * item.quantity;
        }
      }
      totalShippingCost = 0;
    }

    let discountAmount = 0;
    let activeCouponId: string | null = null;

    if (couponCode) {
      const foundCoupon = await db.query.coupon.findFirst({
        where: eq(coupon.code, couponCode.toUpperCase()),
      });

      if (
        foundCoupon &&
        foundCoupon.isActive &&
        (!foundCoupon.expiresAt || new Date() < foundCoupon.expiresAt) &&
        (foundCoupon.maxUses === null ||
          foundCoupon.usedCount < foundCoupon.maxUses) &&
        (foundCoupon.minValue === null || subtotal >= foundCoupon.minValue)
      ) {
        if (foundCoupon.type === "percent") {
          discountAmount = Math.round(subtotal * (foundCoupon.value / 100));
        } else {
          discountAmount = foundCoupon.value;
        }
        if (discountAmount > subtotal) discountAmount = subtotal;
        activeCouponId = foundCoupon.id;
      }
    }

    const totalAmount = Math.round(
      subtotal - discountAmount + totalShippingCost,
    );

    // 5. Cria ou Atualiza Pedido (SOMENTE SE TIVER CONTEXTO DE USUÁRIO)
    let orderId = existingOrderId;

    if (shouldSaveToDb && userId && customerEmail && customerName) {
      if (existingOrderId) {
        const currentOrder = await db.query.order.findFirst({
          where: eq(order.id, existingOrderId),
        });

        if (currentOrder) {
          await db
            .update(order)
            .set({
              amount: totalAmount,
              discountAmount: discountAmount,
              couponId: activeCouponId,
              userId: userId,
              customerEmail: customerEmail,
              shippingCost: totalShippingCost,
              updatedAt: new Date(),
            })
            .where(eq(order.id, existingOrderId));
        } else {
          // Se enviaram um ID que não existe, limpamos para criar um novo
          orderId = null;
        }
      }

      if (!orderId) {
        const [newOrder] = await db
          .insert(order)
          .values({
            userId: userId,
            amount: totalAmount,
            status: "pending",
            currency: "GBP",
            fulfillmentStatus: "idle",
            paymentMethod: "card",
            shippingAddress: {
              street: "Not provided",
              number: "N/A",
              complement: "",
              city: "",
              state: "",
              zipCode: "",
              country: "BR",
            },
            shippingCost: totalShippingCost,
            customerName: customerName,
            customerEmail: customerEmail,
            couponId: activeCouponId,
            discountAmount: discountAmount,
          })
          .returning();

        orderId = newOrder.id;

        await db.insert(orderItem).values(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items.map((item: any) => ({
            orderId: newOrder.id,
            productId: item.id,
            productName: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        );
      }
    }

    // 6. Criação do PaymentIntent no Stripe (Sempre acontece para renderizar o form)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: orderId || "temp_guest_checkout", // Se não salvamos no banco, marcamos como temp
        userId: userId || "guest",
      },
      receipt_email: customerEmail, // Pode ser undefined se for visitante sem email
    });

    // 7. Atualiza o pedido com o ID do Stripe (Apenas se o pedido foi salvo no banco)
    if (shouldSaveToDb && orderId) {
      await db
        .update(order)
        .set({
          stripePaymentIntentId: paymentIntent.id,
          stripeClientSecret: paymentIntent.client_secret,
        })
        .where(eq(order.id, orderId));
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: orderId, // Retorna null se for visitante sem email, ou ID se foi salvo
    });
  } catch (error) {
    console.error("Erro interno no create-payment-intent:", error);
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}
