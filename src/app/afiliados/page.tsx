import { CheckCircle2, Headset, ShieldCheck, Tags } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { auth } from "@/lib/auth";

import { AffiliateRegisterButton } from "./components/affiliate-register-button";

export default async function AffiliatePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Se não estiver logado, manda pro login
  if (!session) {
    redirect("/login?callbackUrl=/afiliados");
  }

  // Dados para os cards informativos
  const features = [
    {
      icon: ShieldCheck,
      title: "Garantia",
      description: "Entrega garantida e seu dinheiro na mão.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Headset,
      title: "Suporte",
      description: "Atendimento rápido e eficiente para afiliados.",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      icon: CheckCircle2,
      title: "Segurança",
      description: "Transações protegidas e sistema confiável.",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: Tags,
      title: "Lucros Reais",
      description: "Comissões altas e painel transparente.",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#010000]">
      {/* --- HEADER --- */}
      <div className="z-[100] w-full bg-[#010000]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          <Header />
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-4 pt-42 pb-12 md:px-8">
        {/* --- BANNER HERO --- */}
        {/* Adicionei 'flex', 'items-center' e 'min-h-[...]' para forçar a altura */}
        <div className="relative flex min-h-[500px] w-full items-center overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] lg:min-h-[600px]">
          {/* Imagem de Fundo */}
          <div className="absolute inset-0 h-full w-full">
            <Image
              src="/images/banner/banner-2.webp"
              alt="Banner Afiliados"
              fill
              className="object-cover opacity-60"
              priority // Carrega a imagem mais rápido já que é o destaque
            />
            {/* Gradiente ajustado para cobrir melhor a área maior */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>

          {/* Conteúdo do Banner */}
          <div className="relative z-10 flex flex-col items-start justify-center px-6 md:w-2/3 md:px-12 lg:w-1/2">
            <h1 className="font-clash-display text-4xl leading-tight font-bold text-white md:text-5xl lg:text-6xl">
              Programa de <br /> Afiliados
            </h1>
            <p className="mt-4 max-w-lg text-lg text-neutral-300">
              Ganhe <span className="font-bold text-[#D00000]">20% </span> de
              comissão em todas as vendas realizadas através do seu link
              exclusivo. Torne-se um afiliado hoje mesmo e comece a ganhar!
            </p>

            <div className="mt-8">
              <AffiliateRegisterButton />
            </div>
          </div>
        </div>

        {/* --- CARDS INFORMATIVOS --- */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((item, index) => (
            <div
              key={index}
              className="group flex items-start gap-4 rounded-xl border border-white/5 bg-[#0A0A0A] p-5 transition-all hover:border-white/10 hover:bg-white/5"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${item.bg}`}
              >
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <h3 className="font-medium text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- FOOTER --- */}
      <Footer />
    </div>
  );
}
