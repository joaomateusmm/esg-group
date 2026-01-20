import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/lib/auth"; // Importe seu auth

interface Item {
  id: string; // Adicionado ID
  name: string; // Adicionado Nome
  price: number;
  quantity: number;
  image?: string; // Adicionado Imagem
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover", // Ou a versão que estiver usando
  typescript: true,
});

export async function POST(req: Request) {
  try {
    const { items, currency, shippingAddress } = await req.json();

    // Pegar o usuário logado para vincular o pedido
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 },
      );
    }

    const amount = items.reduce(
      (acc: number, item: Item) => acc + item.price * item.quantity,
      0,
    );

    const itemsMinified = items.map((i: Item) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    }));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency || "brl",
      automatic_payment_methods: { enabled: true },
      // AQUI ESTÁ O SEGREDO: Enviamos dados para recuperar no Webhook
      metadata: {
        userId: session.user.id,
        itemsJson: JSON.stringify(itemsMinified).substring(0, 499), // Cuidado com limite
        shippingAddressJson: JSON.stringify(shippingAddress || {}),
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
