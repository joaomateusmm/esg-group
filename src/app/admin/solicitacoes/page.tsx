import { desc } from "drizzle-orm";

import { db } from "@/db";
import { serviceOrder } from "@/db/schema"; // <-- CORREÇÃO: Importando serviceOrder

import { RequestsTable } from "./requests-table";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  // Busca TODAS as solicitações na nova tabela serviceOrder
  const allRequests = await db.query.serviceOrder.findMany({
    with: {
      customer: {
        // ADICIONADO 'id' AQUI
        columns: { id: true, name: true, email: true, image: true },
      },
      provider: {
        // ADICIONADO 'id' e 'phone' AQUI
        columns: {
          id: true,
          phone: true,
          documentUrlFront: true,
          documentUrlBack: true,
        },
        with: {
          user: {
            // ADICIONADO 'id' e 'email' AQUI
            columns: { id: true, name: true, email: true, image: true },
          },
        },
      },
      category: {
        columns: { name: true },
      },
    },
    orderBy: [desc(serviceOrder.createdAt)],
  });

  return (
    <div className="mx-auto space-y-8 p-4 pt-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-clash-display text-3xl font-medium text-neutral-800">
            Solicitações de Serviço
          </h1>
          <p className="text-neutral-500">
            Visão geral de todos os pedidos feitos na plataforma.
          </p>
        </div>
      </div>

      <RequestsTable data={allRequests} />
    </div>
  );
}
