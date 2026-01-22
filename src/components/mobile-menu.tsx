"use client";

import {
  ChevronRight,
  DollarSign,
  HelpCircle,
  LayoutGrid,
  Menu,
  PackageOpen,
} from "lucide-react";
import Link from "next/link";

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
interface Category {
  label: string;
  href: string;
}

interface MobileMenuProps {
  categories: Category[];
  // Removido games e streamings daqui
  isAffiliate: boolean;
}

// Sub-componente para quando a lista está vazia
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-400">
      <PackageOpen className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}

export function MobileMenu({ categories, isAffiliate }: MobileMenuProps) {
  const { t } = useLanguage();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-800 hover:bg-neutral-100 hover:text-orange-600"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[320px] border-r-0 bg-white p-0 text-neutral-900 sm:w-[380px]"
      >
        {/* Cabeçalho do Menu */}
        <SheetHeader className="border-b border-neutral-100 bg-neutral-50/50 p-6 text-left">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 font-bold text-white">
              M
            </div>
            Menu Principal
          </SheetTitle>
        </SheetHeader>

        {/* Área de Scroll */}
        <div className="flex h-[calc(100vh-80px)] flex-col overflow-y-auto pb-10">
          <div className="flex flex-col px-6 py-6">
            {/* Seção 1: Navegação Básica */}
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-bold tracking-wider text-neutral-400 uppercase">
                Geral
              </h3>
              <Link
                href="/"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
              >
                Início
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

              <Link
                href="/faq"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
              >
                <HelpCircle className="h-4 w-4" />
                {t.header.faq}
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
