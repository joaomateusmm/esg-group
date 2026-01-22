"use client";

import { ArrowRight, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// --- DADOS DOS BANNERS ---
// Mapeei os seus links para as posições visuais do print
const BANNERS = [
  // COLUNA ESQUERDA (1)
  {
    id: "quarto",
    src: "/images/banners/quarto.jpg", // Substitua pela sua imagem real
    title: "Quartos",
    description: "Melhores móveis para o seu quarto.",
    href: "/categorias/quarto",
    position: "left-top", // Pequeno topo
  },
  {
    id: "eletrodomesticos",
    src: "/images/banners/eletrodomesticos.jpg",
    title: "Eletrodomésticos",
    description: "Melhores eletros para sua casa.",
    price: "R$ 49,90", // Exemplo de 'hotspot'
    href: "/categorias/eletrodomesticos",
    position: "left-bottom", // Grande baixo
  },

  // COLUNA CENTRAL (2 - Ocupa 2 espaços)
  {
    id: "imoveis-usados",
    src: "/images/banners/imoveis-usados.jpg",
    title: "Imóveis Usados",
    description: "Compre imóveis usados no melhor preço.",
    href: "/categorias/imoveis-usados",
    position: "center-main", // O Banner Gigante
  },
  {
    id: "Cozinha",
    src: "/images/banners/cozinha.jpg",
    title: "Cozinha",
    description: "Melhores móveis e itens para sua cozinha.",
    href: "/categorias/cozinha",
    position: "center-bottom-1", // Pequeno baixo esquerda
  },
  {
    id: "Banheiros",
    src: "/images/banners/banheiro.jpg",
    alt: "banheiros",
    title: "Banheiros",
    description: "Melhores itens para o seu banheiro.",
    href: "/categorias/banheiros",
    position: "center-bottom-2", // Pequeno baixo direita
  },

  {
    id: "quintal",
    src: "/images/banners/quintal.jpg",
    title: "Quintal",
    description: "Melhores objetos para o seu quintal.",
    href: "/categorias/quintal",
    position: "right-top", // Pequeno topo
  },
  {
    id: "disney",
    src: "/images/banners/disney-banner.jpg",
    title: "Oferta Relâmpago",
    description: "Disney+ com 50% OFF.",
    href: "/streamings/disney",
    hasTimer: true, // Ativa o contador
    position: "right-bottom", // Grande baixo
  },
];

// --- SUB-COMPONENTE: CARD DO BANNER ---
function BannerCard({
  item,
  className,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  className?: string;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative block w-full overflow-hidden rounded-2xl bg-neutral-900",
        className,
      )}
    >
      {/* Imagem de Fundo com Zoom no Hover */}
      <div className="absolute inset-0 h-full w-full">
        <Image
          src={item.src}
          alt="banner"
          fill
          className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-105"
        />
        {/* Overlay Escuro para leitura do texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
      </div>

      {/* Conteúdo de Texto */}
      <div className="absolute bottom-0 left-0 flex w-full flex-col p-6">
        {item.hasTimer && <CountdownTimer />}
        <h3 className="font-clash-display mb-1 text-xl font-semibold text-white md:text-2xl">
          {item.title}
        </h3>
        <p className="mb-4 line-clamp-2 max-w-[90%] text-sm font-medium text-neutral-100">
          {item.description}
        </p>

        <div className="flex items-center gap-2 text-sm font-medium text-white underline decoration-neutral-500 underline-offset-4 transition-all group-hover:decoration-white">
          Ver Agora{" "}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

// --- SUB-COMPONENTE: CONTADOR (TIMER) ---
function CountdownTimer() {
  const [time, setTime] = useState({
    days: 2,
    hours: 5,
    minutes: 45,
    seconds: 36,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0)
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0)
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev; // Para fins demonstrativos, não zera dias
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-orange-500 uppercase">
        <Clock className="h-3 w-3" /> Deals of the day
      </div>
      <div className="flex gap-2">
        {Object.entries(time).map(([label, value]) => (
          <div
            key={label}
            className="flex min-w-[3.5rem] flex-col items-center rounded bg-white/10 px-2 py-1.5 backdrop-blur-sm"
          >
            <span className="text-lg leading-none font-bold text-white">
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-neutral-400 uppercase">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function HeroBanners() {
  const getBanner = (pos: string) => BANNERS.find((b) => b.position === pos);

  return (
    <section className="w-full px-4 pt-36 pb-6 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        {/* GRID LAYOUT - Altura fixa no Desktop para garantir alinhamento (Bento Grid) */}
        <div className="grid h-auto w-full grid-cols-1 gap-4 md:h-[600px] md:grid-cols-4">
          {/* COLUNA 1 (ESQUERDA) */}
          <div className="flex h-full flex-col gap-4 md:col-span-1">
            {/* Topo Pequeno */}
            <div className="h-[200px] md:h-[35%]">
              {getBanner("left-top") && (
                <BannerCard item={getBanner("left-top")} className="h-full" />
              )}
            </div>
            {/* Base Grande */}
            <div className="h-[300px] flex-1 md:h-auto">
              {getBanner("left-bottom") && (
                <BannerCard
                  item={getBanner("left-bottom")}
                  className="h-full"
                />
              )}
            </div>
          </div>

          {/* COLUNA 2 (CENTRO - LARGA) */}
          <div className="flex h-full flex-col gap-4 md:col-span-2">
            {/* Principal Gigante */}
            <div className="h-[300px] flex-1 md:h-auto">
              {getBanner("center-main") && (
                <BannerCard
                  item={getBanner("center-main")}
                  className="h-full"
                />
              )}
            </div>
            {/* Base Dividida em 2 */}
            <div className="grid h-[200px] grid-cols-2 gap-4 md:h-[30%]">
              {getBanner("center-bottom-1") && (
                <BannerCard
                  item={getBanner("center-bottom-1")}
                  className="h-full"
                />
              )}
              {getBanner("center-bottom-2") && (
                <BannerCard
                  item={getBanner("center-bottom-2")}
                  className="h-full"
                />
              )}
            </div>
          </div>

          {/* COLUNA 3 (DIREITA) */}
          <div className="flex h-full flex-col gap-4 md:col-span-1">
            {/* Topo Pequeno */}
            <div className="h-[200px] md:h-[35%]">
              {getBanner("right-top") && (
                <BannerCard item={getBanner("right-top")} className="h-full" />
              )}
            </div>
            {/* Base Grande (Com Timer) */}
            <div className="h-[300px] flex-1 md:h-auto">
              {getBanner("right-bottom") && (
                <BannerCard
                  item={getBanner("right-bottom")}
                  className="h-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
