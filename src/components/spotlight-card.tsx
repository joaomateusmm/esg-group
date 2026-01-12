"use client";

import React, { MouseEvent, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlightColor?: string;
}

export const SpotlightCard = ({
  children,
  className,
  spotlightColor = "rgba(255, 255, 255, 0.15)",
  ...props
}: SpotlightCardProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Refs para guardar as posições sem renderizar o componente
  const mousePosition = useRef({ x: 0, y: 0 });
  const spotlightPosition = useRef({ x: 0, y: 0 });

  const [opacity, setOpacity] = useState(0);

  // Configuração da suavidade (0.01 a 1.0)
  // Menor = Mais pesado/lento | Maior = Mais rápido/colado
  const smoothness = 0.08;

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      // Cálculo de Lerp (Linear Interpolation)
      // Posição Atual += (Alvo - Posição Atual) * velocidade
      spotlightPosition.current.x +=
        (mousePosition.current.x - spotlightPosition.current.x) * smoothness;
      spotlightPosition.current.y +=
        (mousePosition.current.y - spotlightPosition.current.y) * smoothness;

      if (overlayRef.current) {
        const { x, y } = spotlightPosition.current;
        overlayRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, ${spotlightColor}, transparent 40%)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [spotlightColor]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    // Apenas atualizamos o "Alvo", a animação corre atrás dele
    mousePosition.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-xl bg-[#040404] text-neutral-200 transition-colors",
        className,
      )}
      {...props}
    >
      <div
        ref={overlayRef}
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          // O background agora é controlado via ref no useEffect para performance
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
