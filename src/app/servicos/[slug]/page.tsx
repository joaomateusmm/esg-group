import { and, eq } from "drizzle-orm";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link"; // Importante para o Breadcrumb
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
      eq(serviceProvider.status, "approved"),
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
    <main className="min-h-screen bg-white">
      <Header />

      {/* HERO SECTION MODERNA */}
      <div className="relative border-b border-neutral-200 bg-neutral-50/50 pt-38 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs (Navegação) */}
          <div className="mb-8 flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/" className="transition-colors hover:text-orange-600">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link
              href="/servicos"
              className="transition-colors hover:text-orange-600"
            >
              Serviços
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-neutral-800">
              {category.name}
            </span>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Coluna da Esquerda: Texto */}
            <div className="flex flex-col gap-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold tracking-wider text-orange-700 uppercase">
                <Briefcase className="h-3 w-3" />
                Serviço Profissional
              </div>

              <h1 className="font-clash-display text-4xl leading-tight font-medium text-neutral-800 md:text-5xl lg:text-6xl">
                {category.name}
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-neutral-600">
                {category.description}
              </p>

              {/* Badges de Confiança */}
              <div className="flex flex-wrap items-center gap-6 border-t border-neutral-200 pt-6 text-sm font-medium text-neutral-600">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  {providers.length}{" "}
                  {providers.length === 1
                    ? "profissional disponível"
                    : "profissionais disponíveis"}
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-neutral-400" />
                  Profissionais Verificados
                </div>
              </div>
            </div>

            {/* Coluna da Direita: Imagem Grande */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/40">
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300">
                  <Briefcase className="h-16 w-16" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Prestadores */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">
            Escolha seu profissional
          </h2>
          {/* Aqui poderia entrar filtros no futuro */}
        </div>

        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-16 text-center">
            <Clock className="mb-4 h-12 w-12 text-neutral-400" />
            <h3 className="text-lg font-medium text-neutral-900">
              Indisponível no momento
            </h3>
            <p className="mt-2 max-w-sm text-neutral-500">
              Ainda não temos parceiros cadastrados para esta categoria na sua
              região.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5"
              >
                {/* Header do Card */}
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-neutral-100 bg-neutral-50 shadow-sm">
                    {provider.user.image ? (
                      <Image
                        src={provider.user.image}
                        alt={provider.user.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-neutral-400">
                        {provider.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 transition-colors group-hover:text-orange-600">
                      {provider.user.name}
                    </h3>
                    <div className="mt-1 flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verificado
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-6 grid grid-cols-2 gap-4 border-y border-neutral-100 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-neutral-500">
                      Experiência
                    </span>
                    <div className="flex items-center gap-1.5 font-medium text-neutral-900">
                      <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                      {provider.experienceYears} anos
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-neutral-100 pl-4">
                    <span className="text-xs text-neutral-500">
                      Localização
                    </span>
                    <div className="flex items-center gap-1.5 font-medium text-neutral-900">
                      <MapPin className="h-4 w-4 text-neutral-400" />
                      {provider.location}
                    </div>
                  </div>
                </div>

                <div className="my-6 flex-1">
                  <h4 className="mb-2 text-sm font-semibold text-neutral-900">
                    Sobre o profissional
                  </h4>
                  <p className="line-clamp-3 text-sm leading-relaxed text-neutral-500">
                    {provider.bio}
                  </p>
                </div>

                {/* Botão */}
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
