"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { Resend } from "resend";

import { db } from "@/db";
import {
  affiliate,
  commission,
  coupon, // <--- Importe a tabela coupon
  order,
  orderItem,
  product,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

type CartItemInput = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

// --- FUNÇÃO AUXILIAR PARA CALCULAR TUDO COM CUPOM ---
// Isso evita repetir código nas duas actions
async function calculateOrderTotals(
  items: CartItemInput[],
  couponCode?: string,
) {
  // 1. Total bruto
  const subtotal = Math.round(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  let discountAmount = 0;
  let activeCouponId: string | null = null;

  // 2. Lógica do Cupom
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

      // Trava de segurança para desconto não exceder total
      if (discountAmount > subtotal) discountAmount = subtotal;

      activeCouponId = foundCoupon.id;
    }
  }

  const finalTotal = subtotal - discountAmount;

  return { subtotal, discountAmount, finalTotal, activeCouponId };
}

// --- FUNÇÃO DE EMAIL (Igual a anterior) ---
async function sendProductEmail(
  to: string,
  name: string,
  items: CartItemInput[],
) {
  const productsWithLinks = await Promise.all(
    items.map(async (item) => {
      const prod = await db.query.product.findFirst({
        where: eq(product.id, item.id),
        columns: { downloadUrl: true },
      });
      return {
        name: item.name,
        url: prod?.downloadUrl || "#",
      };
    }),
  );

  const productsHtml = productsWithLinks
    .map(
      (p) => `
      <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
        <h3 style="margin: 0 0 5px; color: #333;">${p.name}</h3>
        ${
          p.url && p.url !== "#"
            ? `<a href="${p.url}" style="background-color: #D00000; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-family: sans-serif;">Baixar Arquivo</a>`
            : `<p style="color: #666; font-size: 14px;">Acesse sua conta para visualizar.</p>`
        }
      </div>
    `,
    )
    .join("");

  const emailHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #D00000;">Seu pedido está aqui! 🚀</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Aqui estão os arquivos dos seus produtos:</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
          ${productsHtml}
        </div>
        <p>Você também pode acessar seus arquivos a qualquer momento na sua área de membros.</p>
      </div>
    `;

  await resend.emails.send({
    from: "SubMind Store <onboarding@resend.dev>",
    to: [to],
    subject: "Seu pedido está aqui! 📦",
    html: emailHtml,
  });
}

// ==============================================================================
// 1. CHECKOUT PAGO
// Agora aceita `couponCode`
// ==============================================================================
export async function createCheckoutSession(
  items: CartItemInput[],
  guestInfo?: { email: string; name: string },
  couponCode?: string, // <--- NOVO PARÂMETRO
) {
  const session = await auth.api.getSession({ headers: await headers() });

  let userId: string;
  let userEmail: string;
  let userName: string;

  // Identificação do Usuário
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

  // --- CÁLCULO DE TOTAIS COM CUPOM ---
  const { finalTotal, discountAmount, activeCouponId } =
    await calculateOrderTotals(items, couponCode);


  if (finalTotal === 0) {
    return await createFreeOrder(items, guestInfo, couponCode);
  }

  if (finalTotal < 100) {
    throw new Error("O valor mínimo para transação (após descontos) é R$ 1,00");
  }

  // Afiliados
  const cookieStore = await cookies();
  const affiliateCode = cookieStore.get("affiliate_code")?.value;
  let activeAffiliate = null;
  if (affiliateCode) {
    activeAffiliate = await db.query.affiliate.findFirst({
      where: eq(affiliate.code, affiliateCode),
    });
    if (activeAffiliate && activeAffiliate.userId === userId)
      activeAffiliate = null;
  }

  // Criar Pedido
  const [newOrder] = await db
    .insert(order)
    .values({
      userId: userId,
      amount: finalTotal, // Usa o total com desconto
      discountAmount: discountAmount, // <--- Salva o desconto
      couponId: activeCouponId, // <--- Salva o ID do cupom
      status: "pending",
    })
    .returning();

  // Salvar Itens
  await db.insert(orderItem).values(
    items.map((item) => ({
      orderId: newOrder.id,
      productId: item.id,
      productName: item.name,
      price: Math.round(item.price),
      quantity: item.quantity,
      image: item.image,
    })),
  );

  // Comissões (Calculada sobre o valor final pago, não o original)
  // Isso é importante: se deu desconto, a comissão do afiliado diminui proporcionalmente?
  // Geralmente sim. Aqui vamos calcular item a item proporcionalmente.
  if (activeAffiliate) {
    try {
      const productIds = items.map((i) => i.id);
      const dbProducts = await db
        .select()
        .from(product)
        .where(inArray(product.id, productIds));
      let totalCommission = 0;

      // Fator de desconto (ex: se pagou 80% do valor, comissão é 80% do original)
      const discountFactor = finalTotal / (finalTotal + discountAmount);

      for (const item of items) {
        const dbProd = dbProducts.find((p) => p.id === item.id);
        const rate = dbProd?.affiliateRate ?? 20;

        const itemOriginalTotal = item.price * item.quantity;
        const itemPaidTotal = itemOriginalTotal * discountFactor; // Valor proporcional pago neste item

        const commissionValue = Math.round(itemPaidTotal * (rate / 100));
        totalCommission += commissionValue;
      }

      if (totalCommission > 0) {
        await db.insert(commission).values({
          affiliateId: activeAffiliate.id,
          orderId: newOrder.id,
          amount: totalCommission,
          status: "pending",
          description: `Venda via link: ${affiliateCode}`,
        });
        cookieStore.delete("affiliate_code");
      }
    } catch (e) {
      console.error(e);
    }
  }

  // InfinitePay
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const infinitePayPayload = {
    handle: process.env.INFINITEPAY_HANDLE,
    order_nsu: newOrder.id,
    amount: finalTotal, // Valor com desconto
    redirect_url: `${baseUrl}/checkout/success`,
    webhook_url: `${baseUrl}/api/webhooks/infinitepay`,
    items: items.map((item) => ({
      quantity: item.quantity,
      // Ajuste de preço unitário visual para o gateway (proporcional)
      price: Math.round(
        item.price * (finalTotal / (finalTotal + discountAmount)),
      ),
      description: item.name.substring(0, 250),
    })),
    customer: { name: userName, email: userEmail },
    metadata: {
      source: "submind",
      user_id: userId,
      affiliate_id: activeAffiliate?.id || "",
    },
  };

  try {
    const res = await fetch(
      "https://api.infinitepay.io/invoices/public/checkout/links",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(infinitePayPayload),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro pagamento");

    await db
      .update(order)
      .set({ infinitePayUrl: data.url })
      .where(eq(order.id, newOrder.id));

    // Decrementar uso do cupom (se existir) - SÓ QUANDO GERA O LINK (ou idealmente no webhook de sucesso)
    // Mas como a IP não manda webhook de "link criado", fazemos aqui.
    // O ideal mesmo seria no webhook de pagamento aprovado, mas vamos fazer aqui pra garantir.
    if (activeCouponId) {
      await db
        .update(coupon)
        .set({
          usedCount: sql`${coupon.usedCount} + 1`,
        })
        .where(eq(coupon.id, activeCouponId));
    }

    return { url: data.url };
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("Erro checkout");
  }
}

export async function createFreeOrder(
  items: CartItemInput[],
  guestInfo?: { email: string; name: string },
  couponCode?: string, // <--- NOVO PARÂMETRO
) {
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

  // --- CÁLCULO DE TOTAIS ---
  const { finalTotal, discountAmount, activeCouponId } =
    await calculateOrderTotals(items, couponCode);

  // Validação: Só permite se o total final for realmente 0
  if (finalTotal > 0) {
    throw new Error("O valor final não é gratuito. Use o checkout pago.");
  }

  // Criar Pedido
  const [newOrder] = await db
    .insert(order)
    .values({
      userId: userId,
      amount: 0,
      discountAmount: discountAmount, // Registra o desconto
      couponId: activeCouponId, // Registra o cupom
      status: "completed",
    })
    .returning();

  // Salvar Itens
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

  // Atualizar Estoque/Vendas e Cupom
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

  // Incrementa uso do cupom
  if (activeCouponId) {
    await db
      .update(coupon)
      .set({
        usedCount: sql`${coupon.usedCount} + 1`,
      })
      .where(eq(coupon.id, activeCouponId));
  }

  // Email
  try {
    await sendProductEmail(userEmail, userName, items);
  } catch (e) {
    console.error(e);
  }

  const cookieStore = await cookies();
  if (cookieStore.get("affiliate_code")) cookieStore.delete("affiliate_code");

  return { success: true, orderId: newOrder.id };
}
