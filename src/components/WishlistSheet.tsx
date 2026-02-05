"use client";

import { Heart, HeartMinus, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
import { useWishlistStore } from "@/store/wishlist-store";

// --- INTERFACES PARA TIPAGEM ---
interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  images?: string[];
}

// --- SUB-COMPONENTS (Para manter organizado igual ao Cart) ---

// 1. Badge do Ícone
function WishlistIconBadge({ count }: { count: number }) {
  return (
    <button className="group relative flex cursor-pointer items-center text-neutral-700 duration-300 outline-none hover:scale-105 hover:text-black active:scale-95">
      <div className="relative">
        <Heart className="h-5.5 w-5.5" strokeWidth={2} />
        {count > 0 && (
          <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white shadow-sm">
            {count}
          </div>
        )}
      </div>
    </button>
  );
}

// 2. Card do Item de Desejo (Design idêntico ao CartItemCard)
interface WishlistItemCardProps {
  item: WishlistItem;
  onRemove: (id: string) => void;
  onAddToCart: (item: WishlistItem) => void;
  formatPrice: (val: number) => string;
}

function WishlistItemCard({
  item,
  onRemove,
  onAddToCart,
  formatPrice,
}: WishlistItemCardProps) {
  // Garante que temos uma imagem válida para exibir
  const displayImage = item.image || (item.images && item.images[0]);

  return (
    <div className="flex gap-4 rounded-xl border border-neutral-100 bg-white p-3 shadow-sm transition-all hover:shadow-md">
      {/* IMAGEM */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            <Heart className="h-8 w-8 opacity-50" />
          </div>
        )}
      </div>

      {/* DETALHES */}
      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div>
          <Link href={`/produto/${item.id}`} className="hover:underline">
            <h4 className="line-clamp-2 text-sm leading-tight font-semibold text-neutral-900">
              {item.name}
            </h4>
          </Link>
          <p className="mt-1 font-mono text-sm font-bold text-orange-600">
            {formatPrice(item.price)}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {/* BOTÃO ADICIONAR AO CARRINHO */}
          <Button
            size="sm"
            className="group h-8 flex-1 cursor-pointer rounded-sm border border-orange-400 bg-orange-600 px-2 py-1 text-sm font-medium text-white duration-300 hover:border-emerald-300 hover:bg-emerald-600"
            onClick={() => onAddToCart(item)}
          >
            <ShoppingCart className="mr-1 h-4 w-4 duration-300 group-hover:scale-110" />
            Adicionar
          </Button>

          {/* BOTÃO REMOVER */}
          <button
            onClick={() => onRemove(item.id)}
            className="group flex cursor-pointer items-center justify-center rounded-sm border bg-neutral-100 px-2 py-1 text-neutral-500 duration-300 hover:bg-red-50 hover:text-red-500"
            title="Remover dos favoritos"
          >
            <HeartMinus className="mr-1 h-4 w-4 duration-300 group-hover:scale-110" />
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function WishlistSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language } = useLanguage();

  // Stores
  const { items, removeItem } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();

  const formatPrice = (val: number) => {
    const lang = language as string;
    let currency = "BRL";
    let locale = "pt-BR";

    if (lang === "en") {
      currency = "USD";
      locale = "en-US";
    } else if (lang === "es") {
      currency = "EUR";
      locale = "es-ES";
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(val / 100);
  };

  const handleAddToCart = (item: WishlistItem) => {
    // Correção do erro de tipagem: verifica qual campo de imagem usar
    const imageToUse =
      item.image ||
      (item.images && item.images.length > 0 ? item.images[0] : undefined);

    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: imageToUse, // Passa a string da imagem correta
    });
    setIsOpen(false); // Opcional: fechar ao adicionar
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div>
          <WishlistIconBadge count={items.length} />
        </div>
      </SheetTrigger>

      <SheetContent className="flex h-full w-full flex-col bg-white p-0 text-neutral-900 sm:max-w-[400px]">
        {/* HEADER */}
        <SheetHeader className="border-b border-neutral-100 bg-white px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <Heart className="h-5 w-5 text-orange-600" />
            {t.header.wishlist.title || "Meus Favoritos"}
          </SheetTitle>
        </SheetHeader>

        {/* LISTA DE ITENS */}
        <div className="flex-1 overflow-y-auto bg-neutral-50/50 px-6 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <Heart className="h-8 w-8 opacity-40" />
              </div>
              <div className="space-y-1 text-center">
                <h3 className="font-medium text-neutral-900">
                  Lista de Desejos vazia
                </h3>
                <p className="w-[250px] text-sm text-neutral-500">
                  Explore nosso catalogo e salve algum produto nosso.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="mt-4 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
              >
                Voltar para a loja
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  item={item as any}
                  onRemove={removeItem}
                  onAddToCart={handleAddToCart}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
