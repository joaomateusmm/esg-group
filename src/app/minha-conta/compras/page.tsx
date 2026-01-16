import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { desc, eq } from "drizzle-orm";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DeleteOrderButton } from "@/components/delete-order-button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
// Importamos o FORMULÁRIO diretamente
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
    case "completed":
      return (
        <Badge className="gap-1 border-green-800/20 bg-green-900/10 px-2 py-0.5 text-xs font-normal text-green-700 hover:bg-green-900/20">
          <CheckCircle2 className="h-3 w-3" /> Aprovado
        </Badge>
      );
    case "pending":
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

  const userOrders = await db.query.order.findMany({
    where: eq(order.userId, userId),
    orderBy: [desc(order.createdAt)],
  });

  const enrichedOrders = await Promise.all(
    userOrders.map(async (currentOrder) => {
      const items = await db
        .select()
        .from(orderItem)
        .where(eq(orderItem.orderId, currentOrder.id));

      const itemsWithDownload = await Promise.all(
        items.map(async (item) => {
          const productData = await db.query.product.findFirst({
            where: eq(product.id, item.productId),
            columns: {
              downloadUrl: true,
              images: true,
            },
          });

          return {
            ...item,
            downloadUrl: productData?.downloadUrl || null,
            currentImage: productData?.images?.[0] || item.image,
          };
        }),
      );

      return {
        ...currentOrder,
        items: itemsWithDownload,
      };
    }),
  );

  return (
    <div className="min-h-screen bg-[#010000]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-42 md:px-8">
        <div className="mb-12 flex flex-col gap-2">
          <h1 className="font-clash-display text-3xl font-medium text-white md:text-4xl">
            Minhas Compras
          </h1>
          <p className="text-neutral-400">
            Gerencie seus pedidos, baixe seus arquivos e avalie os produtos.
          </p>
        </div>

        {enrichedOrders.length === 0 ? (
          <Card className="border-white/10 bg-transparent py-16 text-center">
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                <Package className="h-10 w-10 text-neutral-600" />
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
                <Button className="mt-4 bg-[#D00000] p-6 text-white hover:bg-[#a00000]">
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
                {/* Cabeçalho do Pedido (Data e ID) */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-neutral-500">
                        Data do Pedido
                      </span>
                      <span className="text-sm font-medium text-white">
                        {format(
                          new Date(order.createdAt),
                          "dd 'de' MMMM, yyyy",
                          { locale: ptBR },
                        )}
                        <span className="mx-2 text-white/30">•</span>
                        {format(new Date(order.createdAt), "HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div className="hidden h-8 w-[1px] bg-white/10 sm:block" />
                    <div className="flex flex-col">
                      <span className="text-xs text-neutral-500">
                        ID do Pedido
                      </span>
                      <span className="font-mono text-sm text-neutral-300">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(order.status)}
                    <DeleteOrderButton orderId={order.id} />
                  </div>
                </div>

                {/* Lista de Itens do Pedido */}
                <div className="space-y-6">
                  {order.items.map((item, index) => (
                    <Card
                      key={`${order.id}-${index}`}
                      className="border-white/10 bg-[#0A0A0A]"
                    >
                      <CardContent>
                        {/* AQUI MUDOU: 
                           Grid direto dentro do CardContent para aninhar a avaliação
                        */}
                        <div className="grid gap-8 lg:grid-cols-3">
                          {/* Coluna da Esquerda: Produto e Detalhes (Ocupa 2/3) */}
                          <div className="flex flex-col gap-6 lg:col-span-2">
                            <div className="flex flex-1 items-center justify-center gap-5">
                              {/* Imagem do Produto */}
                              <div className="relative h-24 w-35 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 sm:h-32 sm:w-48">
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

                              {/* Informações */}
                              <div className="flex flex-1 flex-col justify-between">
                                <div>
                                  <h3 className="font-clash-display text-lg font-medium text-white sm:text-xl">
                                    {item.productName}
                                  </h3>
                                  <p className="mt-1 text-sm text-neutral-400">
                                    {formatCurrency(item.price)} x{" "}
                                    {item.quantity} un.
                                  </p>

                                  {/* Botões de Ação (Download/Pagar) */}
                                  <div className="mt-4">
                                    {order.status === "paid" ||
                                    order.status === "completed" ? (
                                      item.downloadUrl &&
                                      item.downloadUrl !== "#" ? (
                                        <Button
                                          asChild
                                          className="gap-2 bg-white/10 text-white duration-300 hover:scale-105 hover:bg-white/20 active:scale-95"
                                        >
                                          <a
                                            href={item.downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <Download className="h-4 w-4" />
                                            Baixar Arquivos
                                          </a>
                                        </Button>
                                      ) : (
                                        <Badge
                                          variant="secondary"
                                          className="h-9 border-neutral-800 bg-neutral-900 px-4 text-neutral-500"
                                        >
                                          Download Indisponível
                                        </Badge>
                                      )
                                    ) : (
                                      order.infinitePayUrl && (
                                        <Button
                                          asChild
                                          className="gap-2 bg-[#D00000] text-white hover:bg-[#a00000]"
                                        >
                                          <a
                                            href={order.infinitePayUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            Realizar Pagamento
                                            <ExternalLink className="h-4 w-4" />
                                          </a>
                                        </Button>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Coluna da Direita: Avaliação (Ocupa 1/3) */}
                          <div className="flex h-full flex-col justify-center border-t border-white/5 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                            {order.status === "paid" ||
                            order.status === "completed" ? (
                              <div className="h-full">
                                <ProductReviewForm productId={item.productId} />
                              </div>
                            ) : (
                              // Placeholder se não estiver pago ainda
                              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                                <span className="font-medium text-neutral-400">
                                  Pagamento Pendente
                                </span>
                                <p className="text-xs text-neutral-500">
                                  Complete o pagamento para avaliar este
                                  produto.
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
