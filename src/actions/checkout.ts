"use server";

import { eq, inArray } from "drizzle-orm";
import { cookies, headers } from "next/headers";

import { db } from "@/db";
import { affiliate, commission, order, orderItem, product } from "@/db/schema";
import { auth } from "@/lib/auth";

// Tipo esperado dos itens do carrinho
type CartItemInput = {
  id: string;
  name: string;
  price: number; // em centavos
  quantity: number;
  image?: string;
};

export async function createCheckoutSession(items: CartItemInput[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Usuário não autenticado");
  }

  const user = session.user;

  // --- 1. LÓGICA DE AFILIADOS (INÍCIO) ---
  const cookieStore = await cookies();
  const affiliateCode = cookieStore.get("affiliate_code")?.value;

  let activeAffiliate = null;

  if (affiliateCode) {
    // Busca o afiliado pelo código do cookie
    activeAffiliate = await db.query.affiliate.findFirst({
      where: eq(affiliate.code, affiliateCode),
    });

    // Opcional: Impedir que o afiliado ganhe comissão da própria compra
    if (activeAffiliate && activeAffiliate.userId === user.id) {
      activeAffiliate = null;
    }
  }
  // --- FIM LÓGICA DE AFILIADOS (PARTE 1) ---

  // 2. Calcular Total e garantir inteiro
  const totalAmount = Math.round(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  if (totalAmount < 100) {
    throw new Error("O valor mínimo para transação é R$ 1,00");
  }

  // 3. Criar Pedido no Banco
  const [newOrder] = await db
    .insert(order)
    .values({
      userId: user.id,
      amount: totalAmount,
      status: "pending",
    })
    .returning();

  // 4. Salvar Itens do Pedido
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

  // --- 5. CALCULAR E SALVAR COMISSÃO (IMPORTANTE) ---
  if (activeAffiliate) {
    try {
      // Precisamos buscar os produtos reais no DB para pegar a % de comissão (affiliateRate)
      const productIds = items.map((i) => i.id);

      const dbProducts = await db
        .select()
        .from(product)
        .where(inArray(product.id, productIds));

      let totalCommission = 0;

      // Calcula comissão item por item
      for (const item of items) {
        const dbProd = dbProducts.find((p) => p.id === item.id);

        // --- MUDANÇA AQUI: Alterado de 10 para 20 ---
        // Se o produto não tiver taxa definida no banco, usa 20% como padrão
        const rate = dbProd?.affiliateRate ?? 20;

        const itemTotal = item.price * item.quantity;
        const commissionValue = Math.round(itemTotal * (rate / 100));

        totalCommission += commissionValue;
      }

      // Se gerou comissão maior que 0, salva no banco
      if (totalCommission > 0) {
        await db.insert(commission).values({
          affiliateId: activeAffiliate.id,
          orderId: newOrder.id,
          amount: totalCommission,
          status: "pending",
          description: `Venda via link de afiliado: ${affiliateCode}`,
        });

        console.log(
          `✅ Comissão de ${(totalCommission / 100).toFixed(2)} registrada para ${affiliateCode}`,
        );
      }
    } catch (error) {
      console.error("Erro ao gerar comissão:", error);
    }
  }
  // --- FIM LÓGICA DE AFILIADOS ---

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 6. Preparar Payload LIMPO para InfinitePay
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
      name: user.name,
      email: user.email,
    },
    address: {
      line1: "Produto Digital - Entrega via Email",
      line2: "Loja SubMind",
      zip: "60000000",
      city: "Fortaleza",
      state: "CE",
      country: "BR",
    },
    metadata: {
      source: "submind_site",
      user_id: user.id,
      affiliate_id: activeAffiliate?.id || "",
    },
  };

  try {
    const response = await fetch(
      "https://api.infinitepay.io/invoices/public/checkout/links",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
