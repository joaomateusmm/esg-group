import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/lib/auth";

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Inicializa o Stripe
const stripeSecret = process.env.STRIPE_SECRET_KEY;

// Valor fixo de frete (R$ 15,00)
const FIXED_SHIPPING_COST = 1500;

export async function POST(req: Request) {
  try {
    // 1. Validação da Chave do Stripe
    if (!stripeSecret) {
      console.error(
        "❌ STRIPE_SECRET_KEY não definida nas variáveis de ambiente.",
      );
      return NextResponse.json(
        { error: "Erro de configuração do servidor (Stripe Key Missing)" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecret, {
      // CORREÇÃO: Isso resolve o erro de lint "Unexpected any"
      apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
      typescript: true,
    });

    // 2. Leitura do Body
    const body = await req.json();
    const { items, currency, shippingAddress } = body;

    // Log para ver o que chegou (ajuda no debug)
    console.log(
      "📦 Payment Intent Iniciado. Endereço recebido:",
      !!shippingAddress,
    );

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    // Calcula o subtotal dos itens
    const itemsTotal = items.reduce(
      (acc: number, item: Item) => acc + item.price * item.quantity,
      0,
    );

    // Soma o frete ao total
    const totalAmount = itemsTotal + FIXED_SHIPPING_COST;

    // Minifica os itens para caber nos metadados
    const itemsMinified = items.map((i: Item) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    }));

    // 3. Sanitização Segura do Endereço
    // Se shippingAddress for undefined, usamos {} para não quebrar o código
    const rawAddress = shippingAddress || {};

    const sanitizedAddress = {
      street: rawAddress.street || "Não informado",
      number: rawAddress.number || "S/N",
      complement: rawAddress.complement || "",
      city: rawAddress.city || "",
      state: rawAddress.state || "",
      zipCode: rawAddress.zipCode || "",
      country: rawAddress.country || "BR",
    };

    // Cria a intenção de pagamento
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency || "brl",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: session.user.id,
        itemsJson: JSON.stringify(itemsMinified).substring(0, 499),
        shippingAddressJson: JSON.stringify(sanitizedAddress),
        shippingCost: FIXED_SHIPPING_COST.toString(),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    // Log detalhado do erro para o Vercel Logs
    console.error("❌ Erro CRÍTICO ao criar Payment Intent:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";

    return NextResponse.json(
      { error: `Erro ao processar pagamento: ${errorMessage}` },
      { status: 500 },
    );
  }
}
