import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  MapPin,
  Package,
  Ticket, // Importando ícone do cupom
  Truck,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { order, product } from "@/db/schema";
import { auth } from "@/lib/auth";

// --- INTERFACES PARA TIPAGEM SEGURA ---
interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zipCode: string;
}

// Função auxiliar para formatar moeda
const formatCurrency = (value: number, currency: string = "BRL") => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
  }).format(value / 100);
};

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Aguarda os parâmetros da URL
  const { id: orderId } = await params;

  // 2. Verifica autenticação
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/authentication");
  }

  // 3. Busca o pedido no banco
  const orderData = await db.query.order.findFirst({
    where: eq(order.id, orderId),
    with: {
      items: true,
    },
  });

  // 4. Validação
  if (!orderData || orderData.userId !== session.user.id) {
    notFound();
  }

  const shippingAddress =
    orderData.shippingAddress as unknown as ShippingAddress | null;

  const currency = (orderData.currency as string) || "BRL";

  // 5. Enriquecer os itens
  const enrichedItems = await Promise.all(
    orderData.items.map(async (item) => {
      const productData = await db.query.product.findFirst({
        where: eq(product.id, item.productId),
        columns: {
          images: true,
          description: true,
        },
      });
      return {
        ...item,
        currentImage: item.image || productData?.images?.[0],
        description: productData?.description,
      };
    }),
  );

  // Lógica de Datas
  let deliveryStart = orderData.estimatedDeliveryStart;
  let deliveryEnd = orderData.estimatedDeliveryEnd;

  if (!deliveryStart || !deliveryEnd) {
    const created = new Date(orderData.createdAt);
    deliveryStart = new Date(created);
    deliveryStart.setDate(created.getDate() + 10);
    deliveryEnd = new Date(created);
    deliveryEnd.setDate(created.getDate() + 17);
  }

  const deliveryRange = `${format(deliveryStart, "dd/MM", { locale: ptBR })} a ${format(deliveryEnd, "dd/MM", { locale: ptBR })}`;

  // --- CORREÇÃO DOS CÁLCULOS ---
  // 1. O Subtotal deve ser a soma dos itens, independente do cupom/frete
  const itemsSubtotal = enrichedItems.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  // 2. O total final é o que está salvo no banco em orderData.amount
  // Não precisamos somar frete novamente.

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-neutral-900">
      <Header />

      <div className="pt-[130px] pb-20">
        <main className="mx-auto max-w-4xl px-4 md:px-0">
          <div className="mb-2 -ml-3">
            <Link href="/minha-conta/compras">
              <Button
                variant="ghost"
                className="hover:bg-transparent hover:text-orange-600"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Meus Pedidos
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            {/* Cabeçalho */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  Pedido #{orderData.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="text-sm text-neutral-500">
                  Realizado em{" "}
                  {format(
                    orderData.createdAt,
                    "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                    { locale: ptBR },
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {orderData.fulfillmentStatus === "delivered" ? (
                  <Badge className="bg-green-600 text-white hover:bg-green-700">
                    Entregue
                  </Badge>
                ) : orderData.fulfillmentStatus === "shipped" ? (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                    Enviado
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-neutral-200 text-neutral-700"
                  >
                    Em Processamento
                  </Badge>
                )}
              </div>
            </div>

            {/* Card Status */}
            <Card className="border-none bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">
                      Status da Entrega
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {orderData.fulfillmentStatus === "processing" &&
                        "Seu pedido está sendo preparado."}
                      {orderData.fulfillmentStatus === "shipped" &&
                        "Seu pedido está a caminho."}
                      {orderData.fulfillmentStatus === "delivered" &&
                        "Pedido entregue com sucesso."}
                      {orderData.fulfillmentStatus === "idle" &&
                        "Aguardando confirmação."}
                    </p>
                    {orderData.trackingCode && (
                      <p className="mt-1 font-mono text-xs text-neutral-500">
                        Rastreio:{" "}
                        <span className="font-bold text-neutral-800 select-all">
                          {orderData.trackingCode}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="hidden h-auto w-px bg-neutral-100 md:block" />

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">
                      Previsão de Entrega
                    </h3>
                    <p className="text-sm font-medium text-green-700">
                      {deliveryRange}
                    </p>
                    <p className="max-w-[200px] text-xs text-neutral-500">
                      O prazo pode variar de acordo com a transportadora.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Itens */}
              <Card className="border-none bg-white p-6 shadow-sm md:col-span-2">
                <h2 className="mb-4 text-lg font-bold text-neutral-900">
                  Itens do Pedido
                </h2>
                <div className="flex flex-col gap-6">
                  {enrichedItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-4 border-b border-neutral-100 pb-6 last:border-0 last:pb-0"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                        {item.currentImage ? (
                          <Image
                            src={item.currentImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-neutral-300">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <Link
                            href={`/produto/${item.productId}`}
                            className="hover:underline"
                          >
                            <h3 className="line-clamp-2 font-medium text-neutral-900">
                              {item.productName}
                            </h3>
                          </Link>
                          <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
                            {item.description}
                          </p>
                        </div>
                        <div className="mt-2 flex items-end justify-between">
                          <span className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-500">
                            Qtd: {item.quantity}
                          </span>
                          <span className="font-bold text-neutral-900">
                            {formatCurrency(item.price, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Resumo e Endereço */}
              <div className="flex flex-col gap-6">
                <Card className="border-none bg-white p-4 shadow-sm">
                  <div className="-mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <h2 className="font-bold text-neutral-900">
                      Endereço de Entrega:
                    </h2>
                  </div>
                  {shippingAddress ? (
                    <div className="text-sm leading-relaxed text-neutral-600">
                      <p>
                        {shippingAddress.street}, {shippingAddress.number}
                      </p>
                      {shippingAddress.complement && (
                        <p>{shippingAddress.complement}</p>
                      )}
                      <p>
                        {shippingAddress.city} - {shippingAddress.state}
                      </p>
                      <p className="mt-1 font-medium text-neutral-900">
                        CEP: {shippingAddress.zipCode}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">
                      Endereço não informado.
                    </p>
                  )}
                </Card>

                {/* Resumo Financeiro */}
                <Card className="border-none bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                    <h2 className="font-bold text-neutral-900">Resumo</h2>
                  </div>

                  <div className="space-y-3 text-sm">
                    {/* Subtotal real (soma dos itens) */}
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(itemsSubtotal, currency)}</span>
                    </div>

                    {/* Frete */}
                    <div className="flex justify-between text-neutral-600">
                      <span>Frete</span>
                      <span>
                        {orderData.shippingCost
                          ? formatCurrency(orderData.shippingCost, currency)
                          : "Grátis"}
                      </span>
                    </div>

                    {/* Desconto (Exibição Condicional) */}
                    {orderData.discountAmount &&
                      orderData.discountAmount > 0 && (
                        <div className="flex justify-between font-medium text-green-600">
                          <span className="flex items-center gap-1">
                            <Ticket className="h-3.5 w-3.5" />
                            Desconto
                          </span>
                          <span>
                            -{" "}
                            {formatCurrency(orderData.discountAmount, currency)}
                          </span>
                        </div>
                      )}

                    <Separator />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-lg font-bold text-neutral-900">
                        Total
                      </span>
                      <span className="text-xl font-bold text-orange-600">
                        {/* AQUI ESTAVA O ERRO:
                           Antigo: orderData.amount + shippingCost (somava frete 2x)
                           Novo: orderData.amount (Valor final exato do banco)
                        */}
                        {formatCurrency(orderData.amount, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    {orderData.status === "pending" &&
                    orderData.paymentMethod !== "cod" ? (
                      <Link href="/checkout" className="w-full">
                        <Button className="w-full bg-orange-600 font-bold hover:bg-orange-700">
                          Finalizar Pagamento
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                      >
                        Pedir Novamente
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
