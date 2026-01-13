"use client";

import { AnimatePresence, motion } from "framer-motion"; // <--- Importamos framer-motion
import { ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import SingleCubeFivem from "@/components/CubeFivem";
import SingleCubeRoblox from "@/components/CubeRoblox";
import SingleCubeValorant from "@/components/CubeValorant";
import { Header } from "@/components/Header";
import LogoLoop from "@/components/LogoLoop";
import Silk from "@/components/Silk";
import { ShinyButton } from "@/components/ui/shiny-button";

export default function HeroSection() {
  const bannerImages = [
    { src: "/images/banner/banner-5.webp", alt: "Banner Principal Valorant" },
    { src: "/images/banner/banner-6.webp", alt: "Banner Secundário" },
    { src: "/images/banner/banner-3.webp", alt: "Banner Terciário" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = direita, -1 = esquerda

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) =>
      prevIndex === bannerImages.length - 1 ? 0 : prevIndex + 1,
    );
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? bannerImages.length - 1 : prevIndex - 1,
    );
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  });

  // Variantes da animação de slide
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

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
      <div className="absolute bottom-0 left-0 hidden h-[300px] w-[300px] opacity-50 blur-xs md:bottom-[-100px] md:left-[1000px] md:flex md:h-[500px] md:w-[500px]">
        <SingleCubeRoblox scale={8} initialRotation={[2, 2, 0]} />
      </div>
      <div className="absolute top-[-220px] right-[-230px] hidden h-[350px] w-[350px] opacity-50 blur-xs duration-500 md:flex md:h-[800px] md:w-[800px]">
        <SingleCubeFivem scale={7} initialRotation={[0.5, 0.5, 0]} />
      </div>
      <div className="absolute top-[120px] -left-[120px] hidden h-[250px] w-[250px] opacity-40 blur-xs md:flex md:h-[800px] md:w-[800px]">
        <SingleCubeValorant scale={5} initialRotation={[1, 2, 0]} />
      </div>

      {/* --- HEADER --- */}
      <div className="z-[100] w-full">
        <div className="mx-auto flex w-full items-center justify-center">
          <Header />
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL (HERO) --- */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-38 text-center">
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

        {/* --- CARROSSEL DE IMAGENS --- */}
        <div className="mb-12 flex flex-col items-center">
          <div className="relative h-auto w-[85vw] md:w-[60vw]">
            {/* Seta Esquerda */}
            <button
              onClick={prevSlide}
              className="absolute top-1/2 left-[-20px] z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-black/20 p-2 text-white/50 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white md:left-[-50px] md:flex"
              aria-label="Imagem Anterior"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Container da Imagem com AnimatePresence */}
            <div className="relative aspect-[1800/1050] w-full overflow-hidden rounded-md">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute inset-0 h-full w-full"
                >
                  <Image
                    src={bannerImages[currentIndex].src}
                    alt={bannerImages[currentIndex].alt}
                    fill
                    priority={true}
                    className="object-cover shadow-md"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Seta Direita */}
            <button
              onClick={nextSlide}
              className="absolute top-1/2 right-[-20px] z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-black/20 p-2 text-white/50 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white md:right-[-50px] md:flex"
              aria-label="Próxima Imagem"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Bolinhas de Navegação (Dots) */}
          <div className="mt-4 flex flex-row items-center justify-center gap-2">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  currentIndex === index
                    ? "scale-110 bg-neutral-200" // Cor ativa
                    : "bg-neutral-800 hover:bg-neutral-600" // Cor inativa
                }`}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Texto para telas de computador */}
        <h1 className="font-clash-display hidden max-w-4xl leading-[1.1] font-medium tracking-wide drop-shadow-xl md:flex md:max-w-[70vw] md:text-[70px]">
          A melhor loja de Citizens, Configs
          <br className="hidden md:block" /> Privadas e Mod Sons
        </h1>

        {/* Texto para telas de celular */}
        <h1 className="font-clash-display max-w-4xl text-2xl leading-[1.1] font-medium tracking-wide drop-shadow-xl md:hidden">
          A melhor loja de Citizens, Configs
          <br className="hidden md:block" /> Privadas e Mod Sons
        </h1>

        <p className="font-montserrat md:text-md text-md mt-2 max-w-md leading-relaxed text-neutral-500 drop-shadow-md md:max-w-4xl">
          Acesso a contas premium e recursos exclusivos para jogos. Valorant com
          skins raras e Champions, Roblox com Robux, além de Citizens, Mods de
          Som, Reshades e Configs Privadas.
        </p>

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

        <div className="mt-4 mb-16 w-full max-w-5xl opacity-50 grayscale invert transition-all duration-500 hover:opacity-100 hover:grayscale-0 hover:invert-0">
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
