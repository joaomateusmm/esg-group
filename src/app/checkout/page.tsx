"use client";

import { ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StripeCheckout } from "@/components/checkout/stripe-checkout";
import { Footer } from "@/components/Footer"; // Verifique se o caminho do seu Footer está correto
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

export default function CheckoutPage() {
  const { items } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Header />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-32 md:px-8">
        {/* Cabeçalho da Página */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 flex w-fit items-center gap-2 text-sm font-medium text-neutral-500 hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Continuar comprando
          </Link>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Finalizar Compra
          </h1>
        </div>

        {/* Verifica se o carrinho está vazio */}
        {items.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
              <ShoppingBag className="h-10 w-10 text-neutral-400" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">
              Seu carrinho está vazio
            </h2>
            <p className="max-w-md text-neutral-500">
              Parece que você ainda não adicionou nenhum item. Explore nossa
              loja para encontrar o que procura.
            </p>
            <Link href="/">
              <Button className="mt-4 bg-orange-600 px-8 py-6 text-lg hover:bg-orange-700">
                Ver Produtos
              </Button>
            </Link>
          </div>
        ) : (
          /* Se tiver itens, carrega o Wrapper do Stripe */
          <div className="mx-auto max-w-5xl">
            <StripeCheckout />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
