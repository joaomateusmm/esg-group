"use client";

import { motion, useAnimation, useInView } from "framer-motion";
import React, { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  boxColor?: string;
  delay?: number;
  // NOVO: Prop para controlar externamente se pode animar
  shouldAnimate?: boolean;
}

export const RevealBlockText = ({
  children,
  width = "fit-content",
  boxColor = "#372AAC",
  delay = 0.2,
  // Por padrão é true, assim funciona normalmente em outras partes do site
  shouldAnimate = true,
}: Props) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const mainControls = useAnimation();
  const slideControls = useAnimation();

  useEffect(() => {
    // AQUI ESTÁ O SEGREDO:
    // Só inicia se estiver na tela E se tivermos permissão (shouldAnimate)
    if (isInView && shouldAnimate) {
      mainControls.start("visible");
      slideControls.start("visible");
    }
  }, [isInView, shouldAnimate, mainControls, slideControls]); // Adicionamos shouldAnimate nas dependências

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width,
        overflow: "hidden",
      }}
    >
      {/* O TEXTO */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 0 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{
          duration: 0.01,
          delay: delay + 0.45,
        }}
      >
        {children}
      </motion.div>

      {/* O BLOCO COLORIDO */}
      <motion.div
        variants={{
          hidden: { left: "-100%" },
          visible: { left: "100%" },
        }}
        initial="hidden"
        animate={slideControls}
        transition={{
          duration: 0.9,
          ease: "easeInOut",
          delay: delay,
        }}
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          width: "100%",
          background: boxColor,
          zIndex: 20,
        }}
      />
    </div>
  );
};
