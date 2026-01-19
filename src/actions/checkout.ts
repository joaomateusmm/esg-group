"use server";

import { and, eq, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";

// Removemos Resend por enquanto, pois o email de produto físico é diferente (tracking)
// Se quiser email, precisa criar um novo template "Pedido Recebido"
import { db } from "@/db";
import { coupon, order, orderItem, product, user } from "@/db/schema";
import { auth } from "@/lib/auth";

type CartItemInput = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

// --- FUNÇÃO AUXILIAR PARA CALCULAR TUDO COM CUPOM ---
async function calculateOrderTotals(
  items: CartItemInput[],
  couponCode?: string,
) {
  const subtotal = Math.round(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

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

  const finalTotal = subtotal - discountAmount;

  return { subtotal, discountAmount, finalTotal, activeCouponId };
}

// ==============================================================================
// 1. CHECKOUT PAGO (PREPARAÇÃO)
// ==============================================================================
// No novo fluxo do Stripe, esta função apenas valida estoque e cria/atualiza usuário
// O pagamento real acontece no cliente via Stripe Elements
export async function createCheckoutSession(
  items: CartItemInput[],
  guestInfo?: { email: string; name: string },
  couponCode?: string,
) {
  // --- VERIFICAÇÃO DE ESTOQUE ---
  for (const item of items) {
    const productInDb = await db.query.product.findFirst({
      where: eq(product.id, item.id),
    });

    if (!productInDb) {
      throw new Error(`Produto ${item.name} não encontrado.`);
    }

    if (
      !productInDb.isStockUnlimited &&
      productInDb.stock !== null &&
      productInDb.stock < item.quantity
    ) {
      throw new Error(
        `O produto "${productInDb.name}" esgotou ou não tem a quantidade solicitada (Restam: ${productInDb.stock}).`,
      );
    }
  }

  const session = await auth.api.getSession({ headers: await headers() });

  let userId: string;
  let userEmail: string;
  let userName: string;

  if (session) {
    userId = session.user.id;
    userEmail = session.user.email;
    userName = session.user.name;
  } else {
    if (!guestInfo?.email) throw new Error("E-mail obrigatório.");
    const email = guestInfo.email.toLowerCase();
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      userId = existingUser.id;
      userEmail = existingUser.email;
      userName = existingUser.name;
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
      userEmail = newUser.email;
      userName = newUser.name;
    }
  }

  // Se o total for zero, redireciona para o fluxo gratuito
  const { finalTotal } = await calculateOrderTotals(items, couponCode);
  if (finalTotal === 0) {
    return await createFreeOrder(items, guestInfo, couponCode);
  }
  return { success: true };
}

// ==============================================================================
// 2. CHECKOUT GRATUITO
// ==============================================================================
export async function createFreeOrder(
  items: CartItemInput[],
  guestInfo?: { email: string; name: string },
  couponCode?: string,
) {
  // --- VERIFICAÇÃO DE ESTOQUE ---
  for (const item of items) {
    const productInDb = await db.query.product.findFirst({
      where: eq(product.id, item.id),
    });

    if (!productInDb) {
      throw new Error(`Produto ${item.name} não encontrado.`);
    }

    if (
      !productInDb.isStockUnlimited &&
      productInDb.stock !== null &&
      productInDb.stock < item.quantity
    ) {
      throw new Error(
        `O produto "${productInDb.name}" esgotou (Restam: ${productInDb.stock}).`,
      );
    }
  }

  const session = await auth.api.getSession({ headers: await headers() });

  let userId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userEmail: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userName: string;

  if (session) {
    userId = session.user.id;
    userEmail = session.user.email;
    userName = session.user.name;
  } else {
    if (!guestInfo?.email) throw new Error("E-mail obrigatório.");
    const email = guestInfo.email.toLowerCase();
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      userId = existingUser.id;
      userEmail = existingUser.email;
      userName = existingUser.name;
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
      userEmail = newUser.email;
      userName = newUser.name;
    }
  }

  const { finalTotal, discountAmount, activeCouponId } =
    await calculateOrderTotals(items, couponCode);

  if (finalTotal > 0) {
    throw new Error("O valor final não é gratuito. Use o checkout pago.");
  }

  const [newOrder] = await db
    .insert(order)
    .values({
      userId: userId,
      amount: 0,
      discountAmount: discountAmount,
      couponId: activeCouponId,
      status: "completed", // Gratuito já nasce completo
      // Campos físicos opcionais zerados para pedido grátis
      shippingCost: 0,
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

  // --- ATUALIZAÇÃO DE ESTOQUE ---
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
      .set({
        usedCount: sql`${coupon.usedCount} + 1`,
      })
      .where(eq(coupon.id, activeCouponId));
  }

  // TODO: Enviar email de confirmação de pedido físico (não link de download)
  // await sendOrderConfirmationEmail(...)

  const cookieStore = await cookies();
  if (cookieStore.get("affiliate_code")) cookieStore.delete("affiliate_code");

  return { success: true, orderId: newOrder.id };
}
