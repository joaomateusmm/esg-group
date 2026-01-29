import { Calendar, Gamepad2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react"; // 1. IMPORTAR SUSPENSE

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SpotlightCard } from "@/components/spotlight-card";
import { Button } from "@/components/ui/button";

// 2. FORÇAR MODO DINÂMICO
export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#010000] selection:bg-[#D00000] selection:text-white">
      <div className="z-[100] w-full bg-[#010000]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          {/* 3. ENVOLVER HEADER COM SUSPENSE */}
          <Suspense fallback={<div className="h-20 w-full bg-[#010000]" />}>
            <Header />
          </Suspense>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-42 md:px-8">
        {/* --- HERO SECTION --- */}
        <div className="mb-20 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-[#D00000]/30 bg-[#D00000]/10 px-3 py-1 text-xs font-medium text-[#D00000]">
            Desde 2020
          </div>
          <h1 className="font-clash-display mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Elevando sua experiência <br />
            <span className="text-white">no universo FiveM</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            Somos um serviço online dedicado a fornecer as melhores ferramentas
            para o seu jogo. Qualidade, preço justo e suporte especializado.
          </p>
        </div>

        {/* --- GRID DE INFORMAÇÕES --- */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* CARD 1: O QUE FAZEMOS */}
          <SpotlightCard
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0A0A0A] p-8 lg:col-span-2"
            spotlightColor="rgba(208, 0, 0, 0.15)"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-[#D00000]">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-clash-display mb-3 text-2xl font-semibold text-white">
                Performance e Estilo
              </h3>
              <p className="leading-relaxed text-neutral-400">
                Especialistas na revenda de <strong>citizens</strong>{" "}
                otimizados,
                <strong> mods de som</strong> imersivos e{" "}
                <strong>configs</strong> de alta performance. Tudo o que você
                precisa para ter vantagem competitiva e um visual único no
                FiveM.
              </p>
            </div>
          </SpotlightCard>

          {/* CARD 2: HISTÓRIA */}
          <SpotlightCard
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0A0A0A] p-8"
            spotlightColor="rgba(255, 255, 255, 0.1)"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-white">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-clash-display mb-3 text-2xl font-semibold text-white">
                Tradição
              </h3>
              <p className="leading-relaxed text-neutral-400">
                No mercado <strong>desde 2020</strong>, construímos uma
                reputação sólida baseada no melhor preço e no melhor serviço da
                comunidade.
              </p>
            </div>
          </SpotlightCard>

          {/* CARD 3: CONTAS ROCKSTAR */}
          <SpotlightCard
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0A0A0A] p-8"
            spotlightColor="rgba(208, 0, 0, 0.15)"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-[#D00000]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-clash-display mb-3 text-2xl font-semibold text-white">
                Contas Rockstar
              </h3>
              <p className="leading-relaxed text-neutral-400">
                Disponibilidade imediata de contas para quem está começando
                agora ou para os{" "}
                <span className="text-white italic">
                  &quot;banidinhos&quot;
                </span>{" "}
                que precisam voltar ao jogo rapidamente.
              </p>
            </div>
          </SpotlightCard>

          {/* CARD 4: SUPORTE/PREÇO */}
          <SpotlightCard
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0A0A0A] p-8 lg:col-span-2"
            spotlightColor="rgba(255, 255, 255, 0.1)"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-white">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-clash-display mb-3 text-2xl font-semibold text-white">
                Entrega Flash & Melhor Preço
              </h3>
              <p className="leading-relaxed text-neutral-400">
                Sabemos que você quer jogar agora. Por isso, oferecemos o melhor
                custo-benefício do mercado com sistemas de entrega
                automatizados. Comprou, recebeu, jogou.
              </p>
            </div>
          </SpotlightCard>
        </div>

        {/* --- CTA FINAL --- */}
        <div className="mt-20 text-center">
          <h2 className="font-clash-display mb-6 text-3xl font-bold text-white">
            Pronto para o upgrade?
          </h2>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/">
              <Button className="h-12 bg-[#D00000] px-8 text-base font-bold text-white shadow-[0_0_20px_rgba(208,0,0,0.3)] hover:bg-[#a00000]">
                Ver Produtos
              </Button>
            </Link>
            <Link href="/contato">
              <Button
                variant="outline"
                className="h-12 border-white/10 bg-transparent px-8 text-white hover:bg-white/5"
              >
                Fale Conosco
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* 4. ENVOLVER FOOTER COM SUSPENSE */}
      <Suspense fallback={<div className="h-20 w-full bg-[#010000]" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
