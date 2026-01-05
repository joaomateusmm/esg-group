"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { order, orderItem } from "@/db/schema";
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

  // 1. Calcular Total e garantir inteiro
  const totalAmount = Math.round(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  if (totalAmount < 100) {
    throw new Error("O valor mínimo para transação é R$ 1,00");
  }

  // 2. Criar Pedido no Banco
  const [newOrder] = await db
    .insert(order)
    .values({
      userId: user.id,
      amount: totalAmount,
      status: "pending",
    })
    .returning();

  // 3. Salvar Itens
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 4. Preparar Payload LIMPO para InfinitePay
  const infinitePayPayload = {
    handle: process.env.INFINITEPAY_HANDLE,
    order_nsu: newOrder.id,
    amount: totalAmount,
    redirect_url: `${baseUrl}/minha-conta/compras`,

    webhook_url: `${baseUrl}/api/webhooks/infinitepay`,

    items: items.map((item) => ({
      quantity: item.quantity,
      price: Math.round(item.price),
      description: item.name.substring(0, 250), // Segurança para nomes longos
    })),

    // CORREÇÃO: Enviando APENAS dados essenciais para produtos digitais
    customer: {
      name: user.name,
      email: user.email,
      // Telefone e Endereço REMOVIDOS para evitar erro 422
    },

    address: {
      line1: "Produto Digital - Entrega via Email", // Rua
      line2: "Loja SubMind", // Complemento
      zip: "60000000", // CEP Genérico (Fortaleza) ou o seu
      city: "Fortaleza",
      state: "CE",
      country: "BR",
    },

    metadata: {
      source: "submind_site",
      user_id: user.id,
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

    // 5. Atualizar o pedido com o link
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
