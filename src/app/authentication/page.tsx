"use client";

import { Loader2 } from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";

import { Tabs } from "@/components/ui/tabs";

import SignInForm from "./components/sign-in-form";
import SignUpForm from "./components/sign-up-form";

type Slide = { image: string; title: string; caption: string };

// --- COMPONENTE COM A LÓGICA (O CORPO DA PÁGINA) ---
const AuthenticationLayout = () => {
  const slidesData: Slide[] = [
    {
      image: "/images/banners/imoveis-usados.jpg",
      title: "Móveis Usados",
      caption: "Compre móveis usados no melhor preço na Inglaterra.",
    },
    {
      image: "/images/banners/eletrodomesticos.jpg",
      title: "Eletrodomésticos",
      caption: "Produtos testados e aprovados por milhares de clientes.",
    },
    {
      image: "/images/banners/cozinha.jpg",
      title: "Comunidade Premium",
      caption: "Junte-se à elite dos jogadores e tenha suporte dedicado.",
    },
    {
      image: "/images/banners/quarto.jpg",
      title: "Contas Exclusivas",
      caption: "Obtenha as melhores contas para começar nos games com estilo.",
    },
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [currentForm, setCurrentForm] = useState<"sign-in" | "sign-up">(
    "sign-in",
  );
  const [isFadingOut, setIsFadingOut] = useState(false);

  const switchForm = (target: "sign-in" | "sign-up") => {
    if (target === currentForm) return;
    setIsFadingOut(true);
    setTimeout(() => {
      setCurrentForm(target);
      requestAnimationFrame(() => setIsFadingOut(false));
    }, 300);
  };

  useEffect(() => {
    const id = setInterval(
      () => setActiveSlide((s) => (s + 1) % slidesData.length),
      5000,
    );
    return () => clearInterval(id);
  }, [slidesData.length]);

  return (
    <div className="font-montserrat min-h-screen bg-white text-neutral-900">
      <div className="flex h-screen w-full">
        {/* LADO ESQUERDO: CARROSSEL */}
        <aside className="relative hidden h-screen w-[60vw] overflow-hidden bg-neutral-100 lg:flex">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
            ))}
          </div>

          <div className="relative z-10 flex h-full w-full flex-col justify-end p-12 text-white">
            <h2 className="font-clash-display text-5xl font-medium tracking-wide drop-shadow-lg">
              {slidesData[activeSlide].title}
            </h2>
            <p className="mt-4 max-w-lg text-lg text-neutral-200 drop-shadow-md">
              {slidesData[activeSlide].caption}
            </p>
            <div className="mt-8 flex gap-2">
              {slidesData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    activeSlide === idx
                      ? "w-8 bg-orange-600"
                      : "w-3 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* LADO DIREITO: FORMULÁRIOS */}
        <main className="flex h-screen w-full flex-1 flex-col items-center justify-center bg-white p-8 lg:w-[40vw]">
          <div className="w-full max-w-md">
            <Tabs value={currentForm} className="w-full">
              <div className="relative min-h-[600px] w-full">
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isFadingOut
                      ? "translate-x-4 opacity-0"
                      : "translate-x-0 opacity-100"
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

// --- COMPONENTE PRINCIPAL (O QUE O NEXT EXPORTA) ---
// Envolvemos TUDO em Suspense para que o Next.js não tente renderizar nada no servidor
export default function AuthenticationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
            <p className="animate-pulse text-neutral-500">
              Carregando autenticação...
            </p>
          </div>
        </div>
      }
    >
      <AuthenticationLayout />
    </Suspense>
  );
}
