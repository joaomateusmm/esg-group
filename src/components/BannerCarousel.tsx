"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export function BannerCarousel() {
  const bannerImages = [
    { src: "/images/banner/banner-5.webp", alt: "Banner Principal Valorant" },
    { src: "/images/banner/banner-6.webp", alt: "Banner Secundário" },
    { src: "/images/banner/banner-3.webp", alt: "Banner Terciário" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) =>
      prevIndex === bannerImages.length - 1 ? 0 : prevIndex + 1,
    );
  }, [bannerImages.length]);

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? bannerImages.length - 1 : prevIndex - 1,
    );
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Autoplay
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    // ADICIONADO: Animação de entrada do container inteiro
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 0.8,
      }}
      className="mb-12 flex flex-col items-center"
    >
      <div className="relative h-auto w-[85vw] md:w-[60vw]">
        {/* Seta Esquerda */}
        <button
          onClick={prevSlide}
          className="absolute top-1/2 left-[-20px] z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-black/20 p-2 text-white/50 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white md:left-[-50px] md:flex"
          aria-label="Imagem Anterior"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Container da Imagem */}
        <div className="relative aspect-[1800/1050] w-full overflow-hidden rounded-md">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 h-full w-full"
            >
              <Image
                src={bannerImages[currentIndex].src}
                alt={bannerImages[currentIndex].alt}
                fill
                priority={currentIndex === 0} // Apenas a primeira é prioridade
                className="object-cover shadow-md"
                sizes="(min-width: 768px) 60vw, 85vw"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Seta Direita */}
        <button
          onClick={nextSlide}
          className="absolute top-1/2 right-[-20px] z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-black/20 p-2 text-white/50 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white md:right-[-50px] md:flex"
          aria-label="Próxima Imagem"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dots de Navegação */}
      <div className="mt-4 flex flex-row items-center justify-center gap-2">
        {bannerImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              currentIndex === index
                ? "scale-110 bg-neutral-200"
                : "bg-neutral-800 hover:bg-neutral-600"
            }`}
            aria-label={`Ir para imagem ${index + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
