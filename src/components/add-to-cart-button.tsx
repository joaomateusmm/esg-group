"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number | null; // Adicionado para lidar com desconto
    images: string[] | null;
  };
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
}

export function AddToCartButton({
  product,
  className,
  variant = "default",
  size = "default",
  showText = true,
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Evita navegar se estiver dentro de um Link
    e.stopPropagation();

    // Usa o preço promocional se existir, senão o preço normal
    const finalPrice = product.discountPrice ?? product.price;

    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.images?.[0] || "", // Pega a primeira imagem
      quantity: 1,
    });

    toast.success("Produto adicionado ao carrinho!");
  };

  return (
    <Button
      onClick={handleAddToCart}
      variant={variant}
      size={size}
      className={className}
    >
      <ShoppingCart className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
      {showText && "Adicionar"}
    </Button>
  );
}
