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

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    lenis.resize();
    lenis.scrollTo(0, { immediate: true });

    // Debug
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[SmoothScroll] Rota mudou para: ${pathname}. Scroll resetado.`,
      );
    }

    const timeouts = [100, 300, 1000].map((ms) =>
      setTimeout(() => {
        lenis.resize();
        if (process.env.NODE_ENV === "development")
          console.log(`[SmoothScroll] Recálculo de segurança (${ms}ms)`);
      }, ms),
    );

    return () => timeouts.forEach((t) => clearTimeout(t));
  }, [pathname, searchParams]);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    const mutationObserver = new MutationObserver(() => {
      lenis.resize();
    });

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
        lerp: 0.08,
        duration: 1.2,
        smoothWheel: true,
        syncTouch: true,
        touchMultiplier: 2,
      }}
    >
      <style jsx global>{`
        html.lenis,
        html.lenis body {
          height: auto !important;
          overflow: auto !important; /* Deixa o overflow fluir */
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
