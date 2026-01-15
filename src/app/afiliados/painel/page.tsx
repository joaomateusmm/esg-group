import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { affiliate, commission, product } from "@/db/schema"; // Adicionado 'product'
import { auth } from "@/lib/auth";

import { AffiliateProductsTable } from "./components/affiliate-products-table";

interface CardProps {
  title: string;
  value: string | number;
  desc: string;
  highlight?: boolean;
  mono?: boolean;
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  // 1. Busca dados do afiliado (Saldo e Métricas)
  const affData = await db.query.affiliate.findFirst({
    where: eq(affiliate.userId, session.user.id),
    with: {
      commissions: {
        orderBy: [desc(commission.createdAt)],
        limit: 5,
      },
    },
  });

  if (!affData) redirect("/afiliados");

  // 2. Busca todos os produtos ATIVOS da loja (Para a tabela)
  const activeProducts = await db.query.product.findMany({
    where: eq(product.status, "active"),
    orderBy: [desc(product.createdAt)],
  });

  // 3. Configurações auxiliares
  const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val / 100);

  return (
    <div className="space-y-10 px-6 py-8 md:px-16">
      {/* --- SEÇÃO 1: CABEÇALHO E MÉTRICAS --- */}
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Olá, {session.user.name.split(" ")[0]}
          </h1>
          <p className="text-neutral-400">
            Aqui está o resumo dos seus ganhos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card
            title="Saldo Disponível"
            value={formatCurrency(affData.balance)}
            desc="Pronto para saque"
            highlight
          />
          <Card
            title="Total Ganho"
            value={formatCurrency(affData.totalEarnings)}
            desc="Desde o início"
          />
          <Card
            title="Seu Código"
            value={affData.code}
            desc="Use ?ref=SEUCODIGO nos links"
            mono
          />
        </div>
      </div>
      <div className="h-[1px] w-full bg-white/5" /> {/* Separador Visual */}
      {/* --- SEÇÃO 2: TABELA DE PRODUTOS --- */}
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            Gerar Links de Divulgação
          </h2>
          <p className="text-sm text-neutral-400">
            Escolha um produto abaixo, copie o link e comece a vender.
          </p>
        </div>

        {/* Componente da Tabela importado */}
        <AffiliateProductsTable
          data={activeProducts}
          affiliateCode={affData.code}
          domain={domain}
        />
      </div>
    </div>
  );
}

// Componente Card auxiliar
function Card({ title, value, desc, highlight, mono }: CardProps) {
  return (
    <div
      className={`rounded-xl border p-6 transition-colors ${
        highlight
          ? "border-transparent bg-white text-black"
          : "border-white/10 bg-[#191919] text-white hover:border-white/20"
      }`}
    >
      <h3
        className={`text-sm font-medium ${
          highlight ? "text-neutral-600" : "text-neutral-400"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-2 text-3xl font-bold ${
          mono ? "font-mono tracking-wider" : ""
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-1 text-xs ${
          highlight ? "text-neutral-500" : "text-neutral-500"
        }`}
      >
        {desc}
      </p>
    </div>
  );
}
