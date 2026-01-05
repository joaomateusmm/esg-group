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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

// --- PÁGINA PRINCIPAL ---
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

      <main className="mx-auto max-w-4xl px-4 py-42 md:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="font-clash-display text-3xl font-medium text-white md:text-4xl">
            Minhas Compras
          </h1>
          <p className="text-neutral-400">
            Clique no pedido para ver os detalhes e baixar seus arquivos.
          </p>
        </div>

        {enrichedOrders.length === 0 ? (
          <Card className="border-none bg-transparent py-16 text-center">
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
                <Button className="mt-4 p-6 bg-[#D00000] text-white hover:bg-[#a00000]">
                  Explorar Loja
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {enrichedOrders.map((order) => (
              <AccordionItem
                key={order.id}
                value={order.id}
                className="overflow-hidden rounded-lg border border-white/10 bg-[#0A0A0A] px-0"
              >
                {/* CONTAINER DO CABEÇALHO */}
                <div className="flex w-full items-center justify-between bg-[#0A0A0A] pr-4 transition-colors hover:bg-white/5">
                  {/* TRIGGER (CLICÁVEL) */}
                  <AccordionTrigger className="group flex flex-1 items-center justify-between !bg-transparent px-6 py-4 hover:no-underline">
                    {/* ESQUERDA: ID e DATA */}
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs font-bold text-neutral-500">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>

                      <div className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />

                      <span className="text-sm text-neutral-400">
                        {format(new Date(order.createdAt), "dd MMM yyyy", {
                          locale: ptBR,
                        })}
                        <span className="mx-2 text-white/20">•</span>
                        {format(new Date(order.createdAt), "HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    {/* DIREITA: VALOR e STATUS */}
                    <div className="flex items-end gap-6 md:gap-[300px]">
                      <span className="font-mono text-sm font-bold text-[#D00000]">
                        {formatCurrency(order.amount)}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                  </AccordionTrigger>

                  {/* BOTÃO DE LIXEIRA (SEPARADO) */}
                  <div className="flex h-8 items-center border-l border-white/10 pl-2">
                    <DeleteOrderButton orderId={order.id} />
                  </div>
                </div>

                {/* CONTEÚDO (PRODUTOS) */}
                <AccordionContent className="border-t border-white/5 bg-[#050505]/50 px-6 py-6">
                  <div className="flex flex-col gap-6">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.id}-${index}`}
                        className="flex flex-col gap-4 sm:flex-row sm:items-center"
                      >
                        {/* Imagem */}
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5">
                          {item.currentImage ? (
                            <Image
                              src={item.currentImage}
                              alt={item.productName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-neutral-600" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div>
                            <h4 className="text-sm font-medium text-white">
                              {item.productName}
                            </h4>
                            <p className="text-xs text-neutral-400">
                              {formatCurrency(item.price)} x {item.quantity}
                            </p>
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex items-center gap-2">
                            {order.status === "paid" ? (
                              item.downloadUrl && item.downloadUrl !== "#" ? (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-8 gap-2 bg-white/10 text-xs font-medium text-white hover:bg-white/20"
                                >
                                  <a
                                    href={item.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download className="h-3 w-3" />
                                    Baixar
                                  </a>
                                </Button>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="h-8 border-neutral-800 bg-neutral-900 text-neutral-500"
                                >
                                  Indisponível
                                </Badge>
                              )
                            ) : (
                              order.infinitePayUrl && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-8 gap-2 bg-[#D00000] text-xs font-medium text-white hover:bg-[#a00000]"
                                >
                                  <a
                                    href={order.infinitePayUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Pagar Agora
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>

      <Footer />
    </div>
  );
}
