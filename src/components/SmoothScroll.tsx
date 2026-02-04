"use client";

import { ReactLenis } from "@studio-freight/react-lenis";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

interface SmoothScrollProps {
  children: React.ReactNode;
}

function SmoothScroll({ children }: SmoothScrollProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lenisRef = useRef<any>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Função de Debounce para evitar recálculos excessivos (Performance)
  const debounce = (fn: () => void, ms: number) => {
    let timer: NodeJS.Timeout;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn();
      }, ms);
    };
  };

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    // Reseta o scroll ao mudar de página
    lenis.scrollTo(0, { immediate: true });

    // Diminuímos a frequência de chamadas aqui também
    const timer = setTimeout(() => {
      lenis.resize();
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    // Otimização: Debounce para não calcular pixel por pixel
    const handleResize = debounce(() => {
      lenis.resize();
    }, 100); // Espera 100ms antes de recalcular

    const resizeObserver = new ResizeObserver(handleResize);
    const mutationObserver = new MutationObserver(handleResize);

    if (document.body) {
      resizeObserver.observe(document.body);
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        // CONFIGURAÇÕES DE "PESO" E SENSIBILIDADE
        lerp: 0.065, // Reduzi para dar mais sensação de peso (inércia)
        duration: 1.5, // Duração um pouco maior para suavizar a parada
        smoothWheel: true,
        wheelMultiplier: 0.8, // Roda do mouse percorre menos distância (mais controle)

        // CONFIGURAÇÕES MOBILE
        syncTouch: true,
        touchMultiplier: 0.8, // Reduzi de 2 para 0.8. Isso resolve a velocidade excessiva no celular.
      }}
    >
      <style jsx global>{`
        html.lenis,
        html.lenis body {
          height: auto !important;
          overflow: auto !important;
        }
        .lenis.lenis-smooth {
          scroll-behavior: auto !important;
        }
        .lenis.lenis-smooth [data-lenis-prevent] {
          overscroll-behavior: contain;
        }
        .lenis.lenis-stopped {
          overflow: hidden;
        }
      `}</style>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {children as any}
    </ReactLenis>
  );
}

export default SmoothScroll;
