"use client";

import React, { useEffect, useState } from "react";

import { Tabs } from "@/components/ui/tabs";

import SignInForm from "./components/sign-in-form";
import SignUpForm from "./components/sign-up-form";

// Tipagem dos Slides
type Slide = { image: string; title: string; caption: string };

const Authentication = () => {
  // --- CONTEÚDO DOS SLIDES (Mantive os caminhos, ajuste depois) ---
  const slidesData: Slide[] = [
    {
      image: "images/banner/banner6.png",
      title: "Domine seu Jogo",
      caption: "Acesse as melhores configs privadas e eleve seu nível.",
    },
    {
      image: "images/banner/banner2.png",
      title: "Exclusividade e Segurança",
      caption: "Produtos testados e aprovados por milhares de clientes.",
    },
    {
      image: "images/banner/banner5.png",
      title: "Comunidade Premium",
      caption: "Junte-se à elite dos jogadores e tenha suporte dedicado.",
    },
  ];

  const [active, setActive] = useState(0);
  const [tabValue, setTabValue] = useState<string>("sign-in");
  const [prevTab, setPrevTab] = useState<string | null>(null);
  const [prevVisible, setPrevVisible] = useState(false);
  const [activeVisible, setActiveVisible] = useState(true);

  // Lógica de Troca de Abas (Fade In/Out Suave)
  const changeTab = (newValue: string) => {
    if (newValue === tabValue) return;
    setPrevTab(tabValue);
    setPrevVisible(true);
    setActiveVisible(false);
    setTabValue(newValue);

    requestAnimationFrame(() => {
      setPrevVisible(false);
      setActiveVisible(true);
    });

    setTimeout(() => setPrevTab(null), 350);
  };

  // Autoplay do Carrossel
  useEffect(() => {
    const id = setInterval(
      () => setActive((s) => (s + 1) % slidesData.length),
      5000, // Acelerei um pouco para 5s (era 10s)
    );
    return () => clearInterval(id);
  }, [slidesData.length]);

  return (
    <div className="font-montserrat min-h-screen bg-[#050505] text-white">
      <div className="flex h-screen w-full">
        {/* --- ESQUERDA: CARROSSEL DE IMAGENS --- */}
        <aside className="relative hidden h-screen w-[60vw] overflow-hidden lg:flex">
          {/* Container das Imagens */}
          <div className="absolute inset-0 h-full w-full">
            {slidesData.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 h-full w-full transition-opacity duration-3000 ease-in-out ${
                  index === active ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* Imagem de Fundo */}
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
                {/* Overlay Escuro para o Texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-transparent" />
              </div>
            ))}
          </div>

          {/* Conteúdo de Texto (Sobreposto) */}
          <div className="relative z-10 flex h-full w-full flex-col justify-end p-12 text-white">
            <h2 className="font-clash-display text-5xl font-medium tracking-wide drop-shadow-lg">
              {slidesData[active].title}
            </h2>
            <p className="mt-4 max-w-lg text-lg text-neutral-300 drop-shadow-md">
              {slidesData[active].caption}
            </p>

            {/* Indicadores (Bolinhas) */}
            <div className="mt-8 flex gap-2">
              {slidesData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActive(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    active === idx
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
        <main className="flex h-screen w-full flex-1 flex-col items-center justify-center bg-[#050505] p-8 lg:w-[40vw]">
          <div className="w-full max-w-md">
            {/* Tabs (Controle do Estado Visual) */}
            <Tabs
              value={tabValue}
              onValueChange={changeTab}
              defaultValue="sign-in"
              className="w-full"
            >
              {/* Container Relativo para Animação de Sobreposição */}
              <div className="relative min-h-[600px] w-full">
                {/* Painel Ativo (Fade In) */}
                <div
                  className={`absolute inset-0 w-full transition-all duration-500 ease-out ${
                    activeVisible
                      ? "blur-0 translate-x-0 opacity-100"
                      : "translate-x-4 opacity-0 blur-sm"
                  }`}
                >
                  {tabValue === "sign-in" ? (
                    <SignInForm switchToSignUp={() => changeTab("sign-up")} />
                  ) : (
                    <SignUpForm switchToSignIn={() => changeTab("sign-in")} />
                  )}
                </div>

                {/* Painel Anterior (Fade Out) - Garante a suavidade na troca */}
                {prevTab && (
                  <div
                    className={`pointer-events-none absolute inset-0 w-full transition-all duration-500 ease-in ${
                      prevVisible
                        ? "blur-0 translate-x-0 opacity-100"
                        : "-translate-x-4 opacity-0 blur-sm"
                    }`}
                  >
                    {prevTab === "sign-in" ? (
                      <SignInForm switchToSignUp={() => {}} />
                    ) : (
                      <SignUpForm switchToSignIn={() => {}} />
                    )}
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Authentication;
