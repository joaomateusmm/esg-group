"use client";

import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// IMPORTAMOS A ACTION PARA BUSCAR CATEGORIAS
import { getAllCategories } from "@/actions/get-all-categories";
import Silk from "@/components/Silk";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// --- TIPOS ---
type CategoryItem = {
  label: string;
  href: string;
};

// --- SUB-COMPONENTES ---

function FooterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-clash-display text-lg font-medium text-white">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-neutral-400 transition-colors hover:text-[#D00000] hover:underline"
    >
      {children}
    </Link>
  );
}

// --- COMPONENTE PRINCIPAL ---

export function Footer() {
  const currentYear = new Date().getFullYear();
  // Estado para armazenar as categorias dinâmicas
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    // Busca as categorias ao montar o componente
    getAllCategories().then((data) => {
      setCategories(data);
    });
  }, []);

  return (
    <footer className="relative w-full overflow-hidden bg-[#050505] pt-16 pb-8">
      {/* --- BACKGROUND SILK --- */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-50">
        <Silk
          speed={12}
          scale={1}
          color="#2d0000"
          noiseIntensity={0.8}
          rotation={0}
        />
      </div>

      {/* --- GRADIENTE DE TRANSIÇÃO SUAVE (TOP) --- */}
      <div className="pointer-events-none absolute top-0 left-0 z-10 h-52 w-full bg-gradient-to-b from-[#000000] to-transparent" />

      {/* --- CONTEÚDO (Z-INDEX MAIOR) --- */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 md:px-8">
        {/* --- GRADE PRINCIPAL --- */}
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* COLUNA 1: IDENTIDADE */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                <Image
                  src="/images/icons/logo.png"
                  alt="Logo Sub Mind"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-clash-display text-2xl font-semibold text-white">
                SubMind
              </span>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-neutral-400">
              A melhor loja de produtos digitais para gamers. Configurações
              otimizadas, contas premium e suporte especializado para elevar sua
              experiência.
            </p>

            <div className="flex gap-4">
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full border-white/10 bg-white/5 text-neutral-400 transition-all hover:border-[#D00000] hover:bg-[#D00000] hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full border-white/10 bg-white/5 text-neutral-400 transition-all hover:border-[#D00000] hover:bg-[#D00000] hover:text-white"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full border-white/10 bg-white/5 text-neutral-400 transition-all hover:border-[#D00000] hover:bg-[#D00000] hover:text-white"
              >
                <Youtube className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full border-white/10 bg-white/5 text-neutral-400 transition-all hover:border-[#D00000] hover:bg-[#D00000] hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* COLUNA 2, 3, 4: LINKS */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:pl-12">
            <FooterSection title="Categorias">
              {/* RENDERIZAÇÃO DINÂMICA DAS CATEGORIAS */}
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <FooterLink key={cat.href} href={cat.href}>
                    {cat.label}
                  </FooterLink>
                ))
              ) : (
                // Fallback enquanto carrega
                <>
                  <FooterLink href="#">Carregando...</FooterLink>
                </>
              )}
            </FooterSection>

            <FooterSection title="Suporte">
              <FooterLink href="/faq">Central de Ajuda</FooterLink>
              <FooterLink href="/servidor">Discord da Comunidade</FooterLink>
              <FooterLink href="/contato">Fale Conosco</FooterLink>
              <FooterLink href="/avaliacoes">Avaliações</FooterLink>
              <FooterLink href="/termos">Termos de Uso</FooterLink>
              <FooterLink href="/privacidade">
                Política de Privacidade
              </FooterLink>
            </FooterSection>

            <FooterSection title="Conta">
              <FooterLink href="/minha-conta">Minha Conta</FooterLink>
              <FooterLink href="/minha-conta/compras">
                Minhas Compras
              </FooterLink>
              <FooterLink href="/minha-conta/favoritos">Favoritos</FooterLink>
              <FooterLink href="/minha-conta/carrinho">Carrinho</FooterLink>
            </FooterSection>
          </div>
        </div>

        <Separator className="my-12 bg-white/10" />

        {/* --- RODAPÉ INFERIOR --- */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center text-xs text-neutral-500 md:text-left">
            <p>© {currentYear} SubMind Store. Todos os direitos reservados.</p>
          </div>
          <div className="text-center text-xs text-neutral-500 md:text-left">
            <p className="mt-1">
              CNPJ: XX.XXX.XXX/0001-XX • Desenvolvido por SubMind Team
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
