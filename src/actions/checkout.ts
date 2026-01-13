"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { Resend } from "resend";

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

// Inicializa o Resend com a chave de ambiente
const resend = new Resend(process.env.RESEND_API_KEY);

// Tipo esperado dos itens do carrinho
type CartItemInput = {
  id: string;
  name: string;
  price: number; // em centavos
  quantity: number;
  image?: string;
};

// ==============================================================================
// FUNÇÃO AUXILIAR DE ENVIO DE E-MAIL (Extraída da lógica do Webhook)
// ==============================================================================
async function sendProductEmail(
  to: string,
  name: string,
  items: CartItemInput[],
) {
  // Busca os links de download dos produtos no banco
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

        <p>Você também pode acessar seus arquivos a qualquer momento na sua área de membros:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/minha-conta/compras" style="color: #D00000; text-decoration: underline;">Acessar Minhas Compras</a>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999;">Obrigado por escolher a SubMind.</p>
      </div>
    `;

  await resend.emails.send({
    from: "SubMind Store <onboarding@resend.dev>", // Ajuste o remetente se já tiver domínio verificado
    to: [to],
    subject: "Seu pedido está aqui! 📦",
    html: emailHtml,
  });
}

// ==============================================================================
// 1. CHECKOUT PAGO (InfinitePay)
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

  // LÓGICA DE IDENTIFICAÇÃO DO USUÁRIO
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

  // LÓGICA DE AFILIADOS
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

  // Calcular Total
  const totalAmount = Math.round(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  if (totalAmount < 100) {
    throw new Error("O valor mínimo para transação é R$ 1,00");
  }

  // Criar Pedido
  const [newOrder] = await db
    .insert(order)
    .values({
      userId: userId,
      amount: totalAmount,
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

  // Calcular Comissão
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

  // Payload InfinitePay
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
  try {
    await sendProductEmail(userEmail, userName, items);
    console.log(`✅ Email de produto gratuito enviado para ${userEmail}`);
  } catch (error) {
    console.error("Erro ao enviar email de produto gratuito:", error);
  }

  // Limpa cookie de afiliado se existir
  const cookieStore = await cookies();
  if (cookieStore.get("affiliate_code")) {
    cookieStore.delete("affiliate_code");
  }

  return { success: true, orderId: newOrder.id };
}
