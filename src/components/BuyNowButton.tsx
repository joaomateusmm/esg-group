"use client";

import {  Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createCheckoutSession } from "@/actions/checkout";
import { Button } from "@/components/ui/button";

interface BuyNowButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
}

export function BuyNowButton({ product }: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleBuyNow = async () => {
    try {
      setLoading(true);

      // Prepara o item como se fosse um carrinho de 1 item
      const itemToCheckout = [
        {
          id: product.id,
          name: product.name,
          price: product.price, // Já deve vir em centavos
          quantity: 1,
          image: product.image,
        },
      ];

      // Chama a Server Action
      const result = await createCheckoutSession(itemToCheckout);

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao iniciar a compra. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      className="mb-4 h-14 w-full bg-[#D00000] text-lg font-bold text-white shadow-[0_0_20px_rgba(208,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#a00000] hover:shadow-[0_0_30px_rgba(208,0,0,0.4)]"
      onClick={handleBuyNow}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          PROCESSANDO...
        </>
      ) : (
        "COMPRAR AGORA"
      )}
    </Button>
  );
}
