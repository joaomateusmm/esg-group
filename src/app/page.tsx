"use client";

import { ChevronsRight } from "lucide-react";
import Image from "next/image";

import CardNav from "@/components/CardNav";
import SingleCubeFivem from "@/components/CubeFivem";
import SingleCubeRoblox from "@/components/CubeRoblox";
import SingleCubeValorant from "@/components/CubeValorant";
import LogoLoop from "@/components/LogoLoop"; // Seu componente atualizado
import Silk from "@/components/Silk";
import { ShinyButton } from "@/components/ui/shiny-button";

export default function Home() {
  // --- DADOS DO LOGO LOOP (AGORA COM IMAGENS) ---
  // DICA: Coloque suas imagens na pasta 'public/images/' e use o caminho aqui.
  const partnerLogos = [
    {
      src: "/images/icons/fivem.svg", // Substitua por "/images/discord.png"
      alt: "Contas fivem",
      href: "/catalogo",
    },
    {
      src: "/images/icons/roblox.svg", // Substitua por "/images/react.png"
      alt: "Roblox",
      href: "/catalogo",
    },
    {
      src: "/images/icons/valorant.svg", // Substitua por "/images/nextjs.png"
      alt: "Valorant",
      href: "https://nextjs.org",
    },
    {
      src: "/images/icons/Discord.svg", // Substitua por "/images/typescript.png"
      alt: "Contas Discord",
      href: "https://www.typescriptlang.org",
    },
    {
      src: "/images/icons/netflix.svg", // Substitua por "/images/tailwind.png"
      alt: "Contas Netflix",
      href: "https://tailwindcss.com",
    },
    {
      src: "/images/icons/amazom.png", // Substitua por "/images/tailwind.png"
      alt: "Contas Amazom",
      href: "https://tailwindcss.com",
    },
  ];

  // Configuração dos Itens do Menu
  const navItems = [
    {
      label: "Produtos",
      bgColor: "#330606",
      textColor: "#fff",
      links: [
        { label: "Citizens", href: "/citizens", ariaLabel: "Comprar Citizens" },
        {
          label: "Configs Privadas",
          href: "/configs",
          ariaLabel: "Ver Configs",
        },
        { label: "Mod Sons", href: "/sons", ariaLabel: "Ver Mod Sons" },
      ],
    },
    {
      label: "Afiliados",
      bgColor: "#240000",
      textColor: "#fff",
      links: [
        {
          label: "Ser Afiliado",
          href: "https://discord.com/invite/RTahhx6Pvp",
          ariaLabel: "Entrar no Discord",
        },
        {
          label: "Como Funciona",
          href: "/seja-afiliado",
          ariaLabel: "Suporte Técnico",
        },
      ],
    },
    {
      label: "Conta",
      bgColor: "#140000",
      textColor: "#fff",
      links: [
        { label: "Entrar", href: "/login", ariaLabel: "Fazer Login" },
        { label: "Criar Conta", href: "/register", ariaLabel: "Registrar-se" },
      ],
    },
  ];

  return (
    <div className="font-montserrat relative flex min-h-screen flex-col overflow-hidden bg-[#050505] text-white">
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

      {/* CUBO 1: Bottom Left */}
      <div className="absolute bottom-0 left-0 z-10 h-[300px] w-[300px] opacity-50 blur-xs md:bottom-[-100px] md:left-[1000px] md:h-[500px] md:w-[500px]">
        <SingleCubeRoblox scale={8} initialRotation={[2, 2, 0]} />
      </div>

      {/* CUBO 2: Top Right */}
      <div className="absolute top-[-220px] right-[-250px] z-90 h-[350px] w-[350px] opacity-50 blur-xs duration-500 md:h-[800px] md:w-[800px]">
        <SingleCubeFivem scale={7} initialRotation={[0.5, 0.5, 0]} />
      </div>

      {/* CUBO 3: Top Left */}
      <div className="absolute top-[0px] left-[120px] z-50 h-[250px] w-[250px] opacity-40 blur-xs md:h-[800px] md:w-[800px]">
        <SingleCubeValorant scale={5} initialRotation={[1, 2, 0]} />
      </div>

      {/* --- HEADER --- */}
      <div className="absolute top-0 left-0 z-50 w-full">
        <CardNav
          className="backdrop-blur-md"
          items={navItems}
          baseColor="#0404041f"
          menuColor="#FFFFFF"
          buttonBgColor="#D00000"
          buttonTextColor="#fff"
          ease="back.out(1.7)"
        />
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-24 text-center">
        {/* Card Clientes */}
        <div className="mb-6 flex items-center gap-3 rounded-full border border-neutral-800/30 bg-transparent py-1.5 pr-4 pl-2 shadow-sm backdrop-blur-md">
          <div className="flex items-center">
            <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#0404041f] bg-gray-800">
              <Image
                src="/images/avatar3.jpg"
                alt="Cliente 1"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="-ml-3 h-8 w-8 overflow-hidden rounded-full border-2 border-[#111111] bg-gray-400">
              <Image
                src="/images/avatar2.jpg"
                alt="Cliente 2"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="-ml-3 h-8 w-8 overflow-hidden rounded-full border-2 border-[#111111] bg-gray-300">
              <Image
                src="/images/avatar1.png"
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

        {/* Título */}
        <h1 className="font-clash-display max-w-4xl text-[55px] leading-[1.1] font-medium tracking-wide drop-shadow-xl md:max-w-[70vw] md:text-[80px]">
          A melhor loja de Citizens, Configs
          <br className="hidden md:block" /> Privadas e Mod Sons
        </h1>

        {/* Subtítulo */}
        <p className="font-montserrat md:text-md text-md mt-2 max-w-md leading-relaxed text-neutral-500 drop-shadow-md md:max-w-4xl">
          Acesso a contas premium e recursos exclusivos para jogos. Valorant com
          skins raras e Champions, Roblox com Robux, além de Citizens, Mods de
          Som, Reshades e Configs Privadas. Performance máxima, itens raros e
          vantagem real dentro do jogo.
        </p>

        {/* Botões */}
        <div className="mt-10 flex items-center gap-4">
          <button className="group flex cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-800/30 bg-transparent px-4 py-[10px] backdrop-blur-md duration-300 hover:scale-[1.03]">
            Servidor{" "}
            <ChevronsRight className="h-5 w-5 duration-500 group-hover:-rotate-90" />
          </button>
          <ShinyButton
            className="font-montserrat font-light"
            onClick={() => alert("Button clicked!")}
          >
            Ver Catálogo
          </ShinyButton>
        </div>

        {/* --- LOGO LOOP COM IMAGENS --- */}
        {/* Adicionei 'grayscale' para deixar preto e branco, hover colorido */}
        <div className="mt-24 w-full max-w-5xl opacity-50 grayscale invert transition-all duration-500 hover:opacity-100 hover:grayscale-0 hover:invert-0">
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
    </div>
  );
}
