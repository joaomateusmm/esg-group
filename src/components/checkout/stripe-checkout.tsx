"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCartStore } from "@/store/cart-store";

import { CheckoutForm } from "./checkout-form-global";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export function StripeCheckout() {
  const { items } = useCartStore();
  const [clientSecret, setClientSecret] = useState("");
  // ESTADO PARA GUARDAR O ID DO PEDIDO CRIADO PELO STRIPE
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasCreatedIntent = useRef(false);

  useEffect(() => {
    if (items.length === 0 || hasCreatedIntent.current) return;

    hasCreatedIntent.current = true;

    const cartCurrency = items[0].currency || "GBP";

    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        currency: cartCurrency,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Falha na comunicação com o servidor de pagamento.");
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
          // IMPORTANTE: SALVANDO O ORDER ID QUE VEIO DA API
          if (data.orderId) {
            setOrderId(data.orderId);
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao criar Intent:", err);
        setError("Não foi possível carregar o sistema de pagamento.");
        hasCreatedIntent.current = false;
      });
  }, [items]);

  if (error) {
    return (
      <div className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 p-6 text-red-600">
        <p className="font-medium">Erro ao carregar checkout</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!clientSecret || items.length === 0) {
    return (
      <div className="flex h-60 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#ea580c",
      colorText: "#171717",
      colorBackground: "#ffffff",
      fontFamily: '"Montserrat", sans-serif',
      borderRadius: "8px",
    },
  };

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
      }}
    >
      {/* PASSANDO O ORDER ID PARA O FORMULÁRIO */}
      <CheckoutForm existingOrderId={orderId} />
    </Elements>
  );
}
