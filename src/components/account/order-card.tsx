"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Box,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock,
  Eye,
  EyeOff,
  MapPin,
  Store,
  Ticket, // Adicionado ícone de cupom
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { confirmOrderDelivery } from "@/actions/order-actions";
import { ProductReviewForm } from "@/components/product-review-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderItem {
  productId: string;
  productName: string;
  image?: string | null;
  currentImage?: string | null;
  quantity: number;
  price: number;
  description?: string | null;
  dimensions: {
    weight?: number | null;
    width?: number | null;
    height?: number | null;
    length?: number | null;
  };
}

interface OrderProps {
  id: string;
  status: string;
  fulfillmentStatus: string;
  amount: number; // Valor Total Pago (Final)
  shippingCost: number | null;
  discountAmount?: number | null; // Valor do desconto aplicado
  couponId?: string | null; // ID ou Código do cupom (se disponível via join)
  createdAt: Date;
  trackingCode?: string | null;
  paymentMethod?: string | null;
  currency?: string | null;

  // NOVOS CAMPOS: Datas de entrega
  estimatedDeliveryStart?: Date | null;
  estimatedDeliveryEnd?: Date | null;

  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
  items: OrderItem[];
}

const formatCurrency = (value: number, currency: string | null | undefined) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(value / 100);
};

const getStatusLabel = (
  status: string,
  fulfillmentStatus: string,
  paymentMethod?: string | null,
) => {
  const logisticsMap: Record<string, string> = {
    idle: "Aguardando",
    processing: "Preparando",
    shipped: "A Caminho",
    delivered: "Entregue",
    returned: "Devolvido",
  };

  if (status === "canceled" || status === "failed") return "CANCELADO";

  if (paymentMethod === "cod") {
    if (fulfillmentStatus === "idle")
      return "PAGAMENTO NA ENTREGA - Processando Pedido";
    return `PAGAMENTO NA ENTREGA - ${logisticsMap[fulfillmentStatus] || fulfillmentStatus}`;
  }

  if (status === "pending") return "AGUARDANDO PAGAMENTO";

  if (status === "paid" || status === "succeeded") {
    if (fulfillmentStatus === "idle") return "PAGO - PREPARANDO";
    return logisticsMap[fulfillmentStatus] || fulfillmentStatus;
  }

  return status;
};

// Helper para formatar o range de datas de entrega
const getDeliveryRangeLabel = (start?: Date | null, end?: Date | null) => {
  if (!start || !end) return null;

  const startStr = format(new Date(start), "dd/MM", { locale: ptBR });
  const endStr = format(new Date(end), "dd/MM", { locale: ptBR });

  return `Data prevista para entrega: ${startStr} - ${endStr}`;
};

// Helper para obter a descrição baseada no status
const getDeliveryDescription = (fulfillmentStatus: string) => {
  switch (fulfillmentStatus) {
    case "shipped":
      return "O seu pedido está a caminho do destino final.";
    case "delivered":
      return "O seu pedido chegou. Confirme a entrega e avalie nosso serviço.";
    case "processing":
    default:
      return "O seu pedido está sendo preparado para o envio.";
  }
};

export function OrderCard({ order }: { order: OrderProps }) {
  const [showAddress, setShowAddress] = useState(false);

  const handleConfirmDelivery = async () => {
    await confirmOrderDelivery(order.id);
  };

  const getFormattedAddress = () => {
    if (!order.shippingAddress) return "Endereço não informado";

    if (showAddress) {
      const {
        street = "",
        number = "S/N",
        complement = "",
        city = "",
        state = "",
        zipCode = "",
      } = order.shippingAddress;

      const addressString = `${street}, ${number}${complement ? ` - ${complement}` : ""} - ${city}/${state} - CEP: ${zipCode}`;
      if (addressString.length < 10) return "Endereço inválido no cadastro";
      return addressString;
    }
    return "********* *********, *** - *****/** - CEP: *****-***";
  };

  const showReviewForm =
    (order.fulfillmentStatus === "delivered" || order.status === "completed") &&
    order.items.length > 0;

  // Calcula o texto da data
  let deliveryStart = order.estimatedDeliveryStart;
  let deliveryEnd = order.estimatedDeliveryEnd;

  if (!deliveryStart || !deliveryEnd) {
    const created = new Date(order.createdAt);
    deliveryStart = new Date(created);
    deliveryStart.setDate(created.getDate() + 10);

    deliveryEnd = new Date(created);
    deliveryEnd.setDate(created.getDate() + 17);
  }

  const deliveryRange = getDeliveryRangeLabel(deliveryStart, deliveryEnd);
  const deliveryDescription = getDeliveryDescription(order.fulfillmentStatus);

  // VERIFICAÇÃO SE É "AGUARDANDO PAGAMENTO" (PENDENTE E NÃO COD)
  const isPendingPayment =
    order.status === "pending" && order.paymentMethod !== "cod";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
      {/* COLUNA ESQUERDA: CARD DO PEDIDO */}
      <Card className="flex-1 overflow-hidden border-0 bg-white py-0 shadow-sm ring-1 ring-neutral-900/5 transition-shadow hover:shadow-md">
        {/* Header do Card */}
        <div className="flex items-center justify-between border-b border-neutral-100 bg-white px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            <span className="rounded bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
              OFICIAL
            </span>
            <span className="flex items-center gap-2 text-sm font-bold text-neutral-800">
              <Store className="h-4 w-4 text-neutral-500" />
              ESG Group
            </span>
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="hidden h-6 px-2 text-xs text-neutral-400 hover:text-neutral-700 sm:flex"
              >
                Ver Loja{" "}
                <ChevronRight className="h-3 w-3 duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {order.trackingCode && (
              <div className="hidden items-center gap-1.5 border-r border-neutral-200 pr-4 text-xs font-medium text-neutral-600 sm:flex">
                <Truck className="h-3.5 w-3.5" />
                <span className="opacity-70">Rastreio:</span>{" "}
                {order.trackingCode}
              </div>
            )}
            <span className="text-sm font-bold tracking-tight text-orange-600 uppercase">
              {getStatusLabel(
                order.status,
                order.fulfillmentStatus,
                order.paymentMethod,
              )}
            </span>
          </div>
        </div>

        {/* Lista de Itens */}
        <div className="flex flex-col gap-6 px-6">
          <div className="rounded-md bg-orange-50 p-3">
            {/* LÓGICA DE EXIBIÇÃO DA BOX LARANJA */}
            {isPendingPayment ? (
              // SE FOR AGUARDANDO PAGAMENTO
              <div className="font-montserrat flex flex-col items-start justify-center gap-1 text-sm font-semibold text-orange-600">
                <span>Aguardando a confirmação do pagamento</span>
                <p className="font-montserrat text-[11px] font-normal text-neutral-400"></p>
              </div>
            ) : (
              // SE FOR OUTRO STATUS (PAGO, COD, ENVIADO, ETC)
              <>
                {deliveryRange && order.fulfillmentStatus !== "delivered" && (
                  <div className="font-montserrat flex flex-col items-start justify-center gap-1 text-sm font-semibold text-orange-600">
                    <span>{deliveryRange}</span>
                    <p className="font-montserrat text-[11px] font-normal text-neutral-400">
                      {deliveryDescription}
                    </p>
                  </div>
                )}

                {order.fulfillmentStatus === "delivered" && (
                  <div className="font-montserrat flex flex-col items-start justify-center gap-1 text-sm font-semibold text-green-600">
                    <span>Pedido Entregue</span>
                    <p className="font-montserrat text-[11px] font-normal text-neutral-400">
                      {deliveryDescription}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 border-b border-dashed border-neutral-100 pb-4 last:border-0 last:pb-0"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                {item.currentImage && (
                  <Image
                    src={item.currentImage}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col sm:flex-row sm:justify-between">
                <div className="space-y-1 pr-4">
                  <Link
                    href={`/produto/${item.productId}`}
                    className="hover:underline"
                  >
                    <h4 className="line-clamp-2 text-sm font-medium text-neutral-900">
                      {item.productName}
                    </h4>
                  </Link>
                  <p className="line-clamp-1 max-w-md text-xs text-neutral-500">
                    {item.description || "Descrição indisponível."}
                  </p>
                  <div className="mt-2 flex w-fit items-center gap-3 rounded bg-neutral-50 p-2 text-xs text-neutral-500">
                    <span>Variação: Padrão</span>
                    <span className="h-3 w-px bg-neutral-300"></span>
                    <span>x{item.quantity}</span>
                    {item.dimensions.weight && item.dimensions.weight > 0 && (
                      <>
                        <span className="h-3 w-px bg-neutral-300"></span>
                        <span className="flex items-center gap-1">
                          <Box className="h-3 w-3" />
                          {item.dimensions.weight}kg
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-4 text-right sm:mt-0">
                  <span className="block text-sm font-bold text-neutral-900">
                    {formatCurrency(item.price, order.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Endereço */}
        {order.shippingAddress && (
          <div className="flex items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50 px-6 py-3 text-xs text-neutral-600">
            <div className="flex items-center gap-2 overflow-hidden">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span className="shrink-0 font-medium text-neutral-900">
                Endereço de Entrega:
              </span>
              <span className="max-w-[250px] truncate sm:max-w-md">
                {getFormattedAddress()}
              </span>
            </div>
            <button
              onClick={() => setShowAddress(!showAddress)}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-neutral-200 p-1 shadow-sm transition-colors hover:bg-neutral-300"
              title={showAddress ? "Ocultar endereço" : "Mostrar endereço"}
            >
              {showAddress ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </button>
          </div>
        )}

        {/* Footer do Card */}
        <div className="border-y border-dashed border-neutral-200 bg-[#fffaf5] px-6 py-4">
          <div className="mb-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            {/* LADO ESQUERDO: DATA DO PEDIDO E PREVISÃO */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Pedido realizado em{" "}
                  {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>

              <div className="flex items-center justify-start">
                <span className="flex items-center gap-2 text-xs text-neutral-500">
                  <CircleAlert className="h-3.5 w-3.5" /> O prazo de entrega
                  pode ser alterado conforme as etapas do pedido.
                </span>
              </div>
            </div>

            {/* LADO DIREITO: TOTAIS E VALORES */}
            <div className="flex flex-col items-end gap-1">
              {/* Frete */}
              <div className="flex items-center gap-2 text-xs">
                <Truck className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-neutral-500">Frete:</span>
                <span className="font-medium text-neutral-900">
                  {order.shippingCost
                    ? formatCurrency(order.shippingCost, order.currency)
                    : "Grátis"}
                </span>
              </div>

              {/* Desconto (NOVO) */}
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <Ticket className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-600">Desconto:</span>
                  <span className="font-medium text-green-700">
                    - {formatCurrency(order.discountAmount, order.currency)}
                  </span>
                </div>
              )}

              {/* Total Final */}
              <div className="mt-1 flex items-center gap-2 border-t border-dashed border-orange-200 pt-1">
                <span className="text-sm font-medium text-neutral-600">
                  Total pago:
                </span>
                <span className="text-xl font-bold text-orange-600">
                  {/* Usa diretamente o valor salvo no banco, que já é o final */}
                  {formatCurrency(order.amount, order.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap justify-start gap-3 border-t border-dotted border-orange-100/50 pt-2 md:justify-end">
            {order.status === "pending" &&
              order.fulfillmentStatus === "idle" && (
                <Button
                  variant="outline"
                  className="border-neutral-300 font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                >
                  Cancelar Pedido
                </Button>
              )}

            {order.status === "pending" && order.paymentMethod !== "cod" && (
              <Link href="/checkout">
                <Button className="bg-orange-600 px-6 font-bold text-white shadow-sm hover:bg-orange-700">
                  Pagar Agora
                </Button>
              </Link>
            )}

            {order.fulfillmentStatus === "shipped" && (
              <Button
                onClick={handleConfirmDelivery}
                className="h-9 bg-orange-600 px-6 font-medium text-white shadow-sm hover:bg-orange-700"
              >
                Confirmar Recebimento
              </Button>
            )}

            {(order.fulfillmentStatus === "delivered" ||
              order.status === "completed") && (
              <Button
                variant="outline"
                className="border-orange-200 bg-white font-medium text-orange-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              >
                Comprar Novamente
              </Button>
            )}

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex cursor-pointer items-center justify-center gap-2.5 rounded-md border border-neutral-100 bg-white px-3 py-2 text-sm font-medium text-neutral-600 shadow-sm duration-300 outline-none hover:-translate-y-0.5 hover:bg-white hover:text-neutral-900">
                    Mais
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 border-neutral-100 bg-white text-neutral-700 shadow-lg"
                >
                  <DropdownMenuLabel>Mais Opções</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-neutral-100" />
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link
                      href={`/produto/${order.items[0]?.productId || ""}`}
                      className="flex w-full items-center"
                    >
                      Página do Produto
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/suporte" className="flex w-full items-center">
                      Relatar Problema
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/faq" className="flex w-full items-center">
                      Dúvidas Frequentes
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href={`/minha-conta/compras/${order.id}`}>
                <button className="flex cursor-pointer items-center justify-center gap-2.5 rounded-md border border-neutral-100 bg-white px-3 py-2 text-sm font-medium text-neutral-600 shadow-sm duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-neutral-900">
                  <CircleAlert className="h-4 w-4" /> Detalhes
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {showReviewForm && (
        <div className="w-full lg:w-[320px] xl:w-[350px]">
          <ProductReviewForm productId={order.items[0].productId} />
        </div>
      )}
    </div>
  );
}
