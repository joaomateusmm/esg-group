"use client";

import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore, WishlistItem } from "@/store/wishlist-store";

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);

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
    // MUDANÇA: Fundo claro
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={<div className="h-20 w-full bg-white" />}>
        <Header />
      </Suspense>

      <div className="mx-auto max-w-6xl px-4 pt-42 pb-20 md:px-8">
        <div className="mb-8 flex items-center justify-between">
          {/* MUDANÇA: Texto escuro */}
          <h1 className="font-montserrat text-4xl font-bold text-neutral-800">
            Meus Favoritos
          </h1>
          <span className="text-sm text-neutral-500">
            {wishlistItems.length} item(s) salvo(s)
          </span>
        </div>

        {wishlistItems.length === 0 ? (
          // MUDANÇA: Card vazio claro
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center shadow-sm">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
              <Heart className="h-10 w-10 text-neutral-400" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">
              Sua lista de desejos está vazia
            </h2>
            <p className="mt-2 mb-8 text-neutral-500">
              Você ainda não salvou nenhum produto para ver depois.
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Lista de Favoritos em Grid */}
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                // MUDANÇA: Card branco com hover e sombra
                className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
              >
                {/* Imagem */}
                <Link
                  href={`/p/${item.id}`}
                  className="relative aspect-video w-full overflow-hidden bg-neutral-100"
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
                      <ShoppingCart className="h-10 w-10 text-neutral-400" />
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
                    // MUDANÇA: Botão de remover mais visível no hover
                    className="absolute top-2 right-2 rounded-full bg-white/90 p-2 text-neutral-500 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Link>

                {/* Informações */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-4 space-y-1">
                    <span className="text-xs font-bold tracking-wide text-neutral-400 uppercase">
                      {item.category || "Produto"}
                    </span>
                    <Link href={`/p/${item.id}`}>
                      {/* MUDANÇA: Título escuro */}
                      <h3 className="line-clamp-1 text-lg font-bold text-neutral-900 decoration-neutral-300 underline-offset-4 hover:underline">
                        {item.name}
                      </h3>
                    </Link>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
                    {/* MUDANÇA: Preço Laranja */}
                    <p className="font-mono text-lg font-bold text-orange-600">
                      {formatPrice(item.price)}
                    </p>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddToCart(item)}
                      // MUDANÇA: Botão secundário claro
                      className="border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:text-orange-600"
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

      <Suspense fallback={<div className="h-20 w-full bg-white" />}>
        <div className="mt-25">
          <Footer />
        </div>
      </Suspense>
    </div>
  );
}
