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

    let userId: string;
    let customerEmail: string;
    let customerName: string;

    if (session) {
      userId = session.user.id;
      customerEmail = session.user.email;
      customerName = session.user.name;
    } else {
      if (guestEmail) {
        userId = await getOrCreateGuestUser(
          guestEmail,
          guestName || "Visitante",
        );
        customerEmail = guestEmail;
        customerName = guestName || "Visitante";
      } else {
        const tempId = crypto.randomUUID();
        const tempEmail = `pending-${tempId}@temp.esggroup.shop`;
        userId = await getOrCreateGuestUser(tempEmail, "Visitante Pendente");
        customerEmail = tempEmail;
        customerName = "Visitante";
      }
    }

    // 3. Verifica endereço existente para cálculo de frete
    // Se o pedido já existe, verificamos se ele já tem um endereço salvo (ex: Londres)
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
      // Só calcula frete se não for Londres
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
      // Se for Londres, calcula só o subtotal, frete é 0
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

    // 5. Cria ou Atualiza Pedido
    let orderId = existingOrderId;

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
            shippingCost: totalShippingCost, // Atualiza o frete (pode ser 0 agora)
            updatedAt: new Date(),
          })
          .where(eq(order.id, existingOrderId));
      } else {
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: orderId,
        userId: userId,
      },
      receipt_email: customerEmail.includes("@temp.esggroup.shop")
        ? undefined
        : customerEmail,
    });

    await db
      .update(order)
      .set({
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
      })
      .where(eq(order.id, orderId));

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: orderId,
    });
  } catch (error) {
    console.error("Erro interno no create-payment-intent:", error);
    return new NextResponse(`Internal Error: ${error}`, { status: 500 });
  }
}
