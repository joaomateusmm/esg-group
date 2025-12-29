"use client";

import { type ClassValue, clsx } from "clsx";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Alterei o tipo para focar em imagens, mas mantive node como opcional
type LogoItem = {
  src: string; // Agora é o principal
  alt: string; // Obrigatório para acessibilidade
  href?: string;
  node?: React.ReactNode; // Mantido apenas para retrocompatibilidade
};

interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: "left" | "right";
  logoHeight?: number;
  gap?: number;
  hoverSpeed?: number;
  scaleOnHover?: boolean;
  fadeOut?: boolean;
  fadeOutColor?: string;
  ariaLabel?: string;
  className?: string;
}

export default function LogoLoop({
  logos,
  speed = 40,
  direction = "left",
  logoHeight = 48,
  gap = 40,
  hoverSpeed = 0,
  scaleOnHover = true,
  fadeOut = true,
  ariaLabel = "Partners",
  className,
}: LogoLoopProps) {
  const [currentSpeed, setCurrentSpeed] = useState(speed);
  const repeatedLogos = [...logos, ...logos, ...logos];

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{
        maskImage: fadeOut
          ? `linear-gradient(to right, transparent, black 20%, black 80%, transparent)`
          : undefined,
        WebkitMaskImage: fadeOut
          ? `linear-gradient(to right, transparent, black 20%, black 80%, transparent)`
          : undefined,
      }}
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={() => setCurrentSpeed(hoverSpeed)}
      onMouseLeave={() => setCurrentSpeed(speed)}
    >
      <motion.div
        className="flex w-max items-center"
        style={{ gap: `${gap}px` }}
        animate={{
          x: direction === "left" ? ["0%", "-33.33%"] : ["-33.33%", "0%"],
        }}
        transition={{
          duration: currentSpeed,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {repeatedLogos.map((logo, index) => (
          <a
            key={index}
            href={logo.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center transition-all duration-300",
              scaleOnHover && "hover:scale-110 hover:brightness-125",
            )}
            style={{ height: `${logoHeight}px` }}
            title={logo.alt}
          >
            {/* Prioridade para Imagem (SRC) */}
            {logo.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo.src}
                alt={logo.alt}
                style={{
                  height: "100%",
                  width: "auto",
                  objectFit: "contain",
                  maxWidth: "none", // Garante que a imagem não seja esmagada
                }}
              />
            ) : (
              // Fallback para Node (se ainda existir algum antigo)
              <div
                style={{ fontSize: `${logoHeight}px` }}
                className="flex items-center justify-center"
              >
                {logo.node}
              </div>
            )}
          </a>
        ))}
      </motion.div>
    </div>
  );
}
