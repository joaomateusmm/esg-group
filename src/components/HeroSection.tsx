"use client";

import { motion } from "framer-motion";
import { ChevronsRight } from "lucide-react";
import Link from "next/link";

import { BannerCarousel } from "@/components/BannerCarousel";
import { Header } from "@/components/Header";
import LogoLoop from "@/components/LogoLoop";
import { ShinyButton } from "@/components/ui/shiny-button";

import { ClientBadge } from "./ClientBadge";
import { FadeInAnimate } from "./FadeInAnimate";
import { RevealBlockText } from "./RevealBlockText";
import Silk from "./Silk";

const PARTNER_LOGOS = [
  {
    src: "/images/icons/fivem.svg",
    alt: "Contas fivem",
    href: "https://sub-mind-sand.vercel.app/jogos/fivem",
  },
  {
    src: "/images/icons/roblox.svg",
    alt: "Roblox",
    href: "https://sub-mind-sand.vercel.app/jogos/roblox",
  },
  {
    src: "/images/icons/valorant.svg",
    alt: "Valorant",
    href: "https://sub-mind-sand.vercel.app/jogos/valorant",
  },
  {
    src: "/images/icons/discord.svg",
    alt: "Contas Discord",
    href: "https://sub-mind-sand.vercel.app/categorias/contas",
  },
  {
    src: "/images/icons/netflix.svg",
    alt: "Contas Netflix",
    href: "https://sub-mind-sand.vercel.app/streamings/netflix",
  },
  {
    src: "/images/icons/amazom.svg",
    alt: "Contas Prime Vídeo",
    href: "https://sub-mind-sand.vercel.app/streamings/prime-video",
  },
  {
    src: "/images/icons/disney.svg",
    alt: "Contas Prime Vídeo",
    href: "https://sub-mind-sand.vercel.app/streamings/prime-video",
  },
];

export default function HeroSection() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      {/* --- CAMADA DE FUNDO (SILK) COM FADE-IN ATRASADO --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.5, // Leva 2.5 segundos para aparecer totalmente (bem suave)
          delay: 1, // Espera 1.2 segundos antes de começar (aparece por último)
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute inset-0 z-0"
      >
        <Silk
          speed={12}
          scale={1}
          color="#210000"
          noiseIntensity={0.8}
          rotation={0}
        />
      </motion.div>

      <div className="z-[100] w-full">
        <div className="mx-auto flex w-full items-center justify-center">
          <Header />
        </div>
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-38 text-center">
        <FadeInAnimate
          className="mb-6 flex justify-center" // Controla posição e margem
          direction="down"
          delay={1}
        >
          <ClientBadge />
        </FadeInAnimate>

        <BannerCarousel />

        {/* Texto para telas de computador */}
        <div className="hidden flex-col items-center md:flex">
          <RevealBlockText boxColor="#D00000">
            <h1 className="font-clash-display max-w-7xl text-[70px] leading-[1.1] font-medium tracking-wide text-white drop-shadow-xl">
              A melhor loja de Citizens, Configs
            </h1>
          </RevealBlockText>
          <RevealBlockText boxColor="#D00000" delay={0.3}>
            <h1 className="font-clash-display max-w-4xl text-[70px] leading-[1.1] font-medium tracking-wide text-white drop-shadow-xl">
              Privadas e Mod Sons
            </h1>
          </RevealBlockText>
        </div>

        {/* Texto para telas de celular */}
        <div className="flex flex-col items-center md:hidden">
          <RevealBlockText boxColor="#D00000" width="100%">
            <h1 className="font-clash-display max-w-4xl text-center text-2xl leading-[1.1] font-medium tracking-wide text-white drop-shadow-xl">
              A melhor loja de Citizens, Configs
            </h1>
          </RevealBlockText>
          <RevealBlockText boxColor="#D00000" delay={0.3} width="100%">
            <h1 className="font-clash-display max-w-4xl text-center text-2xl leading-[1.1] font-medium tracking-wide text-white drop-shadow-xl">
              Privadas e Mod Sons
            </h1>
          </RevealBlockText>
        </div>

        <FadeInAnimate
          className="flex justify-center" // Adicione isso para centralizar o filho
          direction="up"
          delay={0.8}
        >
          <p className="font-montserrat md:text-md text-md mt-2 max-w-md leading-relaxed text-neutral-500 drop-shadow-md md:max-w-4xl">
            Acesso a contas premium e recursos exclusivos para jogos. Valorant
            com skins raras e Champions, Roblox com Robux, além de Citizens,
            Mods de Som, Reshades e Configs Privadas.
          </p>
        </FadeInAnimate>

        <div className="mt-14 flex items-center gap-4">
          <Link href="https://discord.com/invite/RTahhx6Pvp">
            <button className="group flex cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-800/30 bg-black/30 px-4 py-[12px] backdrop-blur-md duration-300 hover:scale-[1.03]">
              Servidor{" "}
              <ChevronsRight className="h-5 w-5 duration-500 group-hover:-rotate-90" />
            </button>
          </Link>
          <ShinyButton
            className="font-montserrat font-light"
            onClick={() =>
              document
                .getElementById("catalogo")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Ver Catálogo
          </ShinyButton>
        </div>

        <div className="font-montserrat mt-16 text-xs font-medium text-neutral-500">
          <p>Contas e Serviços:</p>
        </div>

        <div className="mt-4 mb-10 w-full max-w-5xl opacity-50 grayscale invert transition-all duration-500 hover:opacity-100 hover:grayscale-0 hover:invert-0">
          <LogoLoop
            className="py-2"
            logos={PARTNER_LOGOS} // <--- Usando a constante externa
            speed={60}
            direction="left"
            logoHeight={40}
            gap={60}
            hoverSpeed={10}
            scaleOnHover
            fadeOut
            fadeOutColor="#050505"
            ariaLabel="Tecnologias e Parceiros"
          />
        </div>
      </main>

      <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-48 w-full bg-gradient-to-t from-[#010000] to-transparent" />
    </div>
  );
}
