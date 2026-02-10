import { and, eq } from "drizzle-orm";
import { Briefcase, CheckCircle2, Clock, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { db } from "@/db";
import { serviceCategory, serviceProvider } from "@/db/schema";

import { HireButton } from "./hire-button";

export const dynamic = "force-dynamic";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;

  // 1. Busca Categoria
  const category = await db.query.serviceCategory.findFirst({
    where: eq(serviceCategory.slug, slug),
  });

  if (!category) return notFound();

  // 2. Busca Prestadores Aprovados desta Categoria
  const providers = await db.query.serviceProvider.findMany({
    where: and(
      eq(serviceProvider.categoryId, category.id),
      eq(serviceProvider.status, "approved"), // IMPORTANTE: Só aprovados
    ),
    with: {
      user: {
        columns: {
          name: true,
          image: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />

      {/* Hero da Categoria */}
      <div className="border-b border-neutral-200 bg-white pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 md:h-40 md:w-40">
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Briefcase className="h-full w-full p-8 text-neutral-300" />
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="font-clash-display text-4xl font-bold text-neutral-900">
                {category.name}
              </h1>
              <p className="mt-2 max-w-2xl text-lg text-neutral-500">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Prestadores */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-2xl font-bold text-neutral-900">
          Profissionais Disponíveis ({providers.length})
        </h2>

        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white p-16 text-center shadow-sm">
            <Clock className="mb-4 h-12 w-12 text-neutral-300" />
            <h3 className="text-lg font-medium text-neutral-900">
              Ainda não temos profissionais nesta área.
            </h3>
            <p className="text-neutral-500">
              Estamos expandindo nossa rede. Volte em breve!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="flex flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                    {provider.user.image ? (
                      <Image
                        src={provider.user.image}
                        alt={provider.user.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-neutral-400">
                        {provider.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900">
                      {provider.user.name}
                    </h3>
                    <div className="mt-1 flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Verificado
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm text-neutral-600">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                    <span className="font-medium text-neutral-900">
                      {provider.experienceYears} anos
                    </span>{" "}
                    de experiência
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    {provider.location}
                  </div>
                </div>

                <div className="my-6 h-px w-full bg-neutral-100" />

                <div className="mb-6 flex-1">
                  <p className="line-clamp-3 text-sm leading-relaxed text-neutral-500">
                    {provider.bio}
                  </p>
                </div>

                {/* Botão Client-Side para abrir o Modal */}
                <HireButton provider={provider} categoryId={category.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
