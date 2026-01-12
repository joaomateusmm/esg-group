"use client";

import { Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { createCheckoutSession } from "@/actions/checkout";
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
import { authClient } from "@/lib/auth-client"; // Importamos o cliente de auth

interface BuyNowButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  // Mantemos a prop user como opcional, mas vamos dar preferência ao hook
  user?: {
    name: string | null;
    email: string | null;
  } | null;
}

export function BuyNowButton({
  product,
  user: initialUser,
}: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Hook para pegar a sessão no cliente (mais confiável aqui)
  const { data: session } = authClient.useSession();

  // O usuário real é o da sessão (se existir) OU o passado via prop
  const user = session?.user || initialUser;

  // Estados para o formulário de visitante
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const itemToCheckout = [
    {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    },
  ];

  // Função Principal de Compra
  const handleBuyNow = async () => {
    // Agora 'user' verifica tanto a prop quanto a sessão do cliente
    if (!user) {
      setShowGuestModal(true);
      return;
    }

    // Se tiver usuário logado, processa normal
    await processCheckout();
  };

  // Função que chama o Server Action (usada tanto pelo logado quanto pelo guest)
  const processCheckout = async (guestData?: {
    name: string;
    email: string;
  }) => {
    try {
      setLoading(true);

      const result = await createCheckoutSession(itemToCheckout, guestData);

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao iniciar a compra. Tente novamente.");
      setLoading(false);
    }
  };

  // Handler do Form de Visitante
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail) {
      toast.error("Por favor, informe seu e-mail.");
      return;
    }

    // Chama o checkout passando os dados do visitante
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
        ) : (
          "COMPRAR AGORA"
        )}
      </Button>

      {/* --- MODAL PARA VISITANTES (GUEST CHECKOUT) --- */}
      <Dialog open={showGuestModal} onOpenChange={setShowGuestModal}>
        <DialogContent className="max-w-[80vw] border-white/10 bg-[#0A0A0A] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Quase lá!
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Você não está logado. Informe seu e-mail para receber o acesso ao
              produto.
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
                  Gerando Pagamento...
                </>
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
