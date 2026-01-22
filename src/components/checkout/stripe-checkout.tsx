"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useCartStore } from "@/store/cart-store";

import { CheckoutForm } from "./checkout-form-global"; // Vamos criar abaixo

// Sua chave pública do Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export function StripeCheckout() {
  const { items } = useCartStore();
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (items.length > 0) {
      // Chama sua API para criar a intenção de pagamento
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          currency: "brl", // Ou lógica para detectar moeda do usuário
        }),
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret));
    }
  }, [items]);

  if (!clientSecret) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: "stripe" } }}
    >
      <CheckoutForm />
    </Elements>
  );
}
