import { desc, eq } from "drizzle-orm";
import { DollarSign, TrendingUp } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { affiliate, commission } from "@/db/schema";
import { auth } from "@/lib/auth";

export default async function AffiliateSalesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  // 1. Busca dados do afiliado e suas comissões
  const affData = await db.query.affiliate.findFirst({
    where: eq(affiliate.userId, session.user.id),
    with: {
      commissions: {
        orderBy: [desc(commission.createdAt)], // Ordena das mais recentes para as antigas
      },
    },
  });

  if (!affData) redirect("/afiliados");

  // Lista de comissões (garante array vazio se nulo)
  const commissionsList = affData.commissions || [];

  // Formatadores
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val / 100);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  // Calcula total vendido nesta página (apenas para exibição rápida se quiser)
  const totalCommissionValue = commissionsList.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  return (
    <div className="space-y-8 px-6 py-8 md:px-16">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
            <DollarSign className="h-8 w-8 text-[#D00000]" />
            Minhas Vendas
          </h1>
          <p className="text-neutral-400">
            Acompanhe o histórico detalhado de todas as suas comissões.
          </p>
        </div>

        {/* Card Resumo Rápido */}
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#191919] px-6 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-neutral-500">Comissões Totais</p>
            <p className="font-mono text-lg font-bold text-white">
              {formatCurrency(totalCommissionValue)}
            </p>
          </div>
        </div>
      </div>

      <div className="h-[1px] w-full bg-white/5" />

      {/* LISTA DE VENDAS (SEU SNIPPET AQUI) */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#191919]">
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="font-semibold text-white">Histórico de Transações</h3>
        </div>

        <div className="p-6">
          {commissionsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <DollarSign className="mb-4 h-12 w-12 text-neutral-700" />
              <p className="text-neutral-400">
                Nenhuma venda registrada ainda.
              </p>
              <p className="text-sm text-neutral-600">
                Compartilhe seus links para começar a ver resultados aqui!
              </p>
            </div>
          ) : (
            <ul className="space-y-0 divide-y divide-white/5">
              {commissionsList.map((comm) => (
                <li
                  key={comm.id}
                  className="flex flex-col gap-2 py-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-neutral-200">
                      {comm.description || "Comissão de Venda"}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {formatDate(comm.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <span className="block text-lg font-bold text-green-400">
                        + {formatCurrency(comm.amount)}
                      </span>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        comm.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : comm.status === "paid"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {comm.status === "pending"
                        ? "Pendente"
                        : comm.status === "paid"
                          ? "Pago"
                          : "Cancelado"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
