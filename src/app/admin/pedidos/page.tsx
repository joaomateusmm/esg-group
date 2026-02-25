/* eslint-disable @typescript-eslint/no-explicit-any */
import { count, desc, eq, ilike, inArray, or } from "drizzle-orm";

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

// CORREÇÃO NEXT.JS 15: searchParams agora é uma Promise
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. AWAIT NOS PARÂMETROS
  const params = await searchParams;

  // 2. USAR A VARIÁVEL 'params' AO INVÉS DE 'searchParams'
  const page = Number(params.page) || 1;
  const limitParam = (params.limit as string) ?? "10";
  const limit = limitParam === "all" ? undefined : Number(limitParam);
  const search = typeof params.search === "string" ? params.search : undefined;

  // offset calculation for pagination
  const offset = limit && page > 1 ? (page - 1) * limit : 0;

  // --- PASSO 1: Buscar apenas os IDs dos pedidos (para a paginação e busca funcionarem corretamente) ---
  const idsQuery = db
    .select({ id: order.id })
    .from(order)
    .leftJoin(user, eq(order.userId, user.id))
    .$dynamic();

  if (search) {
    idsQuery.where(
      or(
        ilike(order.id, `%${search}%`),
        ilike(order.customerName, `%${search}%`),
        ilike(user.name, `%${search}%`),
        ilike(order.customerEmail, `%${search}%`),
        ilike(user.email, `%${search}%`),
      ),
    );
  }

  // Aplica paginação aos IDs
  const paginatedIdsQuery = limit
    ? idsQuery.orderBy(desc(order.createdAt)).limit(limit).offset(offset)
    : idsQuery.orderBy(desc(order.createdAt));

  const idsResult = await paginatedIdsQuery;
  const orderIds = idsResult.map((r) => r.id);

  // --- PASSO 2: Buscar os pedidos COMPLETOS (com itens e usuário) usando a API Relacional ---
  let fullOrders: any[] = [];
  if (orderIds.length > 0) {
    fullOrders = await db.query.order.findMany({
      where: inArray(order.id, orderIds),
      with: {
        user: true, // Puxa os dados do usuário cadastrado
        items: {
          with: {
            product: true, // Puxa as dimensões, descrição e fotos do produto
          },
        },
      },
      orderBy: [desc(order.createdAt)],
    });
  }

  // --- PASSO 3: Corrigir o total do contador para respeitar a pesquisa (paginação correta) ---
  const countQuery = db
    .select({ count: count() })
    .from(order)
    .leftJoin(user, eq(order.userId, user.id))
    .$dynamic();

  if (search) {
    countQuery.where(
      or(
        ilike(order.id, `%${search}%`),
        ilike(order.customerName, `%${search}%`),
        ilike(user.name, `%${search}%`),
        ilike(order.customerEmail, `%${search}%`),
        ilike(user.email, `%${search}%`),
      ),
    );
  }
  const [totalResult] = await countQuery;

  // --- PASSO 4: Formatar os dados para a Tabela e para o Card ---
  const formattedOrders = fullOrders.map((o) => {
    // Formata o array de itens para que o OrderCard entenda
    const formattedItems = o.items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      image: item.image || item.product?.images?.[0] || null,
      currentImage: item.image || item.product?.images?.[0] || null,
      quantity: item.quantity,
      price: item.price,
      description: item.product?.description || null,
      dimensions: {
        weight: item.product?.weight || null,
        width: item.product?.width || null,
        height: item.product?.height || null,
        length: item.product?.length || null,
      },
    }));

    return {
      // Dados Básicos do Pedido
      id: o.id,
      status: o.status,
      fulfillmentStatus: o.fulfillmentStatus,
      paymentMethod: o.paymentMethod,
      amount: o.amount,
      shippingCost: o.shippingCost,
      discountAmount: o.discountAmount,
      couponId: o.couponId,
      currency: o.currency,
      createdAt: o.createdAt,
      trackingCode: o.trackingCode,
      estimatedDeliveryStart: o.estimatedDeliveryStart,
      estimatedDeliveryEnd: o.estimatedDeliveryEnd,
      shippingAddress: o.shippingAddress as unknown as ShippingAddress,

      // Dados para a linha da Tabela (Mostra só o primeiro produto como resumo)
      productImage: formattedItems[0]?.image || null,
      productId: formattedItems[0]?.productId || null,
      userName: o.customerName || o.user?.name || "Usuário Desconhecido",
      userEmail: o.customerEmail || o.user?.email || "Sem Email",
      userPhone: o.userPhone || o.user?.phoneNumber || null,
      itemsCount: o.items.length,

      // O mais importante: Os itens repassados ao Modal!
      items: formattedItems,
    };
  });

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
