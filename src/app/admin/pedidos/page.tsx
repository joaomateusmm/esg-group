import { count, desc, eq } from "drizzle-orm";

import { OrdersTable } from "@/components/admin/orders-table";
import { db } from "@/db";
import { order, user } from "@/db/schema";

type ShippingAddress = {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
};

export default async function AdminOrdersPage() {
  const orders = await db
    .select({
      id: order.id,
      status: order.status,
      amount: order.amount,
      createdAt: order.createdAt,
      trackingCode: order.trackingCode,
      shippingAddress: order.shippingAddress,

      // DADOS DO PEDIDO (PRIORIDADE 1)
      orderCustomerName: order.customerName,
      orderCustomerEmail: order.customerEmail,
      orderUserPhone: order.userPhone,

      // DADOS DA CONTA (PRIORIDADE 2 - FALLBACK)
      userId: order.userId,
      accountName: user.name,
      accountEmail: user.email,
      accountPhone: user.phoneNumber, // <--- ADICIONADO: Puxa o telefone salvo no cadastro
    })
    .from(order)
    .leftJoin(user, eq(order.userId, user.id))
    .orderBy(desc(order.createdAt));

  const [totalResult] = await db.select({ count: count() }).from(order);

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    status: o.status,
    amount: o.amount,
    createdAt: o.createdAt,
    trackingCode: o.trackingCode,
    shippingAddress: o.shippingAddress as unknown as ShippingAddress,

    // LÓGICA DE EXIBIÇÃO:

    // Nome: Pedido > Conta > Padrão
    userName: o.orderCustomerName || o.accountName || "Usuário Desconhecido",

    // Email: Pedido > Conta > Padrão
    userEmail: o.orderCustomerEmail || o.accountEmail || "Sem Email",

    // Telefone: Pedido > Conta > Nulo
    // AQUI ESTÁ A CORREÇÃO: Se não tiver no pedido, usa o da conta
    userPhone: o.orderUserPhone || o.accountPhone,

    itemsCount: 0,
  }));

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-black">
          Gerenciar Pedidos
        </h2>
      </div>

      <OrdersTable data={formattedOrders} totalOrders={totalResult.count} />
    </div>
  );
}
