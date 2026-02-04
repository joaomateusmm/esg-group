import { eq } from "drizzle-orm";
import { Calendar, CheckCircle2, Package, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { order } from "@/db/schema";

// Função para formatar moeda
const formatPrice = (amount: number, currency: string = "GBP") => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
};

export default async function PublicOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Busca o pedido no banco (sem verificar sessão do usuário)
  const orderData = await db.query.order.findFirst({
    where: eq(order.id, id),
    with: {
      items: true,
    },
  });

  if (!orderData) {
    return notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header />

      <main className="flex-1 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Cabeçalho do Pedido */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Detalhes do Pedido
            </h1>
            <p className="text-neutral-500">
              #{orderData.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Coluna Principal: Itens */}
            <div className="space-y-6 md:col-span-2">
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-semibold text-neutral-900">
                    <Package className="h-4 w-4" /> Itens Comprados
                  </h2>
                </div>
                <div className="divide-y divide-neutral-100">
                  {orderData.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-400">
                            Sem foto
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-neutral-900">
                          {item.productName}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          Qtd: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-neutral-900">
                        {formatPrice(item.price, orderData.currency || "GBP")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna Lateral: Resumo */}
            <div className="space-y-6">
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-neutral-900">Resumo</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Status</span>
                    <span className="font-medium text-orange-600 capitalize">
                      {orderData.fulfillmentStatus === "idle"
                        ? "Aguardando"
                        : orderData.fulfillmentStatus === "processing"
                          ? "Em processamento"
                          : orderData.fulfillmentStatus}
                    </span>
                  </div>

                  <div className="flex justify-between text-neutral-600">
                    <span>Pagamento</span>
                    <span className="font-medium uppercase">
                      {orderData.paymentMethod}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-neutral-100 pt-3 font-bold text-neutral-900">
                    <span>Total</span>
                    <span>
                      {formatPrice(
                        orderData.amount,
                        orderData.currency || "GBP",
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-neutral-900">
                  <Truck className="h-4 w-4" /> Entrega
                </h3>
                <div className="text-sm text-neutral-600">
                  <p className="mb-2">
                    <span className="block font-medium text-neutral-900">
                      Endereço:
                    </span>
                    {orderData.shippingAddress
                      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        `${(orderData.shippingAddress as any).street}, ${(orderData.shippingAddress as any).number}`
                      : "Endereço não informado"}
                  </p>
                  {orderData.estimatedDeliveryStart && (
                    <p className="flex items-center gap-2 rounded-md bg-orange-50 p-2 text-xs text-orange-600">
                      <Calendar className="h-3 w-3" />
                      Previsto:{" "}
                      {new Date(
                        orderData.estimatedDeliveryStart,
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>

              <Link href="/">
                <Button variant="outline" className="w-full">
                  Voltar para a Loja
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
