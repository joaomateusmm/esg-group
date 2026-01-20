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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover" as unknown as Stripe.LatestApiVersion,
  typescript: true,
});

// Valor fixo de frete para teste (R$ 15,00)
const FIXED_SHIPPING_COST = 1500;

export async function POST(req: Request) {
  try {
    const { items, currency, shippingAddress } = await req.json();

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

    // Minifica os itens para caber nos metadados (limite 500 chars)
    const itemsMinified = items.map((i: Item) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    }));

    // Sanitiza o endereço para garantir que não quebre o JSON
    const sanitizedAddress = {
      street: shippingAddress.street || "",
      number: shippingAddress.number || "",
      complement: shippingAddress.complement || "",
      city: shippingAddress.city || "",
      state: shippingAddress.state || "",
      zipCode: shippingAddress.zipCode || "",
      country: shippingAddress.country || "BR",
    };

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, // Valor TOTAL (Produtos + Frete)
      currency: currency || "brl",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: session.user.id,
        itemsJson: JSON.stringify(itemsMinified).substring(0, 499),
        // Enviamos o endereço e o custo do frete nos metadados
        shippingAddressJson: JSON.stringify(sanitizedAddress),
        shippingCost: FIXED_SHIPPING_COST.toString(),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Erro ao processar pagamento no Stripe:", error);
    return NextResponse.json(
      { error: "Erro ao criar pagamento" },
      { status: 500 },
    );
  }
}
