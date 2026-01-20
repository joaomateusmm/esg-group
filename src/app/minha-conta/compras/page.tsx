import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { desc, eq } from "drizzle-orm";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DeleteOrderButton } from "@/components/delete-order-button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductReviewForm } from "@/components/product-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { order, orderItem, product } from "@/db/schema";
import { auth } from "@/lib/auth";

// --- HELPERS ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
    case "succeeded": // Status de sucesso do Stripe
      return (
        <Badge className="gap-1 border-green-800/20 bg-green-900/10 px-2 py-0.5 text-xs font-normal text-green-700 hover:bg-green-900/20">
          <CheckCircle2 className="h-3 w-3" /> Aprovado
        </Badge>
      );
    case "shipped":
      return (
        <Badge className="gap-1 border-blue-800/20 bg-blue-900/10 px-2 py-0.5 text-xs font-normal text-blue-700 hover:bg-blue-900/20">
          <Truck className="h-3 w-3" /> Enviado
        </Badge>
      );
    case "pending":
    case "processing":
      return (
        <Badge className="gap-1 border-neutral-500/20 bg-neutral-500/10 px-2 py-0.5 text-xs font-normal text-neutral-500 hover:bg-neutral-500/20">
          <Clock className="h-3 w-3" /> Pendente
        </Badge>
      );
    case "failed":
    case "canceled":
      return (
        <Badge className="gap-1 border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-normal text-red-500 hover:bg-red-500/20">
          <XCircle className="h-3 w-3" /> Cancelado
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default async function MyPurchasesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/authentication");
  }

  const userId = session.user.id;

  // 1. Busca os pedidos do usuário no banco
  const userOrders = await db.query.order.findMany({
    where: eq(order.userId, userId),
    orderBy: [desc(order.createdAt)],
  });

  // 2. Enriquece os pedidos com os itens e imagens
  const enrichedOrders = await Promise.all(
    userOrders.map(async (currentOrder) => {
      // Busca os itens deste pedido
      const items = await db
        .select()
        .from(orderItem)
        .where(eq(orderItem.orderId, currentOrder.id));

      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          // Busca a imagem atual do produto (caso tenha mudado desde a compra)
          // CORREÇÃO: Removemos 'downloadUrl' da busca pois não existe mais no schema
          const productData = await db.query.product.findFirst({
            where: eq(product.id, item.productId),
            columns: {
              images: true,
            },
          });

          return {
            ...item,
            // Prioriza a imagem salva no item (histórico), senão usa a atual
            currentImage: item.image || productData?.images?.[0],
          };
        }),
      );

      // Parse do endereço de entrega (salvo como JSON no banco)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shippingAddress = currentOrder.shippingAddress as any;

      return {
        ...currentOrder,
        items: itemsWithDetails,
        shippingAddress,
      };
    }),
  );

  return (
    <div className="min-h-screen bg-[#010000] text-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pt-40 pb-14 md:px-8">
        <div className="mb-12 flex flex-col gap-2">
          <h1 className="font-clash-display text-3xl font-medium text-white md:text-4xl">
            Minhas Compras
          </h1>
          <p className="text-neutral-400">
            Acompanhe o status de entrega e histórico de pedidos.
          </p>
        </div>

        {enrichedOrders.length === 0 ? (
          <Card className="border border-white/10 bg-white/5 py-16 text-center">
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
                <Package className="h-10 w-10 text-neutral-400" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-white">
                  Nenhum pedido encontrado
                </h3>
                <p className="text-sm text-neutral-400">
                  Você ainda não realizou nenhuma compra conosco.
                </p>
              </div>
              <Link href="/">
                <Button className="mt-4 bg-[#D00000] px-8 py-6 text-white hover:bg-[#a00000]">
                  Explorar Loja
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {enrichedOrders.map((order) => (
              <div
                key={order.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                {/* Cabeçalho do Pedido */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-neutral-500 uppercase">
                        Data do Pedido
                      </span>
                      <span className="text-sm font-medium text-white">
                        {format(
                          new Date(order.createdAt),
                          "dd 'de' MMM, yyyy",
                          { locale: ptBR },
                        )}
                      </span>
                    </div>
                    <div className="hidden h-8 w-[1px] bg-white/10 sm:block" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-neutral-500 uppercase">
                        Total
                      </span>
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(order.amount)}
                      </span>
                    </div>
                    <div className="hidden h-8 w-[1px] bg-white/10 sm:block" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-neutral-500 uppercase">
                        Pedido #
                      </span>
                      <span className="font-mono text-sm text-neutral-400">
                        {order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(order.status)}

                    {/* Botão de Rastreio (se houver código) */}
                    {order.trackingCode && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 border-white/10 bg-transparent text-xs text-white hover:bg-white/10"
                      >
                        <Truck className="h-3 w-3" />
                        Rastreio: {order.trackingCode}
                      </Button>
                    )}

                    <DeleteOrderButton orderId={order.id} />
                  </div>
                </div>

                {/* Lista de Itens do Pedido */}
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <Card
                      key={`${order.id}-${index}`}
                      className="border border-white/10 bg-[#0A0A0A]"
                    >
                      <CardContent className="p-6">
                        <div className="grid gap-8 lg:grid-cols-3">
                          {/* Coluna Esquerda: Produto e Detalhes */}
                          <div className="flex flex-col gap-6 lg:col-span-2">
                            <div className="flex flex-1 items-start gap-5">
                              {/* Imagem */}
                              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 sm:h-32 sm:w-32">
                                {item.currentImage ? (
                                  <Image
                                    src={item.currentImage}
                                    alt={item.productName}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <ShoppingBag className="h-8 w-8 text-neutral-600" />
                                  </div>
                                )}
                              </div>

                              {/* Info do Produto */}
                              <div className="flex h-full flex-1 flex-col justify-between">
                                <div>
                                  <h3 className="line-clamp-2 text-lg font-medium text-white sm:text-xl">
                                    {item.productName}
                                  </h3>
                                  <p className="mt-1 text-sm text-neutral-400">
                                    Quantidade: {item.quantity}
                                  </p>
                                  <p className="mt-1 font-medium text-[#D00000]">
                                    {formatCurrency(item.price)}
                                  </p>
                                </div>

                                {/* Endereço de Entrega Resumido */}
                                {order.shippingAddress && (
                                  <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                                    <MapPin className="h-3 w-3" />
                                    <span>
                                      Enviado para:{" "}
                                      {order.shippingAddress.street},{" "}
                                      {order.shippingAddress.number} -{" "}
                                      {order.shippingAddress.city}/
                                      {order.shippingAddress.state}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Coluna Direita: Avaliação ou Status */}
                          <div className="flex h-full flex-col justify-center border-t border-white/5 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                            {order.status === "paid" ||
                            order.status === "succeeded" ||
                            order.status === "shipped" ? (
                              <div className="h-full">
                                <ProductReviewForm productId={item.productId} />
                              </div>
                            ) : (
                              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                                <Clock className="h-8 w-8 text-neutral-600" />
                                <span className="font-medium text-neutral-400">
                                  Aguardando Pagamento
                                </span>
                                <p className="text-xs text-neutral-500">
                                  Complete o pagamento para avaliar.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
