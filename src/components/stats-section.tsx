import { count, eq, sql } from "drizzle-orm";
import { Eye, ShoppingCart, Star, Users } from "lucide-react";

import { db } from "@/db";
import { order, review } from "@/db/schema";
import { cn } from "@/lib/utils";

// Função auxiliar para formatar números (ex: 3.500)
const formatNumber = (num: number) => {
  return new Intl.NumberFormat("pt-BR").format(num);
};

export async function StatsSection() {
  // 1. BUSCAR DADOS DO BANCO
  const salesResult = await db
    .select({ count: count() })
    .from(order)
    .where(eq(order.status, "paid")); // CORREÇÃO: Mudado de "completed" para "paid" (igual ao Admin)

  const reviewsResult = await db
    .select({
      avg: sql<number>`avg(${review.rating})`,
      count: count(),
    })
    .from(review);

  // 2. CÁLCULOS
  const dbSales = salesResult[0].count;
  const dbAvgRating = Number(reviewsResult[0]?.avg || 5.0);

  // Lógica: Base + Banco
  const displaySales = 3350 + dbSales;
  const displayClients = 3249 + dbSales;
  const displayViews = "15.4K";

  const stats = [
    {
      label: "Vendas realizadas",
      value: `${formatNumber(displaySales)}+`,
      icon: ShoppingCart,
      color: "text-green-500",
      bg: "bg-green-500/10",
      borderColor: "hover:border-green-500/30",
    },
    {
      label: "Clientes satisfeitos",
      value: `${formatNumber(displayClients)}+`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      borderColor: "hover:border-blue-500/30",
    },
    {
      label: "Acessos",
      value: displayViews,
      icon: Eye,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      borderColor: "hover:border-indigo-500/30",
    },
    {
      label: "Média",
      value: dbAvgRating.toFixed(1),
      icon: Star,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      borderColor: "hover:border-yellow-500/30",
    },
  ];

  return (
    <section className="w-full py-8">
      {/* Adicionei py-8 para espaçamento vertical seguro */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={cn(
              "group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] py-6 pl-6 transition-all duration-300",
              stat.borderColor,
            )}
          >
            <div className="z-10 flex flex-col gap-1">
              {/* z-10 para garantir que o texto fique sobre o blur */}
              <span className="text-2xl font-bold text-white">
                {stat.value}
              </span>
              <span className="text-sm font-medium text-neutral-400">
                {stat.label}
              </span>
            </div>

            <div
              className={cn(
                "z-10 mx-9 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                stat.bg,
                stat.color,
              )}
            >
              <stat.icon className="h-6 w-6" strokeWidth={2.5} />
            </div>

            {/* Efeito de brilho suave */}
            <div
              className={cn(
                "absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-0 blur-[50px] transition-opacity duration-500 group-hover:opacity-20",
                stat.bg,
              )}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
