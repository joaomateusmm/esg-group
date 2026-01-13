"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createCheckoutSession, createFreeOrder } from "@/actions/checkout";
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

interface BuyNowButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  user?: {
    name: string | null;
    email: string | null;
  } | null;
  couponCode?: string; // Prop opcional
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
  const user = session?.user || initialUser;
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const isFree = product.price === 0;

  const itemToCheckout = [
    {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    },
  ];

  const handleBuyNow = async () => {
    if (!user) {
      setShowGuestModal(true);
      return;
    }
    await processCheckout();
  };

  const processCheckout = async (guestData?: {
    name: string;
    email: string;
  }) => {
    try {
      setLoading(true);

      if (isFree) {
        await createFreeOrder(itemToCheckout, guestData, couponCode);
        toast.success("Produto resgatado com sucesso! Verifique seu e-mail.");
        router.push("/checkout/success");
      } else {
        // Fluxo Pago
        const result = await createCheckoutSession(
          itemToCheckout,
          guestData,
          couponCode,
        );

        // Verificação de tipo segura para o TypeScript
        if ("url" in result && result.url) {
          window.location.href = result.url;
        } else if ("success" in result && result.success) {
          toast.success("Produto resgatado com sucesso!");
          router.push("/checkout/success");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar o pedido. Tente novamente.");
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

    await processCheckout({
      name: guestName || "Visitante",
      email: guestEmail,
    });
  };

  return (
    <>
      <Button
        size="lg"
        className="mb-4 h-14 w-full bg-[#D00000] text-lg font-bold text-white shadow-[0_0_20px_rgba(208,0,0,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#a00000] hover:shadow-[0_0_30px_rgba(208,0,0,0.4)]"
        onClick={handleBuyNow}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            PROCESSANDO...
          </>
        ) : isFree ? (
          "BAIXAR AGORA"
        ) : (
          "COMPRAR AGORA"
        )}
      </Button>

      <Dialog open={showGuestModal} onOpenChange={setShowGuestModal}>
        <DialogContent className="max-w-[80vw] border-white/10 bg-[#0A0A0A] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {isFree ? "Resgatar Produto" : "Quase lá!"}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              {isFree
                ? "Informe seu e-mail para receber o link de download gratuitamente."
                : "Você não está logado. Informe seu e-mail para receber o acesso ao produto."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuestSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name" className="text-neutral-300">
                Nome: <span className="text-[#D00000]">*</span>
              </Label>
              <Input
                id="guest-name"
                placeholder="Ex: João Silva"
                className="border-white/10 bg-white/5 text-white placeholder:text-neutral-600 focus:border-[#D00000]"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-email" className="text-neutral-300">
                E-mail: <span className="text-[#D00000]">*</span>
              </Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="seu@email.com"
                className="border-white/10 bg-white/5 text-white placeholder:text-neutral-600 focus:border-[#D00000]"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
              <p className="flex items-center justify-start text-xs text-neutral-500">
                <Lock className="mr-1 inline h-3 w-3" />
                Preencha com um e-mail válido.
              </p>
            </div>

            <Button
              type="submit"
              className="h-14 w-full bg-[#D00000] text-lg font-bold text-white shadow-[0_0_20px_rgba(208,0,0,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#a00000] hover:shadow-[0_0_30px_rgba(208,0,0,0.4)]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isFree ? "Resgatando..." : "Gerando Pagamento..."}
                </>
              ) : isFree ? (
                "Confirmar Resgate"
              ) : (
                "Ir para Pagamento"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
