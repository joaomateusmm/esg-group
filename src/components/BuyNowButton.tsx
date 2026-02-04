"use client";

import { Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createFreeOrder } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useCartStore } from "@/store/cart-store";

interface BuyNowButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    stock: number | null;
    isStockUnlimited: boolean;
  };
  user?: {
    name: string | null;
    email: string | null;
  } | null;
  couponCode?: string;
}

export function BuyNowButton({
  product,
  user: initialUser,
  couponCode,
}: BuyNowButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Verifica sessão no cliente (mais seguro) ou usa a inicial
  const { data: session } = authClient.useSession();
  const user = session?.user || initialUser;

  const {
    clearCart,
    addItem,
    applyCoupon,
    coupon: storeCoupon,
  } = useCartStore();

  const isFree = product.price === 0;
  const isOutOfStock = !product.isStockUnlimited && (product.stock ?? 0) <= 0;

  const handleBuyNow = async () => {
    if (isOutOfStock) return;

    // --- FLUXO 1: PRODUTO PAGO ---
    if (!isFree) {
      setLoading(true);
      try {
        // 1. Lógica do Cupom (Backup)
        const backupCoupon =
          storeCoupon?.code === couponCode ? storeCoupon : null;

        // 2. Limpa e adiciona
        clearCart();
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        });

        // 3. Restaura cupom
        if (backupCoupon) {
          applyCoupon(backupCoupon);
        }

        // 4. Vai para checkout (Lá o login será exigido pelo CheckoutForm)
        router.push("/checkout");
      } catch (error) {
        console.error(error);
        toast.error("Erro ao redirecionar para o checkout.");
        setLoading(false);
      }
      return;
    }

    // --- FLUXO 2: PRODUTO GRATUITO ---
    
    // Se não estiver logado, manda para o login
    if (!user) {
      toast.info("Você precisa entrar na sua conta para baixar este item.");
      // Redireciona para login e volta para a página do produto depois
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }

    await processFreeCheckout();
  };

  const processFreeCheckout = async () => {
    try {
      setLoading(true);

      // AQUI ESTAVA O ERRO: Removemos o argumento guestData
      await createFreeOrder(
        [
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image,
          },
        ],
        couponCode, // Agora o segundo argumento é o cupom
      );

      toast.success("Produto resgatado com sucesso! Verifique seu e-mail.");
      router.push("/checkout/sucesso");
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao processar o pedido. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      className={`mb-4 h-14 w-full text-lg font-bold text-white shadow-lg transition-all ${
        isOutOfStock
          ? "cursor-not-allowed bg-neutral-400 hover:bg-neutral-400"
          : "bg-orange-600 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-xl"
      }`}
      onClick={handleBuyNow}
      disabled={loading || isOutOfStock}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          PROCESSANDO...
        </>
      ) : isOutOfStock ? (
        "ESGOTADO"
      ) : isFree ? (
        "BAIXAR AGORA"
      ) : (
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" /> COMPRAR AGORA
        </span>
      )}
    </Button>
  );
}