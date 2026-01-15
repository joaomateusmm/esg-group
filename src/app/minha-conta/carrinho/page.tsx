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
import { useEffect, useState } from "react";
import { toast } from "sonner";

// IMPORTANTE: Importe a nova action
import { checkStockAvailability } from "@/actions/check-stock";
import { createCheckoutSession } from "@/actions/checkout";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  useEffect(() => {
    setMounted(true);

    // --- LÓGICA DE VERIFICAÇÃO DE ESTOQUE ---
    const verifyStock = async () => {
      if (items.length === 0) return;

      try {
        const { outOfStockItems } = await checkStockAvailability(
          items.map((i) => ({ id: i.id, quantity: i.quantity })),
        );

        if (outOfStockItems.length > 0) {
          // Remove os itens esgotados da store
          outOfStockItems.forEach((item) => {
            removeItem(item.id);
          });

          // Avisa o usuário
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
  }, []); // Executa apenas na montagem

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

      // --- VERIFICAÇÃO FINAL ANTES DO CHECKOUT ---
      // Garante que nada esgotou enquanto o user estava na página
      const { outOfStockItems } = await checkStockAvailability(
        items.map((i) => ({ id: i.id, quantity: i.quantity })),
      );

      if (outOfStockItems.length > 0) {
        outOfStockItems.forEach((item) => removeItem(item.id));
        toast.error(
          `Ops! O item "${outOfStockItems[0].name}" acabou de esgotar.`,
        );
        setIsCheckingOut(false);
        return; // Interrompe o checkout
      }
      // ------------------------------------------

      const checkoutItems = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      const result = await createCheckoutSession(checkoutItems);

      if ("url" in result && result.url) {
        window.location.href = result.url;
      } else if ("success" in result && result.success) {
        toast.success("Pedido realizado com sucesso!");
        router.push("/checkout/success");
      } else {
        throw new Error("Erro desconhecido ao processar pedido.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#010000]">
      <Header />

      <div className="mx-auto max-w-6xl px-4 pt-40 pb-20 md:px-8">
        <h1 className="font-clash-display mb-8 text-4xl font-medium text-white">
          Seu Carrinho
        </h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl py-20 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
              <ShoppingCart className="h-10 w-10 text-neutral-500" />
            </div>
            <h2 className="text-xl font-medium text-white">
              Seu carrinho está vazio
            </h2>
            <p className="mt-2 mb-8 text-neutral-400">
              Parece que você ainda não adicionou nenhum item.
            </p>
            <Link href="/">
              <Button
                size="lg"
                className="bg-[#D00000] text-white hover:bg-[#a00000]"
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
                  className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#0A0A0A] p-4 sm:flex-row sm:items-center"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-neutral-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <h3 className="font-medium text-white md:text-lg">
                        {item.name}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        Produto Digital
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                      <div className="flex items-center rounded-md border border-white/10 bg-white/5">
                        <button
                          onClick={() => updateQuantity(item.id, "decrease")}
                          className="flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, "increase")}
                          className="flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-lg font-bold text-white">
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
                        className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-fit lg:sticky lg:top-32">
              <Card className="border-white/10 bg-[#0A0A0A]">
                <CardContent className="p-6">
                  <h3 className="font-clash-display mb-4 text-xl font-medium text-white">
                    Resumo do Pedido
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-neutral-400">
                      <span>Subtotal</span>
                      <span className="text-white">
                        {formatPrice(getTotalPrice())}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Descontos</span>
                      <span className="text-green-500">- R$ 0,00</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between text-base font-medium text-white">
                      <span>Total</span>
                      <span className="font-mono text-xl text-[#D00000]">
                        {formatPrice(getTotalPrice())}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    size="lg"
                    className="mt-6 w-full cursor-pointer bg-[#D00000] py-6 text-base font-bold text-white hover:bg-[#a00000] disabled:opacity-70"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>Finalizar Compra</>
                    )}
                  </Button>

                  <p className="mt-4 text-center text-xs text-neutral-500">
                    Ambiente 100% seguro. Seus dados estão protegidos.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      <div className="mt-25">
        <Footer />
      </div>
    </div>
  );
}
