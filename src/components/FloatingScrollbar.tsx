"use client";

import React, { useEffect, useState } from "react";

export default function FloatingScrollbar() {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // 1. Calcula a porcentagem do scroll
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const percentage = (currentScroll / totalHeight) * 100;

      setScrollPercentage(percentage);

      // 2. Mostra a barra quando scrola
      setIsVisible(true);

      // 3. Esconde após 1 segundo parado (Efeito minimalista)
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-0 right-1 bottom-0 z-[9999] flex w-3 items-center justify-center mix-blend-difference">
      {/* O TRILHO (Invisível, mas mantém a estrutura) */}
      <div className="relative h-[98vh] w-full">
        {/* A PÍLULA FLUTUANTE */}
        <div
          className={`absolute right-0 w-[6px] rounded-full bg-red-500/20 backdrop-blur-md transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0 hover:opacity-100"
          }`}
          style={{
            height: "100px", // Tamanho fixo da pílula (estilo Lando)
            top: `${scrollPercentage}%`,
            // Ajuste matemático para a pílula não sair da tela no final
            transform: `translateY(-${scrollPercentage}%)`,
          }}
        />
      </div>
    </div>
  );
}
