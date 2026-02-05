"use client";

import { Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/language-context";
import { useCartStore } from "@/store/cart-store";

// --- SUB-COMPONENTS ---

// 1. Badge do Ícone do Carrinho
function CartIconBadge({ count }: { count: number }) {
  return (
    <div className="group relative hidden cursor-pointer items-center text-neutral-700 duration-300 hover:scale-105 hover:text-black active:scale-95 md:flex">
      <div className="relative">
        <ShoppingCart className="h-5.5 w-5.5" strokeWidth={2} />
        {count > 0 && (
          <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white shadow-sm">
            {count}
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Card do Item no Carrinho
interface CartItemCardProps {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    currency?: string;
  };
  onUpdateQuantity: (id: string, type: "increase" | "decrease") => void;
  onRemove: (id: string) => void;
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const itemCurrency = item.currency || "GBP";
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: itemCurrency,
  }).format(item.price / 100);

  return (
    <div className="flex gap-4 rounded-xl border border-neutral-100 bg-white p-3 shadow-sm transition-all hover:shadow-md">
      {/* IMAGEM */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            <ShoppingCart className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* DETALHES */}
      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div>
          <h4 className="line-clamp-2 text-sm leading-tight font-semibold text-neutral-900">
            {item.name}
          </h4>
          <p className="mt-1 font-mono text-sm font-bold text-orange-600">
            {formattedPrice}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          {/* CONTROLE DE QUANTIDADE */}
          <div className="flex h-8 items-center rounded-md border border-neutral-200 bg-neutral-50">
            <button
              onClick={() => onUpdateQuantity(item.id, "decrease")}
              disabled={item.quantity <= 1}
              className="flex h-full w-8 items-center justify-center text-neutral-500 transition-colors hover:bg-white hover:text-neutral-900 disabled:opacity-40"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="flex w-8 items-center justify-center text-xs font-bold text-neutral-900">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, "increase")}
              className="flex h-full w-8 items-center justify-center text-neutral-500 transition-colors hover:bg-white hover:text-neutral-900"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* BOTÃO REMOVER */}
          <button
            onClick={() => onRemove(item.id)}
            className="group rounded-full p-2 text-neutral-400 transition-all hover:bg-red-50 hover:text-red-500"
            title="Remover item"
          >
            <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function CartSheet() {
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { t, language } = useLanguage();

  // Removemos a verificação de sessão aqui, pois o checkout lida com isso
  // const { data: session } = authClient.useSession();

  const {
    items: cartItems,
    removeItem: removeCartItem,
    updateQuantity,
    getTotalPrice,
  } = useCartStore();

  const formatTotal = (val: number) => {
    const currency =
      cartItems.length > 0
        ? cartItems[0].currency || "GBP"
        : language === "pt"
          ? "BRL"
          : "GBP";

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(val / 100);
  };

  const handleCheckout = () => {
    // Simplesmente redireciona para a página de checkout.
    // O CheckoutForm lá vai verificar se está logado e mostrar o form se necessário.
    setIsOpen(false);
    setIsCheckingOut(true);
    router.push("/checkout");
    setIsCheckingOut(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div>
          <CartIconBadge count={cartItems.length} />
        </div>
      </SheetTrigger>

      <SheetContent className="flex h-full w-full flex-col bg-white p-0 text-neutral-900 sm:max-w-[400px]">
        {/* HEADER */}
        <SheetHeader className="border-b border-neutral-100 bg-white px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <ShoppingCart className="h-5 w-5 text-orange-600" />
            {t.header.cart.title}
          </SheetTitle>
        </SheetHeader>

        {/* LISTA DE ITENS */}
        <div className="flex-1 overflow-y-auto bg-neutral-50/50 px-6 py-6">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <ShoppingCart className="h-8 w-8 opacity-40" />
              </div>
              <p className="font-medium">{t.header.cart.empty}</p>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="mt-4"
              >
                Continuar Comprando
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeCartItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {cartItems.length > 0 && (
          <div className="border-t border-neutral-100 bg-white px-6 py-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-medium text-neutral-500">
                {t.header.cart.total}
              </span>
              <span className="font-mono text-2xl font-bold text-neutral-900">
                {formatTotal(getTotalPrice())}
              </span>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="h-12 w-full bg-orange-600 text-base font-bold text-white shadow-md transition-all hover:bg-orange-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-70"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                t.header.cart.checkout
              )}
            </Button>

            <p className="mt-3 text-center text-[10px] text-neutral-400">
              Taxas de Frete calculadas no checkout.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
