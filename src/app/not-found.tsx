"use client";

import { ChevronLeft, Home } from "lucide-react";
import Link from "next/link";

import GradientText from "@/components/GradientText";
import { Header } from "@/components/Header";
import Silk from "@/components/Silk";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#010000]">
      {/* --- BACKGROUND SILK --- */}
      <div className="absolute inset-0 z-0">
        <Silk
          speed={12}
          scale={1}
          color="#190000"
          noiseIntensity={0.8}
          rotation={0}
        />
      </div>

      {/* --- HEADER --- */}
      <div className="z-[100] w-full border-b border-white/5 bg-transparent">
        <div className="mx-auto flex w-full items-center justify-center">
          <Header />
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        {/* Glow sutil atrás do 404 */}

        <div className="flex w-full flex-col items-center justify-center space-y-8">
          {/* Texto Principal */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <GradientText
                animationSpeed={5.5}
                pauseOnHover
                yoyo={false}
                className="font-clash-display text-[200px] font-bold"
                colors={["#780000", "#1C0000", "#a00000"]}
              >
                404
              </GradientText>
            </div>

            <div className="space-y-2 py-6">
              <h2 className="font-clash-display text-3xl font-medium text-white md:text-4xl">
                Página não encontrada
              </h2>
              <p className="mx-auto max-w-[600px] text-neutral-400 md:text-lg">
                Parece que você se perdeu no mapa. A página que você procurava
                não existe ou foi movida.
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/">
              <Button
                size="lg"
                className="h-12 bg-[#D00000] px-8 text-white shadow-[0_0_20px_rgba(208,0,0,0.3)] hover:bg-[#a00000]"
              >
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Button>
            </Link>

            <Link href="/catalog">
              <Button
                variant="outline"
                size="lg"
                className="h-12 border-white/10 bg-transparent text-white hover:bg-white/5"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Ver Produtos
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer simples */}
        <div className="absolute bottom-8 text-xs text-neutral-600">
          Erro: 404_NOT_FOUND • SubMind Store
        </div>
      </div>
    </div>
  );
}
