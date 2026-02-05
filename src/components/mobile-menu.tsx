"use client";

import {
  Aperture,
  ChevronRight,
  DollarSign,
  LayoutGrid,
  Menu,
  MessageCircleQuestionMark,
  PackageOpen,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getAllCategories } from "@/actions/get-all-categories";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/language-context";

// Interfaces
export interface CategoryLink {
  label: string;
  href: string;
}

interface MobileMenuProps {
  categories?: CategoryLink[];
  isAffiliate: boolean;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-400">
      <PackageOpen className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}

export function MobileMenu({
  categories: propCategories = [],
  isAffiliate,
}: MobileMenuProps) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<CategoryLink[]>(propCategories);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        if (data && data.length > 0) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Erro ao carregar categorias no menu:", error);
      }
    };

    fetchCategories();
  }, []);

  // --- SOLUÇÃO DO SCROLL ---
  // Esta função impede que o evento de scroll saia do menu e vá para o FloatingScrollbar
  const stopPropagation = (
    e: React.UIEvent | React.TouchEvent | React.WheelEvent,
  ) => {
    e.stopPropagation();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="h-10.5 w-10.5 cursor-pointer border border-neutral-200 bg-white text-neutral-800 duration-300 hover:bg-neutral-100">
          <Menu strokeWidth={2} className="h-12 w-12" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[320px] border-r-0 bg-white p-0 text-neutral-900 sm:w-[380px]"
        // Adicionamos listeners aqui também para garantir que o Sheet inteiro capture a intenção
        onWheel={stopPropagation}
        onTouchMove={stopPropagation}
      >
        {/* Cabeçalho do Menu */}
        <SheetHeader className="border-b border-neutral-100 bg-neutral-50/50 p-6 text-left">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900">
            Menu Principal
          </SheetTitle>
        </SheetHeader>
        <div
          className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-200 hover:scrollbar-thumb-neutral-300 flex h-[calc(100vh-80px)] touch-pan-y flex-col overflow-y-auto overscroll-contain pb-10"
          onWheel={stopPropagation}
          onTouchMove={stopPropagation}
          // Atributos comuns para bibliotecas de scroll suave ignorarem este elemento (ex: Lenis, Locomotive)
          data-lenis-prevent="true"
          data-scroll-lock-scrollable
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#e5e5e5 transparent",
            WebkitOverflowScrolling: "touch", // Importante para iOS ter scroll suave nativo
          }}
        >
          <div className="flex flex-col px-6 py-6">
            {/* Seção 1: Navegação Básica */}
            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-neutral-400 uppercase">
                <Aperture className="h-3 w-3" />
                Geral
              </h3>
              <Link
                href="/"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Início
                <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
              </Link>
              <Link
                href="/minha-conta"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Minha Conta
                <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
              </Link>
              <Link
                href="/minha-conta/compras"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Minhas Compras
                <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
              </Link>
              <Link
                href="/minha-conta/favoritos"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Favoritos
                <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
              </Link>
              <Link
                href="/minha-conta/carrinho"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Carrinho
                <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
              </Link>
            </div>
            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-neutral-400 uppercase">
                <MessageCircleQuestionMark className="h-3 w-3" />
                Suporte
              </h3>
              <Link
                href="/faq"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Central de Ajuda
                <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
              </Link>
              <Link
                href="/contato"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Fale Conosco
                <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
              </Link>
              <Link
                href="/avaliacoes"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Avaliações
                <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
              </Link>
              <Link
                href="/termos"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Termos de Uso
                <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
              </Link>
              <Link
                href="/privacidade"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Política de Privacidade
                <ChevronRight className="h-4 w-4 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-orange-400" />
              </Link>
            </div>

            {/* Seção 2: Categorias */}
            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-neutral-400 uppercase">
                <LayoutGrid className="h-3 w-3" /> {t.header.categories}
              </h3>

              <div className="flex flex-col gap-1">
                {categories.length > 0 ? (
                  categories.map((cat, i) => (
                    <Link
                      key={i}
                      href={cat.href || "#"}
                      className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      {cat.label}
                    </Link>
                  ))
                ) : (
                  <EmptyState label="Nenhuma categoria disponível" />
                )}
              </div>
            </div>

            <Separator className="my-2 bg-neutral-100" />

            {/* Seção 3: Links Úteis / Footer */}
            <div className="mt-4 flex flex-col gap-2">
              {isAffiliate ? (
                <Link
                  href="/afiliados/painel"
                  className="flex w-full items-center gap-3 rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100"
                >
                  <DollarSign className="h-4 w-4" />
                  {t.header.panel}
                </Link>
              ) : (
                <Link
                  href="/afiliados"
                  className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-black"
                >
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  {t.header.affiliate}
                </Link>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
