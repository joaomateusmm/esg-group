"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react"; // 1. Adicionei useRef

import { useCartStore } from "@/store/cart-store";

import { CheckoutForm } from "./checkout-form-global";

// Sua chave pública do Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export function StripeCheckout() {
  const { items } = useCartStore();
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 2. REF PARA EVITAR DUPLICIDADE
  // Isso garante que a requisição só seja feita uma vez, mesmo se o componente renderizar 2x
  const hasCreatedIntent = useRef(false);

  useEffect(() => {
    // Se não tem itens ou JÁ criou a intenção, para por aqui.
    if (items.length === 0 || hasCreatedIntent.current) return;

    // Marca como criado IMEDIATAMENTE para bloquear a segunda chamada
    hasCreatedIntent.current = true;

    const cartCurrency = items[0].currency || "GBP";

    // Chama sua API para criar a intenção de pagamento
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
          // Se deu erro de lógica (ex: estoque), talvez queiramos deixar tentar de novo?
          // Por segurança, mantemos travado ou destravamos dependendo da sua regra.
          // hasCreatedIntent.current = false;
        } else {
          setClientSecret(data.clientSecret);
          // Opcional: Salvar o orderId num estado se precisar usar depois
        }
      })
      .catch((err) => {
        console.error("Erro ao criar Intent:", err);
        setError("Não foi possível carregar o sistema de pagamento.");
        // Se deu erro de rede, liberamos para tentar de novo
        hasCreatedIntent.current = false;
      });
  }, [items]);

  // Se houver erro no carregamento inicial
  if (error) {
    return (
      <div className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 p-6 text-red-600">
        <p className="font-medium">Erro ao carregar checkout</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Loading enquanto busca o clientSecret
  if (!clientSecret || items.length === 0) {
    return (
      <div className="flex h-60 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // Configuração visual do Stripe
  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#ea580c", // orange-600
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
      <CheckoutForm />
    </Elements>
  );
}
