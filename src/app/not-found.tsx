"use client";

import { ChevronLeft, Home } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react"; // 1. IMPORTAR SUSPENSE

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#f4f4f4]">
      {/* --- HEADER --- */}
      <div className="z-[100] w-full border-b border-white/5 bg-transparent">
        <div className="mx-auto flex w-full items-center justify-center">
          {/* 2. ENVOLVER HEADER COM SUSPENSE */}
          <Suspense fallback={<div className="h-20 w-full" />}>
            <Header />
          </Suspense>
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        {/* Glow sutil atrás do 404 */}

        <div className="flex w-full flex-col items-center justify-center space-y-8">
          {/* Texto Principal */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <h1 className="font-clash-display text-[200px] font-bold">404</h1>
            </div>

            <div className="space-y-2 py-6">
              <h2 className="font-clash-display text-3xl font-medium text-neutral-800 md:text-4xl">
                Página não encontrada
              </h2>
              <p className="mx-auto max-w-[600px] text-neutral-600 md:text-lg">
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
                className="h-12 cursor-pointer bg-orange-500 px-8 text-white shadow-sm duration-300 hover:-translate-y-1 hover:bg-orange-500"
              >
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Button>
            </Link>

            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="h-12 cursor-pointer bg-neutral-800 text-white shadow-sm duration-300 hover:-translate-y-1 hover:bg-neutral-700 hover:text-white"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Ver Produtos
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer simples */}
        <div className="absolute bottom-8 text-xs text-neutral-600">
          Erro: 404_NOT_FOUND • ESG-Group Store
        </div>
      </div>
    </div>
  );
}
