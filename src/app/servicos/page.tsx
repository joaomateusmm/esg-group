import { desc, eq } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer"; // Ajuste o import conforme seu projeto
import { Header } from "@/components/Header"; // Ajuste o import conforme seu projeto
import { ServiceCard } from "@/components/service-card";
import { db } from "@/db";
import { serviceCategory } from "@/db/schema";

export const metadata: Metadata = {
  title: "Nossos Serviços | ESG Group",
  description:
    "Contrate profissionais qualificados para montagem, reparos e muito mais.",
};

// Força a página a ser dinâmica para pegar sempre os dados mais recentes
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  // Busca apenas categorias ATIVAS
  const services = await db.query.serviceCategory.findMany({
    where: eq(serviceCategory.isActive, true),
    orderBy: [desc(serviceCategory.createdAt)],
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />

      {/* Hero Section */}
      <section className="relative border-b border-neutral-200 bg-white px-4 pt-38 pb-20">
        <div className="container mx-auto max-w-6xl text-center">
          <span className="mb-4 inline-block rounded-full bg-orange-100 px-4 py-1.5 text-xs font-semibold tracking-wider text-orange-700 uppercase">
            Soluções Profissionais
          </span>
          <h1 className="font-clash-display mb-6 text-4xl font-medium tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
            Serviços para transformar <br className="hidden md:block" />
            <span className="text-orange-600">sua casa em um lar.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-500">
            Além dos melhores móveis, oferecemos mão de obra qualificada. De
            montagens a reparos, conectamos você aos melhores profissionais do
            Reino Unido.
          </p>
        </div>
      </section>

      {/* Grid de Serviços */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-7xl">
          {services.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
              ))}
            </div>
          ) : (
            // Estado Vazio (Empty State)
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-neutral-100 p-6">
                <svg
                  className="h-10 w-10 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900">
                Nenhum serviço disponível no momento
              </h3>
              <p className="mt-2 text-neutral-500">
                Estamos atualizando nosso catálogo. Volte em breve!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA para Prestadores (Opcional, mas bom para engajamento) */}
      <section className="bg-neutral-900 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Você é um profissional qualificado?
          </h2>
          <p className="mb-8 text-neutral-400">
            Junte-se à nossa plataforma e comece a receber pedidos de serviço
            hoje mesmo.
          </p>
          <Link href="/minha-conta/trabalhe-conosco">
            <button className="h-12 bg-white px-8 font-bold text-neutral-900 hover:bg-neutral-200">
              Quero ser um Parceiro
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
