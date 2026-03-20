import { and, eq } from "drizzle-orm";
import {
  Award,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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

  const category = await db.query.serviceCategory.findFirst({
    where: eq(serviceCategory.slug, slug),
  });

  if (!category) return notFound();

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

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency: "GBP",
    });
  };

  // FUNÇÃO PARA GARANTIR LINK EXTERNO
  const ensureExternalLink = (url: string) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* HERO SECTION */}
      <div className="relative border-b border-neutral-200 bg-neutral-50/50 pt-38 pb-20">
        <div className="container mx-auto px-4">
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
            <div className="flex flex-col gap-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold tracking-wider text-orange-700 uppercase">
                <Briefcase className="h-3 w-3" />
                Catálogo de Especialistas
              </div>
              <h1 className="font-clash-display text-4xl font-medium text-neutral-800 md:text-5xl lg:text-6xl">
                {category.name}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-neutral-600">
                Compare preços e experiências dos melhores profissionais de{" "}
                {category.name} verificados pela nossa curadoria.
              </p>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-neutral-200 shadow-2xl">
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-100">
                  <Briefcase className="h-16 w-16 text-neutral-300" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DE PRESTADORES */}
      <div className="container mx-auto px-4 py-10">
        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-15 text-center shadow-sm">
            <h2 className="mb-2 text-2xl font-bold text-neutral-900">
              Nenhum profissional disponível no momento
            </h2>
            <p className="mb-8 max-w-md text-neutral-500">
              Estamos expandindo nossa rede para a categoria de{" "}
              <strong>{category.name}.</strong> Por favor, verifique novamente
              mais tarde ou entre em contato com nosso atendimento para
              indicações manuais.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/servicos">
                <button className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-orange-600 px-6 font-bold text-white shadow-sm transition-colors hover:bg-orange-700 sm:w-auto">
                  Ver outros serviços
                </button>
              </Link>
            </div>
          </div>
        ) : (
          // --- LISTA NORMAL (QUANDO HÁ PROFISSIONAIS) ---
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="group relative flex flex-col rounded-3xl border border-neutral-200 bg-white p-2 transition-all duration-300 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10"
              >
                <div className="p-6">
                  {/* Header: Avatar, Nome e Preço */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-md">
                        {provider.user.image ? (
                          <Image
                            src={provider.user.image}
                            alt={provider.user.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-orange-50 text-2xl font-bold text-orange-500">
                            {provider.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-neutral-900">
                          {provider.user.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4 fill-emerald-600 text-white" />
                          <span className="text-xs font-bold tracking-wider uppercase">
                            Verificado
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-neutral-100 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
                    <span className="block text-sm font-bold text-neutral-400 uppercase">
                      A partir de:
                    </span>
                    <span className="text-lg font-bold text-orange-600">
                      {formatPrice(provider.servicePrice)}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-3 shadow-sm">
                      <div className="mb-1 flex items-center gap-2 text-neutral-500">
                        <Award className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase">
                          Experiência
                        </span>
                      </div>
                      <p className="font-bold text-neutral-900">
                        {provider.experienceYears} Anos
                      </p>
                    </div>
                    <div className="rounded-2xl p-3 shadow-sm">
                      <div className="mb-1 flex items-center gap-2 text-neutral-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase">
                          Atendimento
                        </span>
                      </div>
                      <p className="truncate font-bold text-neutral-900">
                        {provider.location}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mt-4">
                    <p className="line-clamp-3 h-[60px] text-sm leading-relaxed text-neutral-600">
                      {provider.bio}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {provider.portfolioUrl && (
                      <a
                        href={ensureExternalLink(provider.portfolioUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        VER PORTFÓLIO / REDE SOCIAL
                      </a>
                    )}

                    <div className="w-full border-t border-neutral-200/80"></div>

                    <HireButton provider={provider} categoryId={category.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center pb-10">
        <p className="flex items-center justify-center gap-1 text-sm text-neutral-600">
          <Info className="h-4 w-4 text-neutral-600" />
          Após o agendamento do serviço, o prestador irá aceitar ou recusar o
          serviço. Caso ele aceite, o próximo passo é o pagamento do serviço.
        </p>
      </div>

      <Footer />
    </main>
  );
}
