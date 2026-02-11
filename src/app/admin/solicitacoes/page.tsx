import { desc } from "drizzle-orm";

import { db } from "@/db";
import { serviceRequest } from "@/db/schema";

import { RequestsTable } from "./requests-table";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  // Busca TODAS as solicitações
  const allRequests = await db.query.serviceRequest.findMany({
    with: {
      customer: {
        // Quem pediu
        columns: {
          name: true,
          email: true,
          image: true,
        },
      },
      provider: {
        // Para quem foi pedido
        with: {
          user: {
            // Precisamos do nome do usuário do prestador
            columns: { name: true },
          },
        },
      },
      category: {
        // Qual serviço
        columns: { name: true },
      },
    },
    orderBy: [desc(serviceRequest.createdAt)],
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
