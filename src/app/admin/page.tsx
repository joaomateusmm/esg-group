import { count, eq, sql, sum } from "drizzle-orm";
import {
  Activity,
  DollarSign,
  Gamepad2,
  Layers,
  MessageSquare,
  MonitorPlay,
  Package,
  Star,
  Users,
} from "lucide-react";

import { RevenueChart } from "@/components/admin/revenue-chart";
// IMPORTANTE: Importe o novo gráfico de vendas
import { db } from "@/db";
import {
  category,
  game,
  order,
  product,
  review,
  streaming,
  user,
} from "@/db/schema";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

export default async function AdminDashboard() {
  const [
    totalRevenueRes,
    totalSalesRes,
    activeProductsRes,
    totalUsersRes,
    avgRatingRes,
    totalCategoriesRes,
    totalGamesRes,
    totalReviewsRes,
    totalStreamingsRes,
    ordersForChart,
  ] = await Promise.all([
    db
      .select({ value: sum(order.amount) })
      .from(order)
      .where(eq(order.status, "paid")),

    db.select({ count: count() }).from(order).where(eq(order.status, "paid")),

    db
      .select({ count: count() })
      .from(product)
      .where(eq(product.status, "active")),

    db.select({ count: count() }).from(user),

    db.select({ avg: sql<number>`avg(${review.rating})` }).from(review),

    db.select({ count: count() }).from(category),
    db.select({ count: count() }).from(game),
    db.select({ count: count() }).from(review),
    db.select({ count: count() }).from(streaming),

    db
      .select({ amount: order.amount, createdAt: order.createdAt })
      .from(order)
      .where(eq(order.status, "paid")),
  ]);

  const totalRevenue = totalRevenueRes[0]?.value
    ? Number(totalRevenueRes[0].value)
    : 0;
  const totalSales = totalSalesRes[0]?.count || 0;
  const activeProducts = activeProductsRes[0]?.count || 0;
  const totalUsers = totalUsersRes[0]?.count || 0;

  const rawAvg = avgRatingRes[0]?.avg || 0;
  const avgRating = Number(rawAvg).toFixed(1);

  const stats = {
    categories: totalCategoriesRes[0]?.count || 0,
    games: totalGamesRes[0]?.count || 0,
    reviews: totalReviewsRes[0]?.count || 0,
    streamings: totalStreamingsRes[0]?.count || 0,
    cartItems: 0,
    favorites: 0,
  };

  // --- LÓGICA DOS GRÁFICOS (Revenue + Sales) ---
  const dailyRevenueMap = new Map<string, number>();
  const dailySalesMap = new Map<string, number>(); // Mapa para contagem de vendas

  ordersForChart.forEach((o) => {
    const dateKey = new Date(o.createdAt).toISOString().split("T")[0];

    // Receita
    const currentRev = dailyRevenueMap.get(dateKey) || 0;
    dailyRevenueMap.set(dateKey, currentRev + o.amount / 100);

    // Vendas (Quantidade)
    const currentSales = dailySalesMap.get(dateKey) || 0;
    dailySalesMap.set(dateKey, currentSales + 1);
  });

  const revenueChartData = [];
  const salesChartData = [];
  const today = new Date();

  // Loop para preencher os últimos 95 dias (incluindo dias zerados)
  for (let i = 95; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];

    revenueChartData.push({
      date: dateKey,
      revenue: dailyRevenueMap.get(dateKey) || 0,
    });

    salesChartData.push({
      date: dateKey,
      sales: dailySalesMap.get(dateKey) || 0,
    });
  }

  return (
    <div className="space-y-8 p-8">
      {/* HEADER */}
      <div>
        <h1 className="font-clash-display text-3xl font-medium text-white">
          Dashboard
        </h1>
        <p className="text-neutral-400">
          Visão geral e métricas da sua loja em tempo real.
        </p>
      </div>

      {/* --- SEÇÃO 1: CARDS MAIORES (KPIs) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Receita */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] p-6 shadow-lg transition-all hover:border-[#D00000]/30">
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-[#D00000]/5 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Receita Total{" "}
              <span className="text-xs text-neutral-500">(valor real)</span>
            </span>
            <div className="rounded-full bg-[#D00000]/10 p-2 text-[#D00000]">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="text-xs font-medium text-green-500">
              +12% este mês
            </span>
          </div>
        </div>

        {/* Vendas */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] p-6 shadow-lg transition-all hover:border-[#D00000]/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Vendas Concluídas
            </span>
            <div className="rounded-full bg-[#D00000]/10 p-2 text-[#D00000]">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-white">{totalSales}</div>
        </div>

        {/* Produtos Ativos */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] p-6 shadow-lg transition-all hover:border-[#D00000]/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Produtos Ativos
            </span>
            <div className="rounded-full bg-[#D00000]/10 p-2 text-[#D00000]">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-white">
            {activeProducts}
          </div>
        </div>

        {/* Clientes */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] p-6 shadow-lg transition-all hover:border-[#D00000]/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Contas Criadas
            </span>
            <div className="rounded-full bg-[#D00000]/10 p-2 text-[#D00000]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-white">{totalUsers}</div>
        </div>
      </div>

      {/* --- SEÇÃO 2: CARDS MENORES (Operacional) --- */}
      <div>
        <h3 className="mb-4 text-sm font-semibold tracking-wider text-neutral-500 uppercase">
          Detalhes Operacionais
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 flex items-center gap-2 text-[#D00000]">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-xs font-bold">Média</span>
            </div>
            <span className="text-xl font-bold text-white">{avgRating}</span>
            <span className="text-[10px] text-neutral-500">Geral da loja</span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.categories}
            </span>
            <span className="text-[10px] text-neutral-500">Categorias</span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">{stats.games}</span>
            <span className="text-[10px] text-neutral-500">Jogos</span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <MonitorPlay className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.streamings}
            </span>
            <span className="text-[10px] text-neutral-500">Streamings</span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.reviews}
            </span>
            <span className="text-[10px] text-neutral-500">Reviews</span>
          </div>
        </div>
      </div>

      {/* --- SEÇÃO 3: GRÁFICOS --- */}
      <div className="flex w-full flex-col gap-5 md:flex-row">
        {/* GRÁFICO 1: RECEITA */}
        <div className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
          <RevenueChart data={revenueChartData} />
        </div>
      </div>
    </div>
  );
}
