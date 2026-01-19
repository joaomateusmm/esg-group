"use client";

import React, { useEffect, useState } from "react";

import { Tabs } from "@/components/ui/tabs";

import SignInForm from "./components/sign-in-form";
import SignUpForm from "./components/sign-up-form";

// Tipagem dos Slides
type Slide = { image: string; title: string; caption: string };

const Authentication = () => {
  // --- CONTEÚDO DOS SLIDES ---
  const slidesData: Slide[] = [
    {
      // CORREÇÃO: Adicionada a barra "/" no início de todos os caminhos
      image: "/images/banner/banner-1.webp",
      title: "Domine seu Jogo",
      caption: "Acesse as melhores configs privadas e eleve seu nível.",
    },
    {
      image: "/images/banner/banner-2.webp",
      title: "Exclusividade e Segurança",
      caption: "Produtos testados e aprovados por milhares de clientes.",
    },
    {
      image: "/images/banner/banner-3.webp",
      title: "Comunidade Premium",
      caption: "Junte-se à elite dos jogadores e tenha suporte dedicado.",
    },
    {
      image: "/images/banner/banner-4.webp",
      title: "Contas Exclusivas",
      caption: "Obtenha as melhores contas para começar nos moveis com estilo.",
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);

  // --- NOVA LÓGICA DE TRANSIÇÃO ---
  const [currentForm, setCurrentForm] = useState<"sign-in" | "sign-up">(
    "sign-in",
  );
  const [isFadingOut, setIsFadingOut] = useState(false);

  const switchForm = (target: "sign-in" | "sign-up") => {
    if (target === currentForm) return;

    setIsFadingOut(true);

    setTimeout(() => {
      setCurrentForm(target);

      requestAnimationFrame(() => {
        setIsFadingOut(false);
      });
    }, 300);
  };

  // Autoplay do Carrossel
  useEffect(() => {
    const id = setInterval(
      () => setActiveSlide((s) => (s + 1) % slidesData.length),
      5000,
    );
    return () => clearInterval(id);
  }, [slidesData.length]);

  return (
    <div className="font-montserrat min-h-screen bg-[#000000] text-white">
      <div className="flex h-screen w-full">
        {/* --- ESQUERDA: CARROSSEL DE IMAGENS --- */}
        <aside className="relative hidden h-screen w-[60vw] overflow-hidden lg:flex">
          <div className="absolute inset-0 h-full w-full">
            {slidesData.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out ${
                  index === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-transparent" />
              </div>
            ))}
          </div>

          <div className="relative z-10 flex h-full w-full flex-col justify-end p-12 text-white">
            <h2 className="font-clash-display text-5xl font-medium tracking-wide drop-shadow-lg">
              {slidesData[activeSlide].title}
            </h2>
            <p className="mt-4 max-w-lg text-lg text-neutral-300 drop-shadow-md">
              {slidesData[activeSlide].caption}
            </p>

            <div className="mt-8 flex gap-2">
              {slidesData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeSlide === idx
                      ? "w-8 bg-[#D00000]"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* --- DIREITA: FORMULÁRIOS --- */}
        <main className="flex h-screen w-full flex-1 flex-col items-center justify-center bg-gradient-to-t from-red-900/30 via-black to-black p-8 lg:w-[40vw]">
          <div className="w-full max-w-md">
            <Tabs value={currentForm} className="w-full">
              {/* Container com altura mínima para evitar pulos de layout */}
              <div className="relative min-h-[600px] w-full">
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isFadingOut
                      ? "translate-x-4 opacity-0" // Estado Saindo
                      : "translate-x-0 opacity-100" // Estado Entrando/Visível
                  }`}
                >
                  {currentForm === "sign-in" ? (
                    <SignInForm switchToSignUp={() => switchForm("sign-up")} />
                  ) : (
                    <SignUpForm switchToSignIn={() => switchForm("sign-in")} />
                  )}
                </div>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Authentication;
