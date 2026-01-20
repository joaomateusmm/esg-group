import { desc, eq } from "drizzle-orm";
import { Package } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

// IMPORTANTE: Importe o novo card
import { OrderCard } from "@/components/account/order-card";
import { OrderTabs } from "@/components/account/order-tabs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { order, orderItem, product } from "@/db/schema";
import { auth } from "@/lib/auth";

export default async function MyPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const currentTab = params.tab || "all";

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

  const filteredOrders = userOrders.filter((o) => {
    if (currentTab === "all") return true;
    if (currentTab === "pending")
      return o.status === "pending" || o.status === "processing";
    if (currentTab === "paid")
      return o.status === "paid" || o.status === "succeeded";
    if (currentTab === "shipped") return o.status === "shipped";
    if (currentTab === "delivered")
      return o.status === "delivered" || o.status === "completed";
    if (currentTab === "canceled")
      return o.status === "canceled" || o.status === "failed";
    return true;
  });

  const enrichedOrders = await Promise.all(
    filteredOrders.map(async (currentOrder) => {
      const items = await db
        .select()
        .from(orderItem)
        .where(eq(orderItem.orderId, currentOrder.id));

      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const productData = await db.query.product.findFirst({
            where: eq(product.id, item.productId),
            columns: {
              images: true,
              description: true,
              width: true,
              height: true,
              length: true,
              weight: true,
            },
          });
          return {
            ...item,
            currentImage: item.image || productData?.images?.[0],
            description: productData?.description,
            dimensions: {
              width: productData?.width,
              height: productData?.height,
              length: productData?.length,
              weight: productData?.weight,
            },
          };
        }),
      );

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
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-neutral-900">
      <Header />

      <div className="pt-[110px]">
        <OrderTabs />

        <main className="mx-auto max-w-5xl px-4 py-8 md:px-0">
          <div className="flex flex-col gap-4">
            {enrichedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-100 bg-white py-24 text-center shadow-sm">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
                  <Package className="h-10 w-10 text-neutral-300" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Nenhum pedido encontrado
                </h3>
                <p className="mx-auto mt-2 mb-6 max-w-xs text-neutral-500">
                  Não encontramos pedidos nesta categoria. Que tal fazer umas
                  compras?
                </p>
                <Link href="/">
                  <Button className="bg-orange-600 px-8 font-bold text-white shadow-md hover:bg-orange-700">
                    Ir para a Loja
                  </Button>
                </Link>
              </div>
            ) : (
              enrichedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
