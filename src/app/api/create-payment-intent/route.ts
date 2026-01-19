import { NextResponse } from "next/server";
import Stripe from "stripe";

// Interface para definir o formato do item e garantir tipagem
interface Item {
  price: number;
  quantity: number;
}

// Inicialize o Stripe com sua chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Correção: Removemos o 'as any'.
  // Se aparecer um sublinhado vermelho aqui, execute: npm install stripe@latest
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export async function POST(req: Request) {
  try {
    const { items, currency } = await req.json();

    // Cálculo do total no servidor (Segurança)
    const amount = items.reduce(
      (acc: number, item: Item) => acc + item.price * item.quantity,
      0,
    );

    // Criar o PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency || "brl",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    // Log do erro para depuração
    console.error("Erro ao processar pagamento no Stripe:", error);

    return NextResponse.json(
      { error: "Erro ao criar pagamento" },
      { status: 500 },
    );
  }
}
