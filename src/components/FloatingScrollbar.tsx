"use client";

import React, { useEffect, useState } from "react";

export default function FloatingScrollbar() {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // 1. Calcula a altura total rolável
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      // Se a página for menor que a tela, não faz nada (ou define como 0)
      if (totalHeight <= 0) {
        setScrollPercentage(0);
        return;
      }

      const currentScroll = window.scrollY;
      const percentage = (currentScroll / totalHeight) * 100;

      // Garante que o valor fique entre 0 e 100
      const safePercentage = Math.min(100, Math.max(0, percentage));

      setScrollPercentage(safePercentage);

      // 2. Mostra a barra quando scrola ou redimensiona
      setIsVisible(true);

      // 3. Esconde após 1 segundo parado
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    };

    // Adiciona listeners para SCROLL e RESIZE (mudança de tamanho da tela)
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    // Chama uma vez no início para garantir que a barra esteja na posição certa ao carregar
    handleScroll();

    return () => {
      // Remove os listeners corretamente ao desmontar
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-0 right-1 bottom-0 z-[9999] flex w-3 items-center justify-center mix-blend-difference">
      {/* O TRILHO */}
      <div className="relative h-[98vh] w-full">
        {/* A PÍLULA FLUTUANTE */}
        <div
          className={`absolute right-0 w-[6px] rounded-full bg-red-500/20 backdrop-blur-md transition-opacity duration-300 ${
            isVisible ? "opacity-100" : "opacity-0 hover:opacity-100"
          }`}
          style={{
            height: "100px",
            top: `${scrollPercentage}%`,
            // Ajuste para centralizar a pílula no ponto percentual
            transform: `translateY(-${scrollPercentage}%)`,
          }}
        />
      </div>
    </div>
  );
}
