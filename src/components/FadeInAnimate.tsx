"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface FadeInAnimateProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  amount?: "some" | "all" | number; // Quanto do elemento precisa aparecer para animar
}

export function FadeInAnimate({
  children,
  className,
  delay = 0,
  duration = 0.6,
  direction = "up",
  amount = 0.2, // 20% do elemento visível dispara a animação
}: FadeInAnimateProps) {
  // Configuração da direção inicial
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: 40, x: 0 };
      case "down":
        return { y: -40, x: 0 };
      case "left":
        return { x: 40, y: 0 };
      case "right":
        return { x: -40, y: 0 };
      case "none":
        return { x: 0, y: 0 };
      default:
        return { y: 40, x: 0 };
    }
  };

  const initialPos = getInitialPosition();

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...initialPos,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{
        once: true, // Anima apenas na primeira vez que aparece
        amount: amount,
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.21, 0.47, 0.32, 0.98], // Curva Bezier suave (estilo Apple/Stripe)
      }}
      className={cn("w-full", className)} // Permite passar classes extras
    >
      {children}
    </motion.div>
  );
}
