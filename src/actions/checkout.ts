"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { Resend } from "resend";
import Stripe from "stripe";

import { db } from "@/db";
import { coupon, order, orderItem, product, user } from "@/db/schema";
import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
});

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@esggroup.com";

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

// --- FUNÇÕES AUXILIARES ---

const formatCurrency = (amount: number, currency = "GBP") => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
};

function calculateDeliveryDates(): { start: Date; end: Date } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() + 10);

  const end = new Date(today);
  end.setDate(today.getDate() + 17);

  return { start, end };
}

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

// --- EMAIL ACTION ---

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderId: string,
  amount: number,
  currency: string = "GBP",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[] = [], // Recebe itens do banco ou adaptados
) {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://esggroup.com";
    const LOGO_URL = `${BASE_URL}/images/logo.png`;
    const ORDER_LINK = `${BASE_URL}/pedido/${orderId}`;

    const formattedTotal = formatCurrency(amount, currency);

    const productsHtml = items
      .map(
        (item) => `
      <div style="border-bottom: 1px solid #eeeeee; padding: 15px 0; display: flex; align-items: center;">
        <img src="${item.image || "https://placehold.co/60"}" width="60" height="60" style="border-radius: 6px; object-fit: cover; margin-right: 15px; background-color: #f9f9f9;" />
        <div style="flex: 1;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #333;">${item.productName || item.name}</p> 
          <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Qtd: ${item.quantity}</p>
        </div>
        <div style="font-size: 14px; font-weight: 600; color: #333;">
          ${formatCurrency(item.price, currency)}
        </div>
      </div>
    `,
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; color: #333; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(to right, #ea580c, #f97316); padding: 30px 20px; text-align: center; color: white; }
          .content { padding: 30px 25px; }
          .btn { display: inline-block; background-color: #ea580c; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .summary-box { background-color: #fff7ed; border: 1px solid #ffedd5; padding: 15px; border-radius: 6px; margin-top: 20px; }
          .footer { background-color: #fafafa; padding: 20px; text-align: center; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img 
              src="${LOGO_URL}" 
              alt="ESG Group" 
              width="80" 
              height="80" 
              style="display: block; margin: 0 auto 15px auto; background-color: #ffffff; padding: 10px; border-radius: 50%; object-fit: contain;" 
            />
            <h2 style="margin:0;">Pedido Confirmado!</h2>
            <p style="margin:5px 0 0 0; opacity:0.9;">Pedido #${orderId.slice(0, 8).toUpperCase()}</p>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Olá, <strong>${name}</strong>!</p>
            
            <p style="color: #555; line-height: 1.5;">
              Seu pedido está sendo processado com sucesso. Estamos muito felizes em ter você como cliente!
              <br>Já estamos preparando tudo para o envio.
            </p>
            
            <div style="margin-top: 25px; margin-bottom: 25px;">
              <h3 style="font-size: 14px; text-transform: uppercase; color: #888; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 0;">Itens do Pedido</h3>
              ${productsHtml}
            </div>

            <div class="summary-box">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 14px; font-weight: bold; color: #ea580c; text-align: left;">
                    Valor Total
                  </td>
                  <td style="font-size: 18px; font-weight: bold; color: #ea580c; text-align: right;">
                    ${formattedTotal}
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align: center;">
              <p style="font-size: 13px; color: #777; margin-bottom: 20px; margin-top: 20px;">
                Você receberá atualizações no seu email sobre o rastreio assim que o pedido for despachado.
              </p>
              <a href="${ORDER_LINK}" class="btn">Acompanhar Meus Pedidos</a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ESG Group. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "ESG Group <contato@esggroup.shop>",
      to: [email, ADMIN_EMAIL],
      subject: `Pedido #${orderId.slice(0, 8).toUpperCase()} Confirmado!`,
      html: emailHtml,
    });

    if (error) {
      console.error("❌ ERRO RESEND (Checkout):", error);
    } else {
      console.log(
        `✅ E-mail de compra enviado para ${email} (ID: ${data?.id})`,
      );
    }
  } catch (err) {
    console.error("❌ Erro ao enviar email de checkout:", err);
  }
}

// --- CHECKOUT ACTIONS ---

export async function getCartShippingCost(items: CartItemInput[]) {
  const { shippingCost } = await calculateOrderTotals(items);
  return { price: shippingCost };
}

// --- LÓGICA DE USUÁRIO (SHADOW ACCOUNT) ---
// Função auxiliar interna para garantir que temos um userId
async function getOrCreateUserId(
  sessionUserId?: string,
  guestInfo?: { email: string; name: string },
): Promise<string> {
  if (sessionUserId) {
    return sessionUserId;
  }

  if (!guestInfo?.email) {
    throw new Error("E-mail é obrigatório para finalizar a compra.");
  }

  const email = guestInfo.email.toLowerCase();

  // 1. Verifica se já existe (mesmo que não logado)
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existingUser) {
    return existingUser.id;
  }

  // 2. Cria conta sombra (Shadow Account)
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

  return newUser.id;
}

export async function createCheckoutSession(
  items: CartItemInput[],
  guestInfo?: { email: string; name: string },
  couponCode?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _returnUrl?: string,
) {
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

  // --- APLICA A LÓGICA DE SHADOW ACCOUNT ---
  const userId = await getOrCreateUserId(session?.user.id, guestInfo);

  const { finalTotal, discountAmount, activeCouponId, shippingCost } =
    await calculateOrderTotals(items, couponCode);

  if (finalTotal === 0) {
    return await createFreeOrder(items, guestInfo, couponCode);
  }

  try {
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

  // --- APLICA A LÓGICA DE SHADOW ACCOUNT ---
  const userId = await getOrCreateUserId(session?.user.id, guestInfo);

  const { finalTotal, discountAmount, activeCouponId, shippingCost } =
    await calculateOrderTotals(items, couponCode);

  const { start, end } = calculateDeliveryDates();

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
      estimatedDeliveryStart: start,
      estimatedDeliveryEnd: end,
      customerName: guestInfo?.name || session?.user.name,
      customerEmail: guestInfo?.email || session?.user.email,
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

  if (newOrder && newOrder.customerEmail) {
    sendOrderConfirmationEmail(
      newOrder.customerEmail,
      newOrder.customerName || "Cliente",
      newOrder.id,
      newOrder.amount,
      newOrder.currency || "GBP",
      items,
    ).catch((err) => console.error("Erro ao enviar email COD:", err));
  }

  const cookieStore = await cookies();
  if (cookieStore.get("affiliate_code")) cookieStore.delete("affiliate_code");

  return { success: true, orderId: newOrder.id };
}

export async function updateOrderToCOD(
  orderId: string,
  guestInfo?: { email: string; name: string },
  shippingAddress?: ShippingAddressInput,
) {
  const existingOrder = await db.query.order.findFirst({
    where: eq(order.id, orderId),
    with: {
      items: true,
    },
  });

  if (!existingOrder) {
    throw new Error("Pedido inicial não encontrado. Tente novamente.");
  }

  const { start, end } = calculateDeliveryDates();

  // Para updates, usamos os dados que já existem ou os novos do guest
  const customerName = guestInfo?.name || existingOrder.customerName;
  const customerEmail = guestInfo?.email || existingOrder.customerEmail;

  await db
    .update(order)
    .set({
      paymentMethod: "cod",
      status: "pending",
      fulfillmentStatus: "processing",
      shippingAddress: shippingAddress ? shippingAddress : null,
      userPhone: shippingAddress?.phone,
      customerName: customerName,
      customerEmail: customerEmail,
      estimatedDeliveryStart: start,
      estimatedDeliveryEnd: end,
      stripePaymentIntentId: null,
      stripeClientSecret: null,
    })
    .where(eq(order.id, orderId));

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

  if (existingOrder.couponId) {
    await db
      .update(coupon)
      .set({ usedCount: sql`${coupon.usedCount} + 1` })
      .where(eq(coupon.id, existingOrder.couponId));
  }

  if (customerEmail) {
    sendOrderConfirmationEmail(
      customerEmail,
      customerName || "Cliente",
      existingOrder.id,
      existingOrder.amount,
      existingOrder.currency || "GBP",
      existingOrder.items,
    ).catch((err) => console.error("Erro ao enviar email UPDATE COD:", err));
  }

  const cookieStore = await cookies();
  if (cookieStore.get("affiliate_code")) cookieStore.delete("affiliate_code");

  return { success: true, orderId: orderId };
}

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

  // --- APLICA A LÓGICA DE SHADOW ACCOUNT ---
  const userId = await getOrCreateUserId(session?.user.id, guestInfo);

  const { finalTotal, discountAmount, activeCouponId, shippingCost } =
    await calculateOrderTotals(items, couponCode);

  if (finalTotal > 0) {
    throw new Error("O valor final não é gratuito. Use o checkout pago.");
  }

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
      estimatedDeliveryStart: start,
      estimatedDeliveryEnd: end,
      customerName: guestInfo?.name || session?.user.name,
      customerEmail: guestInfo?.email || session?.user.email,
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

  if (newOrder && newOrder.customerEmail) {
    sendOrderConfirmationEmail(
      newOrder.customerEmail,
      newOrder.customerName || "Cliente",
      newOrder.id,
      0,
      newOrder.currency || "GBP",
      items,
    ).catch((err) => console.error("Erro ao enviar email Grátis:", err));
  }

  const cookieStore = await cookies();
  if (cookieStore.get("affiliate_code")) cookieStore.delete("affiliate_code");

  return { success: true, orderId: newOrder.id };
}

export async function updateOrderAddressAction(
  orderId: string,
  shippingAddress: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
  },
  guestEmail?: string,
) {
  try {
    if (guestEmail) {
      await db
        .update(order)
        .set({ customerEmail: guestEmail })
        .where(eq(order.id, orderId));
    }
    await db
      .update(order)
      .set({
        shippingAddress: {
          street: shippingAddress.street,
          number: shippingAddress.number,
          complement: shippingAddress.complement || "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: "BR",
        },
      })
      .where(eq(order.id, orderId));

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar endereço do pedido:", error);
    return { success: false, error: "Falha ao salvar endereço." };
  }
}

export async function getOrderIdByPaymentIntent(paymentIntentId: string) {
  try {
    const foundOrder = await db.query.order.findFirst({
      where: eq(order.stripePaymentIntentId, paymentIntentId),
      columns: { id: true },
    });
    return foundOrder?.id || null;
  } catch (error) {
    console.error("Erro ao buscar pedido por transação:", error);
    return null;
  }
}
