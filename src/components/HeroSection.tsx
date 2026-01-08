"use client"; // Este componente lida com interações e animações

import { ChevronsRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Seus componentes interativos e visuais
import SingleCubeFivem from "@/components/CubeFivem";
import SingleCubeRoblox from "@/components/CubeRoblox";
import SingleCubeValorant from "@/components/CubeValorant";
import { Header } from "@/components/Header";
import LogoLoop from "@/components/LogoLoop";
import Silk from "@/components/Silk";
import { ShinyButton } from "@/components/ui/shiny-button";

export default function HeroSection() {
  const partnerLogos = [
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
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      {/* --- CAMADA DE FUNDO (SILK) --- */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Silk
          speed={12}
          scale={1}
          color="#190000"
          noiseIntensity={0.8}
          rotation={0}
        />
      </div>

      {/* --- CUBOS 3D --- */}
      <div className="absolute bottom-0 left-0 h-[300px] w-[300px] opacity-50 blur-xs md:bottom-[-100px] md:left-[1000px] md:h-[500px] md:w-[500px]">
        <SingleCubeRoblox scale={8} initialRotation={[2, 2, 0]} />
      </div>
      <div className="absolute top-[-220px] right-[-250px] h-[350px] w-[350px] opacity-50 blur-xs duration-500 md:h-[800px] md:w-[800px]">
        <SingleCubeFivem scale={7} initialRotation={[0.5, 0.5, 0]} />
      </div>
      <div className="absolute top-[0px] left-[120px] h-[250px] w-[250px] opacity-40 blur-xs md:h-[800px] md:w-[800px]">
        <SingleCubeValorant scale={5} initialRotation={[1, 2, 0]} />
      </div>

      {/* --- HEADER --- */}
      <div className="z-[100] w-full">
        <div className="mx-auto flex w-full items-center justify-center">
          <Header />
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL (HERO) --- */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex items-center gap-3 rounded-full border border-neutral-800/30 bg-transparent py-1.5 pr-4 pl-2 shadow-sm backdrop-blur-md">
          <div className="flex items-center">
            {/* Avatares dos Clientes */}
            <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#0404041f] bg-gray-800 duration-100 hover:scale-[1.05]">
              <Image
                src="/images/avatar/avatar3.webp"
                alt="Cliente 1"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="-ml-3 h-8 w-8 overflow-hidden rounded-full border-2 border-[#111111] bg-gray-400 duration-100 hover:scale-[1.05]">
              <Image
                src="/images/avatar/avatar2.webp"
                alt="Cliente 2"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="-ml-3 h-8 w-8 overflow-hidden rounded-full border-2 border-[#111111] bg-gray-300 duration-100 hover:scale-[1.05]">
              <Image
                src="/images/avatar/avatar1.webp"
                alt="Cliente 3"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <span className="text-sm font-medium text-neutral-500">
            <span className="font-bold text-neutral-200">3.350+</span> Clientes
            Satisfeitos
          </span>
        </div>

        <h1 className="font-clash-display max-w-4xl text-[55px] leading-[1.1] font-medium tracking-wide drop-shadow-xl md:max-w-[70vw] md:text-[80px]">
          A melhor loja de Citizens, Configs
          <br className="hidden md:block" /> Privadas e Mod Sons
        </h1>

        <p className="font-montserrat md:text-md text-md mt-2 max-w-md leading-relaxed text-neutral-500 drop-shadow-md md:max-w-4xl">
          Acesso a contas premium e recursos exclusivos para jogos. Valorant com
          skins raras e Champions, Roblox com Robux, além de Citizens, Mods de
          Som, Reshades e Configs Privadas.
        </p>

        <div className="mt-10 flex items-center gap-4">
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

        <div className="font-montserrat mt-24 text-xs font-medium text-neutral-500">
          <p>Contas e Serviços:</p>
        </div>

        <div className="mt-4 w-full max-w-5xl opacity-50 grayscale invert transition-all duration-500 hover:opacity-100 hover:grayscale-0 hover:invert-0">
          <LogoLoop
            logos={partnerLogos}
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

      {/* --- GRADIENTE DE TRANSIÇÃO SUAVE (BOTTOM) --- */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-48 w-full bg-gradient-to-t from-[#010000] to-transparent" />
    </div>
  );
}
