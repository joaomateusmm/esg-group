"use client";

import { Heart, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore, WishlistItem } from "@/store/wishlist-store";

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);

  // Stores
  const { items: wishlistItems, removeItem: removeWishlistItem } =
    useWishlistStore();
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  // CORREÇÃO: Substituído 'any' pelo tipo correto 'WishlistItem'
  const handleAddToCart = (item: WishlistItem) => {
    addItemToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    });
    toast.success("Adicionado ao carrinho!");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#010000]">
      {/* --- HEADER --- */}
      <Header />

      <div className="mx-auto max-w-6xl px-4 pt-41 pb-20 md:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-clash-display text-4xl font-medium text-white">
            Meus Favoritos
          </h1>
          <span className="text-sm text-neutral-400">
            {wishlistItems.length} item(s) salvo(s)
          </span>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0A0A0A] py-20 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
              <Heart className="h-10 w-10 text-neutral-500" />
            </div>
            <h2 className="text-xl font-medium text-white">
              Sua lista de desejos está vazia
            </h2>
            <p className="mt-2 mb-8 text-neutral-400">
              Você ainda não salvou nenhum produto para ver depois.
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Lista de Favoritos em Grid */}
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] transition-all hover:border-white/20 hover:bg-white/5"
              >
                {/* Imagem */}
                <Link
                  href={`/p/${item.id}`}
                  className="relative aspect-video w-full overflow-hidden bg-white/5"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-neutral-600" />
                    </div>
                  )}

                  {/* Botão Remover (Absoluto no topo) */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeWishlistItem(item.id);
                      toast.info("Removido dos favoritos");
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-500 hover:text-white"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Link>

                {/* Informações */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-4 space-y-1">
                    <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                      {item.category || "Produto"}
                    </span>
                    <Link href={`/p/${item.id}`}>
                      <h3 className="line-clamp-1 text-lg font-medium text-white decoration-white/30 underline-offset-4 hover:underline">
                        {item.name}
                      </h3>
                    </Link>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                    <p className="font-mono text-lg font-bold text-[#D00000]">
                      {formatPrice(item.price)}
                    </p>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddToCart(item)}
                      className="border border-white/10 bg-white/10 text-white hover:bg-white/20"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-25">
        <Footer />
      </div>
    </div>
  );
}
