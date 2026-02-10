import { desc } from "drizzle-orm"; // Removi o 'eq' que não será usado no filtro

import { db } from "@/db";
import { serviceProvider } from "@/db/schema";

import { ProvidersTable } from "./providers-table";

export const dynamic = "force-dynamic";

export default async function AdminProvidersPage() {
  // Busca TODOS os prestadores (removido o filtro 'where')
  const allProviders = await db.query.serviceProvider.findMany({
    with: {
      user: {
        columns: {
          name: true,
          email: true,
          image: true,
        },
      },
      category: {
        columns: {
          name: true,
        },
      },
    },
    orderBy: [desc(serviceProvider.createdAt)],
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8 pt-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-clash-display text-3xl font-bold text-neutral-900">
            Gestão de Prestadores
          </h1>
          <p className="text-neutral-500">
            Gerencie as solicitações e o status dos parceiros da plataforma.
          </p>
        </div>
      </div>

      <ProvidersTable data={allProviders} />
    </div>
  );
}
