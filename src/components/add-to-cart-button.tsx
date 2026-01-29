"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number | null;
    images: string[] | null;
    // --- NOVAS PROPS DE ESTOQUE ---
    stock: number | null;
    isStockUnlimited: boolean;
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

  // Lógica de estoque
  const isOutOfStock = !product.isStockUnlimited && (product.stock ?? 0) <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return; // Bloqueio extra de segurança

    const finalPrice = product.discountPrice ?? product.price;

    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.images?.[0] || "",
      quantity: 1,
    });

    toast.success("Produto adicionado ao carrinho!");
  };

  return (
    <Button
      onClick={handleAddToCart}
      variant={variant}
      size={size}
      disabled={isOutOfStock}
      className={cn(
        // ADICIONADO: Transição suave e movimento para cima no hover
        "cursor-pointer transition-transform duration-200 hover:-translate-y-1",
        className,
        // Estilo para quando estiver sem estoque
        isOutOfStock && "cursor-not-allowed opacity-50",
      )}
    >
      <ShoppingCart className={showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
      {showText && "Adicionar"}
    </Button>
  );
}
