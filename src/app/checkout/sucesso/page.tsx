"use client";

import { CheckCircle2, Home, Loader2, Package, Truck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

function SuccessContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  // Parâmetros vindos da URL
  const paymentIntent = searchParams.get("payment_intent"); // Do Stripe
  const redirectStatus = searchParams.get("redirect_status"); // Do Stripe
  const orderId = searchParams.get("orderId"); // Do nosso sistema (Stripe ou Entrega)

  useEffect(() => {
    // Limpa o carrinho se houver um ID de pedido ou sucesso no Stripe
    if (orderId || redirectStatus === "succeeded") {
      clearCart();
    }
  }, [orderId, redirectStatus, clearCart]);

  // Determina o tipo de mensagem baseada nos parâmetros
  const isDelivery = !paymentIntent && orderId;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pt-22 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 className="h-12 w-12" />
      </div>

      <h1 className="mb-2 text-3xl font-bold md:text-4xl">
        Pedido Confirmado!
      </h1>

      <p className="mb-8 max-w-md text-neutral-500">
        {isDelivery
          ? "Recebemos seu pedido. O pagamento será realizado no momento da entrega."
          : "Obrigado pela sua compra. O pagamento foi processado com sucesso."}
      </p>

      <div className="mb-8 w-full max-w-sm space-y-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm shadow-sm">
        {orderId && (
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="text-neutral-500">Número do Pedido:</span>
            <span className="font-mono font-bold text-neutral-900">
              #{orderId.slice(0, 8).toUpperCase()}
            </span>
          </div>
        )}

        {paymentIntent && (
          <div className="flex justify-between">
            <span className="text-neutral-500">Transação:</span>
            <span
              className="max-w-[150px] truncate font-mono text-xs text-neutral-900"
              title={paymentIntent}
            >
              {paymentIntent}
            </span>
          </div>
        )}

        {isDelivery && (
          <div className="flex items-center justify-center gap-2 pt-2 font-medium text-orange-600">
            <Truck className="h-4 w-4" /> Pagamento na Entrega
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/minha-conta/compras">
          <Button
            variant="outline"
            className="h-12 w-full gap-2 border-neutral-300 sm:w-auto"
          >
            <Package className="h-4 w-4" /> Meus Pedidos
          </Button>
        </Link>
        <Link href="/">
          <Button className="h-12 w-full gap-2 bg-orange-600 text-white hover:bg-orange-700 sm:w-auto">
            <Home className="h-4 w-4" /> Voltar para a Loja
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Suspense fallback={<div className="h-20 w-full bg-neutral-50" />}>
        <Header />
      </Suspense>

      <main className="flex flex-1 flex-col items-center justify-center py-20">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
              <p className="text-neutral-500">Processando informações...</p>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </main>

      <Suspense fallback={<div className="h-20 w-full bg-neutral-50" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
