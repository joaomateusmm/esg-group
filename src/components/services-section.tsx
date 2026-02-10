import { desc, eq } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { serviceCategory } from "@/db/schema";

export async function ServicesSection() {
  // Busca os 4 serviços mais recentes ativos para exibir na Home
  const services = await db.query.serviceCategory.findMany({
    where: eq(serviceCategory.isActive, true),
    orderBy: [desc(serviceCategory.createdAt)],
    limit: 4, // Limitamos a 4 para não ficar gigante na home
  });

  // Se não tiver serviços, não renderiza a seção (ou renderiza vazia, vc decide)
  if (services.length === 0) return null;

  return (
    <section className="pb-12">
      <div className="container mx-auto px-4">
        {/* Cabeçalho da Seção (Estilo parecido com a Page de Serviços) */}
        <div className="mx-auto mb-8 w-full border-b pb-7 text-start">
          <p className="text-sm font-bold text-orange-500 uppercase">
            Nossos Serviços:
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            Todos os nossos prestadores são cadastrados e verificados pela
            equipe da ESG.{" "}
          </p>
        </div>

        {/* Grid de Cards */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        {/* Botão Ver Todos */}
        <div className="mt-12 flex justify-center">
          <Link href="/servicos">
            <Button
              variant="outline"
              className="h-12 border-neutral-300 bg-transparent px-8 text-neutral-900 transition-all hover:border-orange-200 hover:bg-white hover:text-orange-600"
            >
              Ver todos os serviços
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
