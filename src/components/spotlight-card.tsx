"use client";

import React, { MouseEvent, useRef, useState } from "react";

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

  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || !overlayRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Atualização direta do estilo no evento do mouse
    // Removemos o loop requestAnimationFrame constante e o Lerp pesado
    // Para um efeito spotlight, a resposta instantânea geralmente é melhor e muito mais leve
    overlayRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, ${spotlightColor}, transparent 40%)`;
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
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
