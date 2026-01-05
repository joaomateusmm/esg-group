import { Activity, DollarSign, Package, Users } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-clash-display text-3xl font-medium text-white">
          Dashboard
        </h1>
        <p className="text-neutral-400">Visão geral da sua loja.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Receita Total
            </span>
            <DollarSign className="h-4 w-4 text-[#D00000]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">R$ 0,00</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">Vendas</span>
            <Activity className="h-4 w-4 text-[#D00000]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">+0</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Produtos Ativos
            </span>
            <Package className="h-4 w-4 text-[#D00000]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">4</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Clientes
            </span>
            <Users className="h-4 w-4 text-[#D00000]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">+1</div>
        </div>
      </div>

      {/* Área Vazia para Próximos Passos */}
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-neutral-500">
        Gráficos de vendas virão aqui...
      </div>
    </div>
  );
}
