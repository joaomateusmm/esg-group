"use client";

import { CheckCircle2, Home, Package } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  // O Stripe envia o ID da intenção de pagamento na URL
  const paymentIntent = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");

  useEffect(() => {
    // Se o pagamento foi bem-sucedido, limpamos o carrinho
    if (redirectStatus === "succeeded") {
      clearCart();
    }
  }, [redirectStatus, clearCart]);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-38 pb-18 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>

        <h1 className="mb-2 text-3xl font-bold md:text-4xl">
          Pagamento Confirmado!
        </h1>

        <p className="mb-8 max-w-md text-neutral-500">
          Obrigado pela sua compra. Enviamos um e-mail com os detalhes do seu
          pedido e o código de rastreio será enviado em breve.
        </p>

        {paymentIntent && (
          <div className="mb-8 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-500">
            ID da Transação:{" "}
            <span className="font-mono text-neutral-900">{paymentIntent}</span>
          </div>
        )}

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
            <Button className="h-12 w-full gap-2 bg-orange-600 hover:bg-orange-700 sm:w-auto">
              <Home className="h-4 w-4" /> Voltar para a Loja
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
