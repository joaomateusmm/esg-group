import { count, desc, eq, ilike, or } from "drizzle-orm";

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

// Receives searchParams from the page props
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = Number(searchParams.page) || 1;
  const limitParam = searchParams.limit ?? "10";
  const limit = limitParam === "all" ? undefined : Number(limitParam);
  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;

  // offset calculation for pagination
  const offset = limit && page > 1 ? (page - 1) * limit : 0;

  // 1. Build the base query
  const baseQuery = db
    .selectDistinctOn([order.id], {
      id: order.id,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      paymentMethod: order.paymentMethod,
      amount: order.amount,
      createdAt: order.createdAt,
      trackingCode: order.trackingCode,
      shippingAddress: order.shippingAddress,
      productImages: product.images,
      productId: product.id,
      orderCustomerName: order.customerName,
      orderCustomerEmail: order.customerEmail,
      orderUserPhone: order.userPhone,
      userId: order.userId,
      accountName: user.name,
      accountEmail: user.email,
      accountPhone: user.phoneNumber,
    })
    .from(order)
    .leftJoin(user, eq(order.userId, user.id))
    .leftJoin(orderItem, eq(order.id, orderItem.orderId))
    .leftJoin(product, eq(orderItem.productId, product.id))
    .orderBy(order.id, desc(order.createdAt));

  // 2. Apply search filter if present (CORREÇÃO ESLINT + FUNCIONALIDADE)
  if (search) {
    baseQuery.where(
      or(
        // Busca por ID do pedido
        ilike(order.id, `%${search}%`),
        // Busca por nome do cliente (conta ou checkout)
        ilike(order.customerName, `%${search}%`),
        ilike(user.name, `%${search}%`),
        // Busca por email
        ilike(order.customerEmail, `%${search}%`),
        ilike(user.email, `%${search}%`),
      ),
    );
  }

  // 3. Execute Query with Pagination (CORREÇÃO TYPESCRIPT)
  // Ao invés de reatribuir 'baseQuery', aplicamos o limit/offset na execução.
  const orders = limit
    ? await baseQuery.limit(limit).offset(offset)
    : await baseQuery;

  // Get total count for pagination (Considerar filtro de busca se necessário,
  // mas count simples é mais rápido para UI geral)
  const [totalResult] = await db.select({ count: count() }).from(order);

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    status: o.status,
    fulfillmentStatus: o.fulfillmentStatus,
    paymentMethod: o.paymentMethod,
    amount: o.amount,
    createdAt: o.createdAt,
    trackingCode: o.trackingCode,
    shippingAddress: o.shippingAddress as unknown as ShippingAddress,
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
          Gerencie todos os pedidos da sua loja.
        </p>
      </div>

      <OrdersTable
        data={formattedOrders}
        totalOrders={totalResult.count}
        limitParam={limitParam as string}
      />
    </div>
  );
}
