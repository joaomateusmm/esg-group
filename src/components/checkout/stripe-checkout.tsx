"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { AlertCircle, Loader2, Ticket } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useCartStore } from "@/store/cart-store";

import { CheckoutForm } from "./checkout-form-global";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export function StripeCheckout() {
  const { items, coupon } = useCartStore();
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Ref para evitar loops e chamadas simultâneas
  const lastCallSignature = useRef("");
  const isFetchingRef = useRef(false);

  // 1. Aguarda hidratação do Zustand
  useEffect(() => {
    const timeout = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  // 2. Busca ou Atualiza o PaymentIntent
  useEffect(() => {
    if (!isReady || items.length === 0) return;

    // Assinatura única do estado atual
    const currentSignature = JSON.stringify({
      itemCount: items.length,
      couponCode: coupon?.code || "none",
      totalPrice: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      currentOrderId: orderId, // Adiciona o ID atual na assinatura
    });

    if (lastCallSignature.current === currentSignature) return;

    // Se já está buscando, não atropela
    if (isFetchingRef.current) return;

    let ignore = false;

    async function fetchPaymentIntent() {
      isFetchingRef.current = true;
      try {
        setError(null);

        const cartCurrency = items[0]?.currency || "GBP";

        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            items,
            currency: cartCurrency,
            couponCode: coupon?.code,
            existingOrderId: orderId, // <--- O PULO DO GATO: Envia o ID se já existir
          }),
        });

        if (ignore) return;

        if (res.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erro ao conectar com o pagamento.");
        }

        // Se for sucesso, atualiza os dados
        if (data.clientSecret) setClientSecret(data.clientSecret);
        if (data.orderId) setOrderId(data.orderId);

        lastCallSignature.current = currentSignature;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (!ignore) {
          console.error("❌ Erro StripeCheckout:", err);
          setError(err.message);
          // Limpa assinatura para permitir tentar de novo se o usuário clicar no botão
          lastCallSignature.current = "";
        }
      } finally {
        isFetchingRef.current = false;
      }
    }

    fetchPaymentIntent();

    return () => {
      ignore = true;
      isFetchingRef.current = false;
    };
  }, [items, coupon, isReady, orderId]); // Adicionado orderId nas dependências

  if (error) {
    return (
      <div className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-lg border border-red-100 bg-red-50 p-6 text-red-600">
        <AlertCircle className="h-8 w-8" />
        <p className="font-medium">Erro ao iniciar pagamento</p>
        <p className="text-center text-sm">{error}</p>
        <button
          onClick={() => {
            lastCallSignature.current = "";
            window.location.reload();
          }}
          className="mt-2 text-xs underline hover:text-red-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex h-60 w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <div className="flex flex-col items-center gap-1">
          <p className="font-medium text-neutral-900">Preparando Checkout</p>
          {coupon && (
            <span className="flex animate-pulse items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600">
              <Ticket className="h-3 w-3" /> Cupom {coupon.code}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe", variables: { colorPrimary: "#ea580c" } },
      }}
    >
      <CheckoutForm existingOrderId={orderId} />
    </Elements>
  );
}
