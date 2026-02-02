"use client";

import {
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { checkStockAvailability } from "@/actions/check-stock";
import { createCheckoutSession } from "@/actions/checkout";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { useCartStore } from "@/store/cart-store";

// 2. COMPONENTE INTERNO COM A LÓGICA
function CartContent() {
  const [mounted, setMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  useEffect(() => {
    setMounted(true);

    const verifyStock = async () => {
      if (items.length === 0) return;

      try {
        const { outOfStockItems } = await checkStockAvailability(
          items.map((i) => ({ id: i.id, quantity: i.quantity })),
        );

        if (outOfStockItems.length > 0) {
          outOfStockItems.forEach((item) => {
            removeItem(item.id);
          });

          toast.error(
            `Alguns itens foram removidos do seu carrinho pois esgotaram: ${outOfStockItems
              .map((i) => i.name)
              .join(", ")}`,
          );
        }
      } catch (error) {
        console.error("Erro ao verificar estoque:", error);
      }
    };

    verifyStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  async function handleCheckout() {
    if (!session) {
      toast.error("Você precisa estar logado para finalizar a compra.");
      router.push("/authentication");
      return;
    }

    try {
      setIsCheckingOut(true);

      const { outOfStockItems } = await checkStockAvailability(
        items.map((i) => ({ id: i.id, quantity: i.quantity })),
      );

      if (outOfStockItems.length > 0) {
        outOfStockItems.forEach((item) => removeItem(item.id));
        toast.error(
          `Ops! O item "${outOfStockItems[0].name}" acabou de esgotar.`,
        );
        setIsCheckingOut(false);
        return;
      }

      const checkoutItems = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      const result = await createCheckoutSession(checkoutItems);

      if (result && result.success) {
        router.push("/checkout");
      } else {
        throw new Error("Erro desconhecido ao processar pedido.");
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao processar pagamento. Tente novamente.");
      }
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 pb-20 md:px-8 lg:pt-16">
      <h1 className="font-clash-display mb-8 text-4xl font-bold text-neutral-900">
        Seu Carrinho
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center shadow-sm">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
            <ShoppingCart className="h-10 w-10 text-neutral-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900">
            Seu carrinho está vazio
          </h2>
          <p className="mt-2 mb-8 text-neutral-500">
            Parece que você ainda não adicionou nenhum item.
          </p>
          <Link href="/">
            <Button
              size="lg"
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Explorar Catálogo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-neutral-300" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <h3 className="line-clamp-2 font-bold text-neutral-900 md:text-lg">
                      {item.name}
                    </h3>
                    <p className="text-sm text-neutral-500">Produto Físico</p>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50">
                      <button
                        onClick={() => updateQuantity(item.id, "decrease")}
                        className="flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, "increase")}
                        className="flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-neutral-900"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="min-w-[80px] text-right">
                      <p className="font-mono text-lg font-bold text-neutral-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-neutral-500">
                          {formatPrice(item.price)} cada
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit lg:sticky lg:top-36">
            <Card className="border border-neutral-200 bg-white shadow-lg">
              <CardContent className="p-6">
                <h3 className="mb-4 text-xl font-bold text-neutral-900">
                  Resumo do Pedido
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="text-neutral-900">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Frete</span>
                    <span className="text-xs text-neutral-400">
                      Calculado no checkout
                    </span>
                  </div>
                  <Separator className="bg-neutral-100" />
                  <div className="flex justify-between text-base font-bold text-neutral-900">
                    <span>Total Estimado</span>
                    <span className="font-mono text-xl text-orange-600">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  size="lg"
                  className="mt-6 w-full cursor-pointer bg-orange-600 py-6 text-base font-bold text-white hover:bg-orange-700 disabled:bg-neutral-300"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>Ir para Pagamento</>
                  )}
                </Button>

                <p className="mt-4 text-center text-xs text-neutral-400">
                  Ambiente 100% seguro via Stripe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. COMPONENTE PRINCIPAL (CONTAINER)
export default function CartPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header em Suspense */}
      <Suspense fallback={<div className="h-20 w-full bg-neutral-50" />}>
        <Header />
      </Suspense>

      {/* Conteúdo do Carrinho em Suspense */}
      <Suspense
        fallback={
          <div className="flex h-96 w-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
          </div>
        }
      >
        <CartContent />
      </Suspense>

      {/* Footer em Suspense */}
      <Suspense fallback={<div className="h-20 w-full bg-neutral-50" />}>
        <div className="mt-20">
          <Footer />
        </div>
      </Suspense>
    </div>
  );
}
