"use client";

import { ChevronLeft, Home } from "lucide-react";
import Link from "next/link";

// Removi o Header original pois ele causa conflito na geração estática de erro
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#f4f4f4]">
      {/* --- HEADER SIMPLIFICADO --- */}
      {/* Criamos um header visual apenas para o 404, sem lógica de sessão/URL */}
      <div className="z-[100] w-full border-b border-white/5 bg-white py-4 shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
          <Link href="/" className="text-xl font-bold tracking-tight">
            ESG-Group
          </Link>
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="flex w-full flex-col items-center justify-center space-y-8">
          {/* Texto Principal */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center">
              <h1 className="font-clash-display text-[150px] font-bold text-neutral-900/10 md:text-[200px]">
                404
              </h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-neutral-900 md:text-3xl">
                  Ops!
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-clash-display text-2xl font-medium text-neutral-800 md:text-3xl">
                Página não encontrada
              </h2>
              <p className="mx-auto max-w-[500px] text-neutral-600">
                Parece que você se perdeu. A página que você procurava não
                existe ou foi movida.
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/">
              <Button
                size="lg"
                className="h-12 cursor-pointer bg-orange-600 px-8 text-white shadow-sm duration-300 hover:-translate-y-1 hover:bg-orange-700"
              >
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Button>
            </Link>

            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="h-12 cursor-pointer border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Ver Produtos
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer simples */}
        <div className="absolute bottom-8 text-xs text-neutral-500">
          Erro: 404_NOT_FOUND • ESG-Group Store
        </div>
      </div>
    </div>
  );
}
