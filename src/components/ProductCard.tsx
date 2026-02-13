"use client";

import {
  Hammer,
  Heart,
  Loader2,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

interface ProductCardProps {
  data: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    discountPrice?: number | null;
    images: string[] | null;
    stock: number | null;
    isStockUnlimited: boolean;
    currency?: string;
    sku?: string | null; // Adicionei SKU se quiser usar no futuro
  };
  categoryName: string;
}

export function ProductCard({ data, categoryName }: ProductCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const addItemToCart = useCartStore((state) => state.addItem);
  const {
    addItem: addItemToWishlist,
    removeItem: removeItemFromWishlist,
    isInWishlist,
  } = useWishlistStore();

  const isFavorite = isInWishlist(data.id);

  // Define a moeda (Padrão GBP se não existir)
  const productCurrency = data.currency || "GBP";

  // 2. Formatação dinâmica baseada na moeda do produto
  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: productCurrency,
    }).format(priceInCents / 100);
  };

  const discountPercentage =
    data.discountPrice && data.price
      ? Math.round(((data.price - data.discountPrice) / data.price) * 100)
      : 0;

  const finalPrice = data.discountPrice || data.price;

  const isFree = finalPrice === 0;

  // Lógica de Estoque
  const stockCount = data.stock ?? 0;
  const isOutOfStock = !data.isStockUnlimited && stockCount <= 0;

  // Lógica de "Poucas Unidades"
  const isLowStock =
    !data.isStockUnlimited && stockCount > 0 && stockCount <= 10;

  const productImage =
    data.images && data.images.length > 0
      ? data.images[0]
      : "https://placehold.co/992x658/f3f4f6/9ca3af.png?text=Sem+Imagem";

  const handleCardClick = () => {
    startTransition(() => {
      router.push(`/produto/${data.id}`);
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItemToCart({
      id: data.id,
      name: data.name,
      price: finalPrice,
      image: productImage,
      quantity: 1,
    });
    toast.success("Adicionado ao carrinho!");
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isFavorite) {
      removeItemFromWishlist(data.id);
      toast.info("Removido dos favoritos.");
    } else {
      addItemToWishlist({
        id: data.id,
        name: data.name,
        price: finalPrice,
        image: productImage,
        category: categoryName,
      });
      toast.success("Adicionado aos favoritos!");
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-300 hover:border-orange-200 hover:shadow-lg",
        isPending && "pointer-events-none cursor-wait opacity-80",
        isOutOfStock && "opacity-80 grayscale-[0.5]",
      )}
    >
      {isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
        </div>
      )}

      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50 p-4">
        <Image
          src={productImage}
          alt={data.name}
          fill
          className={cn(
            "object-contain transition-transform duration-500 group-hover:scale-105",
            isPending && "scale-100 blur-[2px]",
          )}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
            <span className="rotate-[-10deg] rounded-md border-2 border-red-600 bg-white/80 px-4 py-2 text-lg font-bold tracking-widest text-red-600 uppercase shadow-sm">
              Esgotado
            </span>
          </div>
        )}

        <div className="absolute right-3 bottom-3 z-[90] flex translate-y-4 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Link href="/servicos" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              className="h-9 w-9 cursor-pointer rounded-full bg-blue-500 text-white shadow-sm backdrop-blur-md duration-300 hover:scale-105 hover:bg-blue-600 active:scale-95"
            >
              <Hammer className="h-4 w-4" />
            </Button>
          </Link>

          <Button
            size="icon"
            onClick={(e) => {
              e.stopPropagation(); // É bom garantir aqui também no favorito
              handleFavorite(e);
            }}
            className={cn(
              "h-9 w-9 cursor-pointer rounded-full shadow-sm backdrop-blur-md duration-300 hover:scale-105",
              isFavorite
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-white text-orange-500 hover:bg-neutral-100", // Ajustei a cor do texto para ficar visível
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>

          {!isOutOfStock && (
            <Button
              size="icon"
              onClick={(e) => {
                e.stopPropagation(); // É bom garantir aqui também no carrinho
                handleAddToCart(e);
              }}
              className="h-9 w-9 cursor-pointer rounded-full bg-orange-500 text-white shadow-sm backdrop-blur-md duration-300 hover:scale-105 hover:bg-orange-600"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col border-t border-neutral-100 px-4 py-2">
        <span className="truncate text-[10px] font-bold tracking-wide text-neutral-400 uppercase">
          {categoryName}
        </span>
        <h3 className="font-clash-display mt-1 text-base font-semibold text-neutral-900 transition-colors group-hover:text-orange-700">
          {data.name}
        </h3>

        {/* --- ID DO PRODUTO DISCRETO --- */}
        <p
          className="mt-0.5 truncate font-mono text-[11px] text-neutral-400"
          title={`ID: ${data.id}`}
        >
          #{data.id.slice(0, 12)}...
        </p>

        <div className="mt-auto flex flex-col pt-3">
          {data.discountPrice && !isFree && !isOutOfStock && (
            <span className="text-xs text-neutral-400 line-through">
              {formatPrice(data.price)}
            </span>
          )}

          <div className="flex items-center justify-between">
            {isOutOfStock ? (
              <span className="font-montserrat text-lg font-bold text-neutral-400">
                {formatPrice(finalPrice)}
              </span>
            ) : isFree ? (
              <span className="font-montserrat text-lg font-bold text-green-600 uppercase">
                Grátis
              </span>
            ) : (
              <span className="font-montserrat text-lg font-bold text-neutral-900">
                {formatPrice(finalPrice)}
              </span>
            )}

            {discountPercentage > 0 && !isFree && !isOutOfStock && (
              <span className="flex items-center justify-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                <TrendingDown className="h-3 w-3" />
                {discountPercentage}%
              </span>
            )}
          </div>

          {/* --- INDICADOR DE ESTOQUE --- */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] font-medium text-neutral-500">
              {isOutOfStock
                ? "Indisponível"
                : isFree
                  ? "Download Imediato"
                  : ""}
            </span>

            {!isOutOfStock && !data.isStockUnlimited && (
              <span
                className={cn(
                  "flex items-center gap-1 text-[10px] font-medium",
                  isLowStock ? "text-neutral-500" : "text-neutral-400",
                )}
              >
                Restam
                <span className="font-bold text-neutral-800">
                  {" "}
                  {stockCount}
                </span>{" "}
                un.
              </span>
            )}

            {data.isStockUnlimited && !isOutOfStock && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-500">
                Estoque Ilimitado
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
