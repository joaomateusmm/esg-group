import { count, desc, eq } from "drizzle-orm";

import { OrdersTable } from "@/components/admin/orders-table";
import { db } from "@/db";
import { order, user } from "@/db/schema";

// Definimos o tipo exato que o componente OrdersTable espera
type ShippingAddress = {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zipCode: string;
};

export default async function AdminOrdersPage() {
  // 1. Busca os pedidos com dados do usuário
  const orders = await db
    .select({
      id: order.id,
      status: order.status,
      amount: order.amount,
      createdAt: order.createdAt,
      trackingCode: order.trackingCode,
      shippingAddress: order.shippingAddress,
      userId: order.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(order)
    .leftJoin(user, eq(order.userId, user.id))
    .orderBy(desc(order.createdAt));

  const [totalResult] = await db.select({ count: count() }).from(order);

  // 3. Formata os dados para a tabela
  const formattedOrders = orders.map((o) => ({
    id: o.id,
    status: o.status,
    amount: o.amount,
    createdAt: o.createdAt,
    trackingCode: o.trackingCode,
    // CORREÇÃO: Cast seguro de JSON para o tipo específico via 'unknown'
    shippingAddress: o.shippingAddress as unknown as ShippingAddress,
    userName: o.userName || "Usuário Deletado",
    userEmail: o.userEmail || "Sem Email",
    itemsCount: 0,
  }));

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Gerenciar Pedidos
        </h2>
      </div>

      <OrdersTable data={formattedOrders} totalOrders={totalResult.count} />
    </div>
  );
}
