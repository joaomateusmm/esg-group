"use client";

import {
  CheckCircle2,
  Copy,
  Home,
  Loader2,
  Package,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"; // Importei useRouter
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { getOrderIdByPaymentIntent } from "@/actions/checkout";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

function SuccessContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((state) => state.clearCart);

  const paymentIntent = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");
  const urlOrderId = searchParams.get("orderId");

  const [finalOrderId, setFinalOrderId] = useState<string | null>(urlOrderId);
  const [loadingId, setLoadingId] = useState(false);

  // Efeito para resolver o ID do pedido
  useEffect(() => {
    const resolveOrderId = async () => {
      if (urlOrderId) {
        setFinalOrderId(urlOrderId);
        clearCart();
        return;
      }

      if (paymentIntent && redirectStatus === "succeeded") {
        setLoadingId(true);
        try {
          const id = await getOrderIdByPaymentIntent(paymentIntent);
          if (id) {
            setFinalOrderId(id);
            clearCart();
          }
        } catch (error) {
          console.error("Erro ao recuperar ID do pedido", error);
        } finally {
          setLoadingId(false);
        }
      }
    };

    resolveOrderId();
  }, [urlOrderId, paymentIntent, redirectStatus, clearCart]);

  const isCardPayment = !!paymentIntent;

  const handleCopyOrder = () => {
    if (finalOrderId) {
      navigator.clipboard.writeText(finalOrderId.slice(0, 8).toUpperCase());
      toast.success("Código copiado!");
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pt-22 text-center">
      {/* --- IMAGEM DE SUCESSO AQUI --- */}
      <div className="animate-in zoom-in mb-6 duration-500">
        <Image
          src="/images/illustration-sucess.svg" // Corrigi a barra invertida para barra normal (padrão web)
          alt="Pedido Confirmado"
          width={150}
          height={150}
          className="h-55 w-auto object-contain duration-500 hover:scale-105"
          priority
        />
      </div>

      <h1 className="text-3xl font-bold text-neutral-900 md:text-4xl">
        {isCardPayment ? "Pagamento Confirmado!" : "Pedido Realizado!"}
      </h1>

      <p className="my-5 max-w-md text-neutral-500">
        {isCardPayment
          ? "Obrigado pela sua compra. Seu pagamento foi processado com sucesso e já estamos preparando seu envio."
          : "Recebemos seu pedido. O pagamento será realizado no momento da entrega."}
      </p>

      <div className="mb-8 w-full max-w-sm space-y-3 rounded-lg border border-neutral-200 bg-white p-5 text-sm shadow-sm">
        <div className="flex flex-col gap-1 border-b border-neutral-100 pb-4">
          <span className="text-xs font-bold tracking-wider text-neutral-400 uppercase">
            Número do Pedido
          </span>

          <div className="flex items-center justify-center gap-2">
            {loadingId ? (
              <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            ) : finalOrderId ? (
              <>
                <span className="font-mono text-2xl font-bold tracking-tight text-neutral-900">
                  #{finalOrderId.slice(0, 8).toUpperCase()}
                </span>
                <button
                  onClick={handleCopyOrder}
                  className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                  title="Copiar código"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </>
            ) : (
              <span className="text-neutral-400 italic">Processando ID...</span>
            )}
          </div>
        </div>

        {/* Informação Extra baseada no método */}
        {!isCardPayment ? (
          <div className="flex items-center justify-center gap-2 pt-2 font-medium text-orange-600">
            <Truck className="h-4 w-4" /> Pagamento na Entrega
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 pt-2 font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Pagamento via Cartão
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link href="/minha-conta/compras" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="h-12 w-full gap-2 border-neutral-300 px-8 sm:w-auto"
          >
            <Package className="h-4 w-4" /> Meus Pedidos
          </Button>
        </Link>
        <Link href="/" className="w-full sm:w-auto">
          <Button className="h-12 w-full gap-2 bg-orange-600 px-8 font-bold text-white hover:bg-orange-700 sm:w-auto">
            <Home className="h-4 w-4" /> Voltar para a Loja
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Suspense fallback={<div className="h-20 w-full bg-neutral-50" />}>
        <Header />
      </Suspense>

      <main className="flex flex-1 flex-col items-center justify-center py-20">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
              <p className="text-neutral-500">Processando informações...</p>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </main>

      <Suspense fallback={<div className="h-20 w-full bg-neutral-50" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
