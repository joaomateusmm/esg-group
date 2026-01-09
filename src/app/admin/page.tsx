import { count, eq, sql, sum } from "drizzle-orm";
import {
  Activity,
  Archive,
  DollarSign,
  Gamepad2,
  Heart,
  Layers,
  MessageSquare,
  MonitorPlay,
  Package,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";

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

// Função auxiliar para formatar dinheiro
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

export default async function AdminDashboard() {
  // --- 1. BUSCAR DADOS REAIS DO BANCO (PARALELO) ---
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
  ] = await Promise.all([
    // Receita Total (Soma de pedidos pagos)
    db
      .select({ value: sum(order.amount) })
      .from(order)
      .where(eq(order.status, "paid")),

    // Vendas Totais (Contagem de pedidos pagos)
    db.select({ count: count() }).from(order).where(eq(order.status, "paid")),

    // Produtos Ativos
    db
      .select({ count: count() })
      .from(product)
      .where(eq(product.status, "active")), // Assumindo status 'active' ou similar

    // Contas Criadas
    db.select({ count: count() }).from(user),

    // Média de Avaliações
    db.select({ avg: sql<number>`avg(${review.rating})` }).from(review),

    // Contagens Simples
    db.select({ count: count() }).from(category),
    db.select({ count: count() }).from(game),
    db.select({ count: count() }).from(review),
    db.select({ count: count() }).from(streaming),
  ]);

  // Processar os dados
  const totalRevenue = totalRevenueRes[0]?.value
    ? Number(totalRevenueRes[0].value)
    : 0;
  const totalSales = totalSalesRes[0]?.count || 0;
  const activeProducts = activeProductsRes[0]?.count || 0;
  const totalUsers = totalUsersRes[0]?.count || 0;

  // Média de nota (trata null se não houver reviews)
  const rawAvg = avgRatingRes[0]?.avg || 0;
  const avgRating = Number(rawAvg).toFixed(1);

  const stats = {
    categories: totalCategoriesRes[0]?.count || 0,
    games: totalGamesRes[0]?.count || 0,
    reviews: totalReviewsRes[0]?.count || 0,
    streamings: totalStreamingsRes[0]?.count || 0,
    // Mockados pois não temos tabela de carrinho/favoritos ainda
    cartItems: 0,
    favorites: 0,
  };

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
              <span className="text-xs text-neutral-500">
                {" "}
                (valor estimado)
              </span>
            </span>
            <div className="rounded-full bg-[#D00000]/10 p-2 text-[#D00000]">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {formatCurrency(totalRevenue)}
            </span>
            {/* Exemplo de indicador de crescimento (fictício) */}
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          {/* Média Avaliações */}
          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 flex items-center gap-2 text-[#D00000]">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-xs font-bold">Média</span>
            </div>
            <span className="text-xl font-bold text-white">{avgRating}</span>
            <span className="text-[10px] text-neutral-500">Geral da loja</span>
          </div>

          {/* Categorias */}
          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.categories}
            </span>
            <span className="text-[10px] text-neutral-500">Categorias</span>
          </div>

          {/* Jogos */}
          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">{stats.games}</span>
            <span className="text-[10px] text-neutral-500">Jogos</span>
          </div>

          {/* Streamings */}
          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <MonitorPlay className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.streamings}
            </span>
            <span className="text-[10px] text-neutral-500">Streamings</span>
          </div>

          {/* Total Avaliações */}
          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.reviews}
            </span>
            <span className="text-[10px] text-neutral-500">Reviews</span>
          </div>

          {/* Carrinhos (Mock) */}
          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.cartItems}
            </span>
            <span className="text-[10px] text-neutral-500">Em Carrinhos</span>
          </div>

          {/* Favoritos (Mock) */}
          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <Heart className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.favorites}
            </span>
            <span className="text-[10px] text-neutral-500">Favoritados</span>
          </div>
        </div>
      </div>

      {/* --- SEÇÃO 3: GRÁFICOS (Placeholder) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Espaço Grande para Gráfico Principal */}
        <div className="col-span-2 min-h-[400px] rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Visão Geral de Receita</h3>
            <select className="rounded bg-white/5 px-2 py-1 text-xs text-neutral-400 outline-none">
              <option>Últimos 30 dias</option>
              <option>Este Ano</option>
            </select>
          </div>
          <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5">
            <span className="flex items-center gap-2 text-sm text-neutral-500">
              <Activity className="h-4 w-4" />
              Gráfico de Linha (Receita x Tempo) virá aqui
            </span>
          </div>
        </div>

        {/* Espaço Menor para Gráfico Secundário */}
        <div className="col-span-1 min-h-[400px] rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
          <h3 className="mb-4 font-semibold text-white">
            Vendas por Categoria
          </h3>
          <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5">
            <span className="flex items-center gap-2 text-sm text-neutral-500">
              <Archive className="h-4 w-4" />
              Gráfico de Pizza/Donut virá aqui
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
