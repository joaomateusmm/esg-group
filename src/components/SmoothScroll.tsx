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

  // Resetar o scroll para o topo sempre que mudar de rota
  useEffect(() => {
    if (lenisRef.current?.lenis) {
      // scroll to top immediately
      lenisRef.current.lenis.scrollTo(0, { immediate: true });
    }
  }, [pathname, searchParams]);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        lerp: 0.08,
        duration: 1.2,
        smoothWheel: true,
      }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {children as any}
    </ReactLenis>
  );
}

export default SmoothScroll;
