"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import Stripe from "stripe";

import { db } from "@/db";
import { coupon, order, orderItem, product, user } from "@/db/schema";
import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
});

type CartItemInput = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  currency?: string;
};

type ShippingAddressInput = {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
};

// --- HELPER PARA CALCULAR DATAS DE ENTREGA (10 a 17 dias) ---
// Movida para o topo para garantir tipagem correta
function calculateDeliveryDates(): { start: Date; end: Date } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() + 10);

  const end = new Date(today);
  end.setDate(today.getDate() + 17);

  return { start, end };
}

// --- FUNÇÃO AUXILIAR PARA CALCULAR TUDO (COM FRETE) ---
async function calculateOrderTotals(
  items: CartItemInput[],
  couponCode?: string,
) {
  const subtotal = Math.round(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  let totalShippingCost = 0;

  const productIds = items.map((i) => i.id);

  let productsDb: {
    id: string;
    shippingType: string | null;
    fixedShippingPrice: number | null;
  }[] = [];

  if (productIds.length > 0) {
    productsDb = await db.query.product.findMany({
      where: inArray(product.id, productIds),
      columns: {
        id: true,
        shippingType: true,
        fixedShippingPrice: true,
      },
    });
  }

  for (const item of items) {
    const prodInfo = productsDb.find((p) => p.id === item.id);

    if (prodInfo) {
      if (prodInfo.shippingType === "fixed") {
        totalShippingCost += (prodInfo.fixedShippingPrice || 0) * item.quantity;
      }
    }
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

  const totalWithDiscount = subtotal - discountAmount;
  const finalTotal = totalWithDiscount + totalShippingCost;

  return {
    subtotal,
    discountAmount,
    shippingCost: totalShippingCost,
    finalTotal,
    activeCouponId,
  };
}

// --- ACTION EXPORTADA PARA O FRONTEND PEGAR O FRETE ---
export async function getCartShippingCost(items: CartItemInput[]) {
  const { shippingCost } = await calculateOrderTotals(items);
  return { price: shippingCost };
}

// --- CRIAÇÃO DE SESSÃO DE CHECKOUT (STRIPE) ---
export async function createCheckoutSession(
  items: CartItemInput[],
  guestInfo?: { email: string; name: string },
  couponCode?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _returnUrl?: string,
) {
  // 1. Detecta a moeda do primeiro item (Default GBP se não houver)
  const firstCurrency = items[0]?.currency || "GBP";

  if (items[0]?.currency) {
    const hasMixedCurrencies = items.some(
      (item) => item.currency && item.currency !== firstCurrency,
    );
    if (hasMixedCurrencies) {
      throw new Error("Cannot checkout with mixed currencies.");
    }
  }

  for (const item of items) {
    const productInDb = await db.query.product.findFirst({
      where: eq(product.id, item.id),
    });

    if (!productInDb) throw new Error(`Produto ${item.name} não encontrado.`);

    if (
      !productInDb.isStockUnlimited &&
      productInDb.stock !== null &&
      productInDb.stock < item.quantity
    ) {
      throw new Error(`O produto "${productInDb.name}" esgotou.`);
    }
  }

  const session = await auth.api.getSession({ headers: await headers() });
  let userId: string;

  if (session) {
    userId = session.user.id;
  } else {
    if (!guestInfo?.email) throw new Error("E-mail obrigatório.");
    const email = guestInfo.email.toLowerCase();
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const now = new Date();
      const [newUser] = await db
        .insert(user)
        .values({
          id: crypto.randomUUID(),
          name: guestInfo.name || "Visitante",
          email: email,
          image: "",
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
          role: "user",
        })
        .returning();
      userId = newUser.id;
    }
  }

  const { finalTotal, discountAmount, activeCouponId, shippingCost } =
    await calculateOrderTotals(items, couponCode);

  if (finalTotal === 0) {
    return await createFreeOrder(items, guestInfo, couponCode);
  }

  try {
    // CALCULA DATAS DE ENTREGA
    const { start, end } = calculateDeliveryDates();

    const [newOrder] = await db
      .insert(order)
      .values({
        userId: userId,
        amount: finalTotal,
        discountAmount: discountAmount,
        couponId: activeCouponId,
        status: "pending",
        paymentMethod: "card",
        shippingCost: shippingCost,
        currency: firstCurrency,
        customerName: guestInfo?.name || session?.user.name,
        customerEmail: guestInfo?.email || session?.user.email,
        fulfillmentStatus: "idle",
        // SALVA AS DATAS NO BANCO
        estimatedDeliveryStart: start,
        estimatedDeliveryEnd: end,
      })
      .returning();

    await db.insert(orderItem).values(
      items.map((item) => ({
        orderId: newOrder.id,
        productId: item.id,
        productName: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    );

    const lineItems = items.map((item) => ({
      price_data: {
        currency: (firstCurrency || "brl").toLowerCase(),
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price),
      },
      quantity: item.quantity,
    }));

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: (firstCurrency || "brl").toLowerCase(),
          product_data: {
            name: "Frete / Shipping",
            images: [],
          },
          unit_amount: shippingCost,
        },
        quantity: 1,
      });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?orderId=${newOrder.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancelado`,
      customer_email: guestInfo?.email || session?.user.email,
      metadata: {
        orderId: newOrder.id,
        userId: userId,
      },
    });

    return { success: true, url: stripeSession.url };
  } catch (error) {
    console.error("Erro ao criar sessão Stripe:", error);
    throw new Error("Erro ao iniciar pagamento.");
  }
}

// --- PAGAMENTO NA ENTREGA (COD) ---
export async function createOrderCOD(
  items: CartItemInput[],
  guestInfo?: { email: string; name: string },
  couponCode?: string,
  shippingAddress?: ShippingAddressInput,
) {
  const firstCurrency = items[0]?.currency || "GBP";

  for (const item of items) {
    const productInDb = await db.query.product.findFirst({
      where: eq(product.id, item.id),
    });
    if (!productInDb) throw new Error(`Produto ${item.name} não encontrado.`);
    if (
      !productInDb.isStockUnlimited &&
      productInDb.stock !== null &&
      productInDb.stock < item.quantity
    ) {
      throw new Error(`O produto "${productInDb.name}" esgotou.`);
    }
  }

  const session = await auth.api.getSession({ headers: await headers() });
  let userId: string;

  if (session) {
    userId = session.user.id;
  } else {
    if (!guestInfo?.email) throw new Error("E-mail obrigatório.");
    const email = guestInfo.email.toLowerCase();
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const now = new Date();
      const [newUser] = await db
        .insert(user)
        .values({
          id: crypto.randomUUID(),
          name: guestInfo.name || "Visitante",
          email: email,
          image: "",
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
          role: "user",
        })
        .returning();
      userId = newUser.id;
    }
  }

  const { finalTotal, discountAmount, activeCouponId, shippingCost } =
    await calculateOrderTotals(items, couponCode);

  // CALCULA DATAS DE ENTREGA
  const { start, end } = calculateDeliveryDates();

  // CRIA O PEDIDO COD
  const [newOrder] = await db
    .insert(order)
    .values({
      userId: userId,
      amount: finalTotal,
      discountAmount: discountAmount,
      couponId: activeCouponId,
      status: "pending",
      paymentMethod: "cod",
      shippingCost: shippingCost,
      currency: firstCurrency,
      shippingAddress: shippingAddress ? shippingAddress : null,
      userPhone: shippingAddress?.phone,
      fulfillmentStatus: "processing",
      // SALVA AS DATAS NO BANCO
      estimatedDeliveryStart: start,
      estimatedDeliveryEnd: end,
    })
    .returning();

  await db.insert(orderItem).values(
    items.map((item) => ({
      orderId: newOrder.id,
      productId: item.id,
      productName: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),
  );

  for (const item of items) {
    await db
      .update(product)
      .set({ sales: sql`${product.sales} + ${item.quantity}` })
      .where(eq(product.id, item.id));
    await db
      .update(product)
      .set({ stock: sql`${product.stock} - ${item.quantity}` })
      .where(and(eq(product.id, item.id), eq(product.isStockUnlimited, false)));
  }

  if (activeCouponId) {
    await db
      .update(coupon)
      .set({ usedCount: sql`${coupon.usedCount} + 1` })
      .where(eq(coupon.id, activeCouponId));
  }

  const cookieStore = await cookies();
  if (cookieStore.get("affiliate_code")) cookieStore.delete("affiliate_code");

  return { success: true, orderId: newOrder.id };
}

// --- NOVA FUNÇÃO: CONVERTER PEDIDO EXISTENTE PARA COD (CORREÇÃO DE DUPLICIDADE) ---
export async function updateOrderToCOD(
  orderId: string,
  guestInfo?: { email: string; name: string },
  shippingAddress?: ShippingAddressInput,
) {
  // 1. Busca o pedido existente
  const existingOrder = await db.query.order.findFirst({
    where: eq(order.id, orderId),
    with: {
      items: true,
    },
  });

  if (!existingOrder) {
    throw new Error("Pedido inicial não encontrado. Tente novamente.");
  }

  // 2. Calcula as datas de entrega
  const { start, end } = calculateDeliveryDates();

  // 3. Atualiza o pedido para COD
  await db
    .update(order)
    .set({
      paymentMethod: "cod",
      status: "pending",
      fulfillmentStatus: "processing",
      shippingAddress: shippingAddress ? shippingAddress : null,
      userPhone: shippingAddress?.phone,
      customerName: guestInfo?.name || existingOrder.customerName,
      customerEmail: guestInfo?.email || existingOrder.customerEmail,
      // Salva as datas
      estimatedDeliveryStart: start,
      estimatedDeliveryEnd: end,
      stripePaymentIntentId: null,
      stripeClientSecret: null,
    })
    .where(eq(order.id, orderId));

  // 4. Baixa o estoque
  for (const item of existingOrder.items) {
    await db
      .update(product)
      .set({ sales: sql`${product.sales} + ${item.quantity}` })
      .where(eq(product.id, item.productId));

    await db
      .update(product)
      .set({ stock: sql`${product.stock} - ${item.quantity}` })
      .where(
        and(
          eq(product.id, item.productId),
          eq(product.isStockUnlimited, false),
        ),
      );
  }

  // 5. Atualiza uso do cupom se houver
  if (existingOrder.couponId) {
    await db
      .update(coupon)
      .set({ usedCount: sql`${coupon.usedCount} + 1` })
      .where(eq(coupon.id, existingOrder.couponId));
  }

  // 6. Limpa cookie de afiliado
  const cookieStore = await cookies();
  if (cookieStore.get("affiliate_code")) cookieStore.delete("affiliate_code");

  return { success: true, orderId: orderId };
}

// --- FLUXO GRATUITO ---
export async function createFreeOrder(
  items: CartItemInput[],
  guestInfo?: { email: string; name: string },
  couponCode?: string,
  shippingAddress?: ShippingAddressInput,
) {
  const firstCurrency = items[0]?.currency || "GBP";

  for (const item of items) {
    const productInDb = await db.query.product.findFirst({
      where: eq(product.id, item.id),
    });
    if (!productInDb) throw new Error(`Produto ${item.name} não encontrado.`);
    if (
      !productInDb.isStockUnlimited &&
      productInDb.stock !== null &&
      productInDb.stock < item.quantity
    ) {
      throw new Error(`O produto "${productInDb.name}" esgotou.`);
    }
  }

  const session = await auth.api.getSession({ headers: await headers() });
  let userId: string;

  if (session) {
    userId = session.user.id;
  } else {
    if (!guestInfo?.email) throw new Error("E-mail obrigatório.");
    const email = guestInfo.email.toLowerCase();
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const now = new Date();
      const [newUser] = await db
        .insert(user)
        .values({
          id: crypto.randomUUID(),
          name: guestInfo.name || "Visitante",
          email: email,
          image: "",
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
          role: "user",
        })
        .returning();
      userId = newUser.id;
    }
  }

  const { finalTotal, discountAmount, activeCouponId, shippingCost } =
    await calculateOrderTotals(items, couponCode);

  if (finalTotal > 0) {
    throw new Error("O valor final não é gratuito. Use o checkout pago.");
  }

  // CALCULA DATAS DE ENTREGA
  const { start, end } = calculateDeliveryDates();

  const [newOrder] = await db
    .insert(order)
    .values({
      userId: userId,
      amount: 0,
      discountAmount: discountAmount,
      couponId: activeCouponId,
      status: "completed",
      paymentMethod: "free",
      shippingCost: shippingCost,
      currency: firstCurrency,
      shippingAddress: shippingAddress ? shippingAddress : null,
      userPhone: shippingAddress?.phone,
      fulfillmentStatus: "processing",
      // SALVA AS DATAS NO BANCO
      estimatedDeliveryStart: start,
      estimatedDeliveryEnd: end,
    })
    .returning();

  await db.insert(orderItem).values(
    items.map((item) => ({
      orderId: newOrder.id,
      productId: item.id,
      productName: item.name,
      price: 0,
      quantity: item.quantity,
      image: item.image,
    })),
  );

  for (const item of items) {
    await db
      .update(product)
      .set({ sales: sql`${product.sales} + ${item.quantity}` })
      .where(eq(product.id, item.id));
    await db
      .update(product)
      .set({ stock: sql`${product.stock} - ${item.quantity}` })
      .where(and(eq(product.id, item.id), eq(product.isStockUnlimited, false)));
  }

  if (activeCouponId) {
    await db
      .update(coupon)
      .set({ usedCount: sql`${coupon.usedCount} + 1` })
      .where(eq(coupon.id, activeCouponId));
  }

  const cookieStore = await cookies();
  if (cookieStore.get("affiliate_code")) cookieStore.delete("affiliate_code");

  return { success: true, orderId: newOrder.id };
}
