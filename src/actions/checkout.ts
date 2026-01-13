"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";

import { db } from "@/db";
import {
  affiliate,
  commission,
  order,
  orderItem,
  product,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";

// Tipo esperado dos itens do carrinho
type CartItemInput = {
  id: string;
  name: string;
  price: number; // em centavos
  quantity: number;
  image?: string;
};

// ==============================================================================
// 1. CHECKOUT PAGO (InfinitePay)
// O e-mail NÃO é enviado aqui. Ele deve ser enviado pelo Webhook após confirmação.
// ==============================================================================
export async function createCheckoutSession(
  items: CartItemInput[],
  guestInfo?: { email: string; name: string },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let userId: string;
  let userEmail: string;
  let userName: string;

  // --- LÓGICA DE IDENTIFICAÇÃO DO USUÁRIO ---
  if (session) {
    userId = session.user.id;
    userEmail = session.user.email;
    userName = session.user.name;
  } else {
    if (!guestInfo?.email) {
      throw new Error(
        "É necessário fazer login ou informar um e-mail para continuar.",
      );
    }

    const email = guestInfo.email.toLowerCase();
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      userId = existingUser.id;
      userEmail = existingUser.email;
      userName = existingUser.name;
    } else {
      const newUserId = crypto.randomUUID();
      const now = new Date();
      const [newUser] = await db
        .insert(user)
        .values({
          id: newUserId,
          name: guestInfo.name || "Cliente Visitante",
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

  // --- LÓGICA DE AFILIADOS ---
  const cookieStore = await cookies();
  const affiliateCode = cookieStore.get("affiliate_code")?.value;
  let activeAffiliate = null;

  if (affiliateCode) {
    activeAffiliate = await db.query.affiliate.findFirst({
      where: eq(affiliate.code, affiliateCode),
    });
    if (activeAffiliate && activeAffiliate.userId === userId) {
      activeAffiliate = null;
    }
  }

  // 2. Calcular Total
  const totalAmount = Math.round(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  if (totalAmount < 100) {
    throw new Error("O valor mínimo para transação é R$ 1,00");
  }

  // 3. Criar Pedido
  const [newOrder] = await db
    .insert(order)
    .values({
      userId: userId,
      amount: totalAmount,
      status: "pending",
    })
    .returning();

  // 4. Salvar Itens
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

  // 5. Calcular Comissão
  if (activeAffiliate) {
    try {
      const productIds = items.map((i) => i.id);
      const dbProducts = await db
        .select()
        .from(product)
        .where(inArray(product.id, productIds));

      let totalCommission = 0;
      for (const item of items) {
        const dbProd = dbProducts.find((p) => p.id === item.id);
        const rate = dbProd?.affiliateRate ?? 20;
        const itemTotal = item.price * item.quantity;
        const commissionValue = Math.round(itemTotal * (rate / 100));
        totalCommission += commissionValue;
      }

      if (totalCommission > 0) {
        await db.insert(commission).values({
          affiliateId: activeAffiliate.id,
          orderId: newOrder.id,
          amount: totalCommission,
          status: "pending",
          description: `Venda via link de afiliado: ${affiliateCode}`,
        });
        cookieStore.delete("affiliate_code");
      }
    } catch (error) {
      console.error("Erro ao gerar comissão:", error);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 6. Payload InfinitePay
  const infinitePayPayload = {
    handle: process.env.INFINITEPAY_HANDLE,
    order_nsu: newOrder.id,
    amount: totalAmount,
    redirect_url: `${baseUrl}/checkout/success`,
    webhook_url: `${baseUrl}/api/webhooks/infinitepay`,
    items: items.map((item) => ({
      quantity: item.quantity,
      price: Math.round(item.price),
      description: item.name.substring(0, 250),
    })),
    customer: {
      name: userName,
      email: userEmail,
    },
    address: {
      line1: "Produto Digital",
      line2: "SubMind",
      zip: "60000000",
      city: "Fortaleza",
      state: "CE",
      country: "BR",
    },
    metadata: {
      source: "submind_site",
      user_id: userId,
      affiliate_id: activeAffiliate?.id || "",
    },
  };

  try {
    const response = await fetch(
      "https://api.infinitepay.io/invoices/public/checkout/links",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(infinitePayPayload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erro InfinitePay:", JSON.stringify(data, null, 2));
      throw new Error(data.message || "Erro ao criar pagamento");
    }

    await db
      .update(order)
      .set({ infinitePayUrl: data.url })
      .where(eq(order.id, newOrder.id));

    return { url: data.url };
  } catch (error) {
    console.error(error);
    if (error instanceof Error) throw error;
    throw new Error("Falha ao processar checkout");
  }
}

// ==============================================================================
// 2. CHECKOUT GRATUITO (Novo)
// Aqui DEVEMOS enviar o e-mail, pois não haverá webhook de pagamento.
// ==============================================================================
export async function createFreeOrder(
  items: CartItemInput[],
  guestInfo?: { email: string; name: string },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let userId: string;
  let userEmail: string;
  let userName: string;

  // LÓGICA DE IDENTIFICAÇÃO (Mesma da createCheckoutSession)
  if (session) {
    userId = session.user.id;
    userEmail = session.user.email;
    userName = session.user.name;
  } else {
    if (!guestInfo?.email) {
      throw new Error(
        "É necessário fazer login ou informar um e-mail para continuar.",
      );
    }
    const email = guestInfo.email.toLowerCase();
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      userId = existingUser.id;
      userEmail = existingUser.email;
      userName = existingUser.name;
    } else {
      const newUserId = crypto.randomUUID();
      const now = new Date();
      const [newUser] = await db
        .insert(user)
        .values({
          id: newUserId,
          name: guestInfo.name || "Cliente Visitante",
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

  // VALIDAÇÃO DE SEGURANÇA
  const totalAmount = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  if (totalAmount > 0) {
    throw new Error("Esta função é válida apenas para pedidos gratuitos.");
  }

  // CRIAR PEDIDO (Status COMPLETED)
  const [newOrder] = await db
    .insert(order)
    .values({
      userId: userId,
      amount: 0,
      status: "completed",
    })
    .returning();

  // SALVAR ITENS
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

  // ATUALIZAR ESTOQUE E VENDAS
  for (const item of items) {
    // Sobe contador de vendas
    await db
      .update(product)
      .set({
        sales: sql`${product.sales} + ${item.quantity}`,
      })
      .where(eq(product.id, item.id));

    // Desce estoque se não for ilimitado
    await db
      .update(product)
      .set({
        stock: sql`${product.stock} - ${item.quantity}`,
      })
      .where(and(eq(product.id, item.id), eq(product.isStockUnlimited, false)));
  }

  // --- ENVIO DE E-MAIL ---
  // Como é grátis e imediato, chamamos a função de envio aqui.
  await sendOrderEmail(userEmail, userName, items);

  // Limpa cookie de afiliado se existir
  const cookieStore = await cookies();
  if (cookieStore.get("affiliate_code")) {
    cookieStore.delete("affiliate_code");
  }

  return { success: true, orderId: newOrder.id };
}

// ==============================================================================
// 3. FUNÇÃO AUXILIAR DE E-MAIL (PLACEHOLDER)
// Você deve substituir o console.log pela sua lógica real (Resend, Nodemailer, etc)
// ==============================================================================
async function sendOrderEmail(
  to: string,
  name: string,
  items: CartItemInput[],
) {
  // TODO: IMPLEMENTAR SUA LÓGICA DE EMAIL AQUI
  // Exemplo se estiver usando Resend:
  /*
  await resend.emails.send({
    from: 'SubMind <noreply@submind.com>',
    to: to,
    subject: 'Seu produto gratuito chegou! 🎁',
    react: EmailTemplate({ name, items })
  });
  */

  console.log(`
    [SIMULAÇÃO DE EMAIL]
    Para: ${to}
    Olá ${name},
    Aqui estão seus produtos gratuitos:
    ${items.map((i) => `- ${i.name}`).join("\n")}
  `);
}
