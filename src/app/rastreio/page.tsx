import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Banknote,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Search,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getOrderTracking } from "@/actions/tracking";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Força a renderização dinâmica por causa dos searchParams
export const dynamic = "force-dynamic";

export default async function RastreioPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = params.code;

  let orderData = null;
  if (code) {
    orderData = await getOrderTracking(code);
  }

  // --- 1. Lógica do Status de Pagamento ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPaymentSteps = (order: any) => {
    const isPaid = order.status === "paid";
    const isCod = order.paymentMethod === "cod";

    if (isCod) {
      return [
        {
          title: "Pagamento na Entrega",
          description: "Você optou por pagar ao receber o produto.",
          date: order.createdAt,
          completed: true,
          icon: Clock,
        },
        {
          title: "Pagamento Recebido",
          description: "O entregador confirmou o recebimento do valor.",
          completed: isPaid,
          icon: CheckCircle2,
        },
      ];
    }

    return [
      {
        title: "Aguardando Pagamento",
        description: "Aguardando a confirmação da instituição financeira.",
        date: order.createdAt,
        completed: true,
        icon: Clock,
      },
      {
        title: "Pagamento Aprovado",
        description: "O pagamento foi processado e aprovado com sucesso.",
        completed: isPaid,
        icon: CheckCircle2,
      },
    ];
  };

  // --- 2. Lógica do Status Logístico (Entrega) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getDeliverySteps = (order: any) => {
    const isProcessing = ["processing", "shipped", "delivered"].includes(
      order.fulfillmentStatus,
    );
    const isShipped = ["shipped", "delivered"].includes(
      order.fulfillmentStatus,
    );
    const isDelivered = order.fulfillmentStatus === "delivered";

    return [
      {
        title: "Pedido Realizado",
        description: "Recebemos o seu pedido.",
        date: order.createdAt,
        completed: true,
        icon: Package,
      },
      {
        title: "Em Preparação",
        description: "Seu pedido está sendo embalado.",
        completed: isProcessing,
        icon: Clock,
      },
      {
        title: "A Caminho",
        description: "Seu pedido está a caminho do destino.",
        completed: isShipped,
        icon: Truck,
      },
      {
        title: "Entregue",
        description: "O pedido chegou ao destino.",
        completed: isDelivered,
        icon: MapPin,
      },
    ];
  };

  const paymentSteps = orderData ? getPaymentSteps(orderData) : [];
  const deliverySteps = orderData ? getDeliverySteps(orderData) : [];

  // --- Componente auxiliar para renderizar cada linha do tempo ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TimelineCard = ({ title, steps }: { title: string; steps: any[] }) => (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-montserrat mb-8 text-lg font-bold text-neutral-900">
        {title}
      </h2>

      <div className="relative ml-4 border-l-2 border-neutral-100 pb-4">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const Icon = step.icon;

          return (
            <div
              key={index}
              className={`relative mb-8 pl-8 ${isLast ? "mb-0" : ""}`}
            >
              {/* Bolinha indicadora */}
              <div
                className={`absolute top-1 -left-[17px] flex h-8 w-8 items-center justify-center rounded-full border-4 border-white ${step.completed ? "bg-orange-500 text-white shadow-sm" : "bg-neutral-200 text-neutral-500"}`}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Linha colorida por cima se estiver completado */}
              {!isLast && step.completed && steps[index + 1]?.completed && (
                <div className="absolute top-8 -left-[2px] h-full w-[2px] bg-orange-500" />
              )}

              {/* Conteúdo */}
              <div>
                <h3
                  className={`font-bold ${step.completed ? "text-neutral-900" : "text-neutral-400"}`}
                >
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {step.description}
                </p>
                {step.date && (
                  <span className="mt-1 block text-xs font-medium text-neutral-400">
                    {format(new Date(step.date), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-24 pb-12 sm:pt-38">
        <div className="w-full max-w-4xl">
          {/* CABEÇALHO E BUSCA */}
          <div className="mb-10 text-center">
            <h1 className="font-clash-display text-3xl font-bold text-neutral-900 md:text-4xl">
              Rastrear Pedido
            </h1>
            <p className="mt-2 text-neutral-500">
              Acompanhe o status financeiro e logístico em tempo real.
            </p>

            <form
              action="/rastreio"
              method="GET"
              className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-full border border-neutral-200 bg-white p-2 shadow-sm transition-all focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100/50"
            >
              <Search className="ml-3 h-5 w-5 text-neutral-400" />
              <Input
                name="code"
                defaultValue={code || ""}
                placeholder="Ex: AB123456"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                required
              />
              <Button
                type="submit"
                className="rounded-full bg-orange-600 px-6 font-bold text-white transition-colors hover:bg-orange-700"
              >
                Buscar
              </Button>
            </form>
          </div>

          {/* MENSAGEM DE ERRO SE CÓDIGO FOR INVÁLIDO */}
          {code && !orderData && (
            <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-md rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
              <MapPin className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <h3 className="font-bold">Código não encontrado</h3>
              <p className="mt-1 text-sm opacity-80">
                Verifique se o código foi digitado corretamente ou se o pedido
                já foi processado.
              </p>
            </div>
          )}

          {/* RESULTADO DO RASTREIO */}
          {orderData && (
            <div className="animate-in fade-in slide-in-from-bottom-4 grid items-start gap-6 md:grid-cols-[1fr_320px] lg:gap-8">
              {/* COLUNA ESQUERDA: LINHAS DO TEMPO SEPARADAS */}
              <div className="flex flex-col gap-6">
                <TimelineCard
                  title="Status do Pagamento"
                  steps={paymentSteps}
                />
                <TimelineCard title="Status da Entrega" steps={deliverySteps} />
              </div>

              {/* COLUNA DIREITA: RESUMO DO PEDIDO */}
              <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="font-montserrat mb-4 text-sm font-bold tracking-wider text-neutral-900 uppercase">
                    Detalhes
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="block text-xs text-neutral-500">
                        Código de Rastreio
                      </span>
                      <span className="font-mono font-bold text-orange-600">
                        {orderData.trackingCode}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-neutral-500">
                        Destino
                      </span>
                      <span className="font-medium text-neutral-900">
                        {orderData.shippingAddress?.city} -{" "}
                        {orderData.shippingAddress?.state}
                      </span>
                    </div>
                    {orderData.estimatedDeliveryStart &&
                      orderData.estimatedDeliveryEnd && (
                        <div className="rounded-md bg-orange-50 p-3">
                          <span className="block text-xs text-orange-600/80">
                            Previsão de Entrega
                          </span>
                          <span className="font-bold text-orange-700">
                            {format(
                              new Date(orderData.estimatedDeliveryStart),
                              "dd/MM",
                            )}{" "}
                            a{" "}
                            {format(
                              new Date(orderData.estimatedDeliveryEnd),
                              "dd/MM",
                            )}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* ITENS DO PEDIDO */}
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="font-montserrat mb-4 text-sm font-bold tracking-wider text-neutral-900 uppercase">
                    Pacote
                  </h3>
                  <div className="flex flex-col gap-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {orderData.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="m-auto mt-3 h-6 w-6 text-neutral-300" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="line-clamp-2 text-xs font-medium text-neutral-900">
                            {item.name}
                          </span>
                          <span className="mt-0.5 text-xs text-neutral-500">
                            Qtd: {item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
