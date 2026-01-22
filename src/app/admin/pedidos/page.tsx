import { count, desc, eq } from "drizzle-orm";

import { OrdersTable } from "@/components/admin/orders-table";
import { db } from "@/db";
import { order, orderItem, product, user } from "@/db/schema";

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
  // CORREÇÃO: Usamos 'selectDistinctOn' logo no início
  const orders = await db
    .selectDistinctOn([order.id], {
      id: order.id,
      status: order.status,
      amount: order.amount,
      createdAt: order.createdAt,
      trackingCode: order.trackingCode,
      shippingAddress: order.shippingAddress,

      // --- DADOS DO PRODUTO ---
      productImages: product.images,
      productId: product.id,

      // DADOS DO PEDIDO
      orderCustomerName: order.customerName,
      orderCustomerEmail: order.customerEmail,
      orderUserPhone: order.userPhone,

      // DADOS DA CONTA
      userId: order.userId,
      accountName: user.name,
      accountEmail: user.email,
      accountPhone: user.phoneNumber,
    })
    .from(order)
    .leftJoin(user, eq(order.userId, user.id))
    .leftJoin(orderItem, eq(order.id, orderItem.orderId))
    .leftJoin(product, eq(orderItem.productId, product.id))
    // NOTA: O 'distinctOn' foi removido daqui de baixo e movido para o topo.
    // O PostgreSQL EXIGE que a primeira ordenação seja a mesma do distinctOn (order.id)
    .orderBy(order.id, desc(order.createdAt));

  const [totalResult] = await db.select({ count: count() }).from(order);

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    status: o.status,
    amount: o.amount,
    createdAt: o.createdAt,
    trackingCode: o.trackingCode,
    shippingAddress: o.shippingAddress as unknown as ShippingAddress,

    // Lógica para definir a imagem e ID
    productImage:
      o.productImages && o.productImages.length > 0 ? o.productImages[0] : null,
    productId: o.productId || null,

    userName: o.orderCustomerName || o.accountName || "Usuário Desconhecido",
    userEmail: o.orderCustomerEmail || o.accountEmail || "Sem Email",
    userPhone: o.orderUserPhone || o.accountPhone,

    itemsCount: 0,
  }));

  return (
    <div className="flex-1 space-y-8 px-2 pt-6">
      <div>
        <h1 className="font-clash-display text-3xl font-medium text-black">
          Meus Pedidos
        </h1>
        <p className="text-sm text-neutral-700">
          Gerencie o todos os pedidos da sua loja.
        </p>
      </div>

      <OrdersTable
        data={formattedOrders}
        totalOrders={totalResult.count}
        limitParam={""}
      />
    </div>
  );
}
