"use client";

import { Loader2, Lock, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createFreeOrder } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useCartStore } from "@/store/cart-store"; // Importamos a store do carrinho

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
  const [showGuestModal, setShowGuestModal] = useState(false);

  const { data: session } = authClient.useSession();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = session?.user || initialUser;

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  // Ações do Carrinho
  const { clearCart, addItem } = useCartStore();

  const isFree = product.price === 0;
  // Se o estoque for 0 e não for ilimitado, está esgotado
  const isOutOfStock = !product.isStockUnlimited && (product.stock ?? 0) <= 0;

  const handleBuyNow = async () => {
    if (isOutOfStock) return;

    // Se for produto pago, o fluxo é: Carrinho -> Checkout Page
    if (!isFree) {
      setLoading(true);
      try {
        // 1. Limpa o carrinho atual (compra direta substitui o carrinho)
        clearCart();

        // 2. Adiciona o produto atual
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        });

        // 3. Redireciona para a página de checkout
        router.push("/checkout");
      } catch (error) {
        console.error(error);
        toast.error("Erro ao redirecionar para o checkout.");
        setLoading(false);
      }
      return;
    }

    // Se for GRATUITO, mantém a lógica de modal para capturar lead
    if (!user) {
      setShowGuestModal(true);
      return;
    }

    await processFreeCheckout();
  };

  const processFreeCheckout = async (guestData?: {
    name: string;
    email: string;
  }) => {
    try {
      setLoading(true);

      // Lógica de pedido gratuito (Server Action)
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
        guestData,
        couponCode,
      );

      toast.success("Produto resgatado com sucesso! Verifique seu e-mail.");
      router.push("/checkout/success");
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

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail) {
      toast.error("Por favor, informe seu e-mail.");
      return;
    }

    await processFreeCheckout({
      name: guestName || "Visitante",
      email: guestEmail,
    });
  };

  return (
    <>
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

      {/* MODAL APENAS PARA PRODUTOS GRATUITOS (LEAD CAPTURE) */}
      <Dialog open={showGuestModal} onOpenChange={setShowGuestModal}>
        <DialogContent className="max-w-[90vw] border-neutral-200 bg-white text-neutral-900 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Resgatar Produto Gratuito
            </DialogTitle>
            <DialogDescription className="text-neutral-500">
              Informe seu e-mail para receber o link de download.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuestSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name">
                Nome: <span className="text-red-500">*</span>
              </Label>
              <Input
                id="guest-name"
                placeholder="Ex: João Silva"
                className="border-neutral-300 bg-white text-neutral-900 focus:border-orange-500"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-email">
                E-mail: <span className="text-red-500">*</span>
              </Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="seu@email.com"
                className="border-neutral-300 bg-white text-neutral-900 focus:border-orange-500"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
              <p className="flex items-center justify-start text-xs text-neutral-500">
                <Lock className="mr-1 inline h-3 w-3" />
                Seus dados estão seguros.
              </p>
            </div>

            <Button
              type="submit"
              className="h-12 w-full bg-orange-600 text-lg font-bold text-white hover:bg-orange-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Resgatando...
                </>
              ) : (
                "Confirmar Resgate"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
