import { Mail, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react"; // 1. Importar Suspense

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SpotlightCard } from "@/components/spotlight-card";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#010000] selection:bg-[#D00000] selection:text-white">
      <div className="z-[100] w-full bg-[#010000]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          {/* 3. Envolver Header em Suspense por precaução */}
          <Suspense fallback={<div className="h-20 w-full bg-[#010000]" />}>
            <Header />
          </Suspense>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-42 md:px-8">
        {/* --- HERO SECTION --- */}
        <div className="mb-16 text-center">
          <h1 className="font-clash-display mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Fale Conosco
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-400">
            Estamos aqui para ajudar. Escolha o canal que preferir e nossa
            equipe responderá o mais rápido possível.
          </p>
        </div>

        {/* --- CARDS DE CONTATO (INDIVIDUAIS) --- */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* 1. DISCORD */}
          <SpotlightCard
            className="flex h-full flex-col items-center justify-between rounded-2xl border border-white/10 bg-[#0A0A0A] p-8 text-center transition-transform duration-300 hover:-translate-y-1"
            spotlightColor="rgba(88, 101, 242, 0.15)" // Azul do Discord bem suave
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 shadow-[0_0_30px_-10px_rgba(88,101,242,0.4)]">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>

              <div className="space-y-2">
                <h3 className="font-clash-display text-2xl font-semibold text-white">
                  Discord
                </h3>
                <p className="text-sm leading-relaxed text-neutral-400">
                  Suporte técnico, abertura de tickets e comunidade.
                </p>
              </div>
            </div>

            <div className="mt-8 w-full">
              <Link
                href="https://discord.gg/VMcbtwuT8G"
                target="_blank"
                className="w-full"
              >
                <Button className="h-12 w-full border border-white/10 bg-white/5 text-base font-medium text-white transition-all hover:border-[#5865F2] hover:bg-[#5865F2] hover:text-white hover:shadow-[0_0_20px_rgba(88,101,242,0.3)]">
                  Abrir Ticket
                </Button>
              </Link>
            </div>
          </SpotlightCard>

          {/* 2. WHATSAPP */}
          <SpotlightCard
            className="flex h-full flex-col items-center justify-between rounded-2xl border border-white/10 bg-[#0A0A0A] p-8 text-center transition-transform duration-300 hover:-translate-y-1"
            spotlightColor="rgba(37, 211, 102, 0.15)" // Verde do Zap suave
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 shadow-[0_0_30px_-10px_rgba(37,211,102,0.4)]">
                <Phone className="h-8 w-8 text-white" />
              </div>

              <div className="space-y-2">
                <h3 className="font-clash-display text-2xl font-semibold text-white">
                  WhatsApp
                </h3>
                <p className="text-sm leading-relaxed text-neutral-400">
                  Atendimento rápido e dúvidas comerciais.
                </p>
              </div>
            </div>

            <div className="mt-8 w-full">
              <Link
                href="https://wa.me/5516981325608"
                target="_blank"
                className="w-full"
              >
                <Button className="h-12 w-full border border-white/10 bg-white/5 text-base font-medium text-white transition-all hover:border-[#25D366] hover:bg-[#25D366] hover:text-white hover:shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                  Mandar Mensagem
                </Button>
              </Link>
            </div>
          </SpotlightCard>

          {/* 3. E-MAIL */}
          <SpotlightCard
            className="flex h-full flex-col items-center justify-between rounded-2xl border border-white/10 bg-[#0A0A0A] p-8 text-center transition-transform duration-300 hover:-translate-y-1"
            spotlightColor="rgba(208, 0, 0, 0.15)" // Vermelho da marca suave
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 shadow-[0_0_30px_-10px_rgba(208,0,0,0.4)]">
                <Mail className="h-8 w-8 text-white" />
              </div>

              <div className="space-y-2">
                <h3 className="font-clash-display text-2xl font-semibold text-white">
                  E-mail
                </h3>
                <p className="text-sm leading-relaxed text-neutral-400">
                  Parcerias, assuntos legais e contato geral.
                </p>
              </div>
            </div>

            <div className="mt-8 w-full">
              <div className="flex h-12 w-full items-center justify-center rounded-md border border-white/10 bg-white/5 text-base font-medium text-white hover:bg-white/5">
                silvalispo@gmail.com
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* --- FAQ TEASER --- */}
        <div className="mt-20 text-center md:p-12">
          <h2 className="font-clash-display mb-4 text-2xl font-bold text-white">
            Dúvidas frequentes?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-neutral-400">
            Antes de entrar em contato, dê uma olhada na nossa central de ajuda.
            Talvez sua resposta já esteja lá.
          </p>
          <Link href="/faq">
            <Button
              variant="outline"
              className="h-12 border-white/20 bg-transparent px-8 text-white duration-300 hover:bg-white hover:text-black"
            >
              Acessar FAQ
            </Button>
          </Link>
        </div>
      </main>

      {/* 4. Envolver Footer em Suspense também */}
      <Suspense fallback={<div className="h-20 w-full bg-[#010000]" />}>
        <Footer />
      </Suspense>
    </div>
  );
}
