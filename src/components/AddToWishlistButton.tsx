"use client";

import { Heart, HeartPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlist-store";

interface AddToWishlistButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  };
  className?: string;
}

export function AddToWishlistButton({
  product,
  className,
}: AddToWishlistButtonProps) {
  const {
    addItem: addItemToWishlist,
    removeItem: removeItemFromWishlist,
    isInWishlist,
  } = useWishlistStore();

  const isFavorite = isInWishlist(product.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault(); // Previne comportamentos indesejados
    e.stopPropagation();

    if (isFavorite) {
      removeItemFromWishlist(product.id);
      toast.info("Removido dos favoritos.");
    } else {
      addItemToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
      });
      toast.success("Adicionado aos favoritos!");
    }
  };

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleFavorite}
      className={cn(
        "text-md h-14 flex-1 font-bold transition-all duration-300 hover:scale-105 active:scale-95",
        // Estilo quando NÃO é favorito (igual ao teu original)
        !isFavorite &&
          "border-white/10 bg-transparent text-white hover:bg-white/5",
        // Estilo quando É favorito (feedback visual)
        isFavorite && "border-white/20 bg-white/5 text-white hover:bg-white/15",
        className,
      )}
    >
      {isFavorite ? (
        <>
          <Heart className="mr-2 h-5 w-5 fill-current" />
          Favoritado
        </>
      ) : (
        <>
          <HeartPlus className="mr-2 h-5 w-5" />
          Favoritar
        </>
      )}
    </Button>
  );
}
