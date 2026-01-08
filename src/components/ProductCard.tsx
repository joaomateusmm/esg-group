"use client";

import { Heart, Loader2, ShoppingCart, TrendingDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store"; // <--- Import da Wishlist

interface ProductCardProps {
  data: {
    id: string;
    name: string;
    description: string | null; // <--- Adicionado descrição
    price: number;
    discountPrice?: number | null;
    images: string[] | null;
  };
  categoryName: string;
}

export function ProductCard({ data, categoryName }: ProductCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Stores
  const addItemToCart = useCartStore((state) => state.addItem);
  const {
    addItem: addItemToWishlist,
    removeItem: removeItemFromWishlist,
    isInWishlist,
  } = useWishlistStore();

  const isFavorite = isInWishlist(data.id);

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(priceInCents / 100);
  };

  const discountPercentage =
    data.discountPrice && data.price
      ? Math.round(((data.price - data.discountPrice) / data.price) * 100)
      : 0;

  const finalPrice = data.discountPrice || data.price;
  const productImage =
    data.images && data.images.length > 0
      ? data.images[0]
      : "https://placehold.co/992x658/1a1a1a/FFF.png?text=Sem+Imagem";

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
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all duration-300 hover:border-white/20 hover:bg-white/10",
        isPending && "pointer-events-none cursor-wait opacity-80",
      )}
    >
      {isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <Loader2 className="h-10 w-10 animate-spin text-[#D00000]" />
        </div>
      )}

      <div className="relative aspect-[992/658] w-full overflow-hidden bg-white/5">
        <Image
          src={productImage}
          alt={data.name}
          fill
          className={cn(
            "bg-white/5 object-cover transition-transform duration-500 group-hover:scale-105",
            isPending && "scale-100 blur-[2px]",
          )}
        />

        <div className="absolute right-4 bottom-4 z-20 flex translate-y-4 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Button
            // BOTAO PARA ADD NOS FAVORITOS
            size="icon"
            onClick={handleFavorite}
            className={cn(
              "h-10 w-10 rounded-full shadow-md backdrop-blur-md duration-300",
              isFavorite
                ? "bg-red-500 text-white hover:bg-red-500 hover:active:scale-95"
                : "bg-red-800 text-white hover:bg-red-600 hover:active:scale-95",
            )}
          >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
          </Button>
          <Button
            size="icon"
            onClick={handleAddToCart}
            className="h-10 w-10 rounded-full bg-red-800 text-white shadow-md backdrop-blur-md duration-300 hover:bg-red-600 hover:active:scale-95"
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          {categoryName}
        </span>
        <h3 className="font-clash-display mt-1 line-clamp-1 text-lg font-medium text-white">
          {data.name}
        </h3>

        <div className="mt-auto flex flex-col pt-4">
          {data.discountPrice && (
            <span className="text-xs text-neutral-500 line-through">
              {formatPrice(data.price)}
            </span>
          )}

          <div className="flex items-center justify-between">
            <span className="font-montserrat text-xl font-bold text-white">
              {formatPrice(finalPrice)}
            </span>
            {discountPercentage > 0 && (
              <span className="flex items-center justify-center gap-1 rounded-md border border-green-500/20 bg-green-500/10 p-1.5 text-xs font-bold text-green-500 shadow-md">
                <TrendingDown className="h-3 w-3" />
                {discountPercentage}%
              </span>
            )}
          </div>

          <span className="mt-1 text-xs text-neutral-500">À vista no PIX</span>
        </div>
      </div>
    </div>
  );
}
