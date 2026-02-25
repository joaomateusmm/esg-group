"use client";

import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getAllCategories } from "@/actions/get-all-categories";
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
      {/* Título agora é escuro e bold */}
      <h3 className="font-montserrat text-lg font-bold text-neutral-800">
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
      // Hover agora é laranja
      className="text-sm text-neutral-700 transition-colors hover:text-orange-600 hover:underline"
    >
      {children}
    </Link>
  );
}

// --- COMPONENTE PRINCIPAL ---

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    getAllCategories().then((data) => {
      setCategories(data);
    });
  }, []);

  return (
    // Fundo branco com borda no topo
    <footer className="sombra-footer relative w-full overflow-hidden border-t border-neutral-200 bg-white pt-16 pb-10">
      {/* --- CONTEÚDO --- */}
      <div className="relative z-20 mx-auto max-w-[90rem] px-4">
        {/* --- GRADE PRINCIPAL --- */}
        <div className="grid gap-12 pb-12 lg:grid-cols-12 lg:gap-8">
          {/* COLUNA 1: IDENTIDADE (Esquerda) */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                <Image
                  src="/images/logo.png"
                  alt="Logo ESG Group"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Nome da loja escuro */}
              <span className="font-montserrat text-2xl font-bold text-neutral-800">
                ESG Group
              </span>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-neutral-700">
              Compre móveis e Contrate serviços, no melhor preço da Inglaterra.
            </p>

            {/* BOTÕES SOCIAIS ATUALIZADOS */}
            <div className="flex gap-4">
              {[Instagram, Twitter, Youtube, Facebook].map((Icon, idx) => (
                <Button
                  key={idx}
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full border-neutral-200 bg-white text-neutral-500 transition-all hover:border-orange-600 hover:bg-orange-600 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* COLUNA 2: LINKS (Centro) */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            <FooterSection title="Categorias">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <FooterLink key={cat.href} href={cat.href}>
                    {cat.label}
                  </FooterLink>
                ))
              ) : (
                <span className="text-sm text-neutral-700">Carregando...</span>
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

          {/* COLUNA 3: SELOS (Direita) */}
          <div className="flex flex-col gap-8 lg:col-span-3">
            {/* Formas de Pagamento */}
            <div>
              <h4 className="font-montserrat mb-5 text-lg font-bold text-neutral-800">
                Formas de Pagamento
              </h4>
              <div className="flex flex-wrap gap-2">
                {/* Ajuste o tamanho das imagens conforme o seu SVG real */}
                <div className="flex h-8 w-[50px] items-center justify-center rounded border border-neutral-200 bg-white p-1 shadow-sm">
                  <Image
                    src="/images/payments/visa.svg"
                    alt="Visa"
                    width={40}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <div className="flex h-8 w-[50px] items-center justify-center rounded border border-neutral-200 bg-white p-1 shadow-sm">
                  <Image
                    src="/images/payments/mastercard.svg"
                    alt="Mastercard"
                    width={40}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <div className="flex h-8 w-[50px] items-center justify-center rounded border border-neutral-200 bg-white p-1 shadow-sm">
                  <Image
                    src="/images/payments/amex.svg"
                    alt="Amex"
                    width={40}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <div className="flex h-8 w-[50px] items-center justify-center rounded border border-neutral-200 bg-white p-1 shadow-sm">
                  <Image
                    src="/images/payments/apple-pay.svg"
                    alt="Apple Pay"
                    width={40}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <div className="flex h-8 w-[50px] items-center justify-center rounded border border-neutral-200 bg-white p-1 shadow-sm">
                  <Image
                    src="/images/payments/google-pay.svg"
                    alt="Google Pay"
                    width={40}
                    height={20}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Selos de Segurança */}
            <div>
              <h4 className="font-montserrat mb-5 text-lg font-bold text-neutral-800">
                Selos de Segurança
              </h4>
              <div className="flex flex-col gap-3">
                {/* Selo Google Safe Browsing */}
                <div className="relative h-10 w-[140px]">
                  <Image
                    src="/images/payments/google-safe.webp"
                    alt="Google Safe Browsing"
                    fill
                    className="object-contain object-left"
                  />
                </div>
                {/* Selo Loja Protegida (SSL) */}
                <div className="relative h-10 w-[140px]">
                  <Image
                    src="/images/payments/loja-protegida.webp"
                    alt="Loja Protegida"
                    fill
                    className="object-contain object-left"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separador claro */}
        <Separator className="mb-6 bg-neutral-200" />

        {/* --- RODAPÉ INFERIOR --- */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center text-xs text-neutral-500 md:text-left">
            <p>
              Est. {currentYear} ESG-Group Store. Todos os direitos reservados.
            </p>
          </div>
          <div className="text-center text-xs text-neutral-500 md:text-right">
            <p>United Kingdom (UK) • Desenvolvido por ESG-Group Team</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
