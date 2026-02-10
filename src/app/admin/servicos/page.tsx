import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { serviceCategory } from "@/db/schema";

import { ServicesTable } from "./services-table";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const data = await db.query.serviceCategory.findMany({
    orderBy: [desc(serviceCategory.createdAt)],
  });

  return (
    <div className="mx-auto p-2 pt-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-clash-display text-3xl font-medium text-neutral-900">
            Serviços
          </h1>
          <p className="text-neutral-500">
            Gerencie todos os serviços oferecidos na plataforma.
          </p>
        </div>
        <Link href="/admin/servicos/novo">
          <Button className="bg-neutral-800 font-medium text-white shadow-md hover:bg-neutral-900">
            <Plus className="mr-2 h-4 w-4" /> Novo Serviço
          </Button>
        </Link>
      </div>

      {/* Tabela */}
      <ServicesTable data={data} />
    </div>
  );
}
