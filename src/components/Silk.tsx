"use client";

import {
  BadgePercent,
  CreditCard,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// --- DADOS ---
const benefits = [
  {
    icon: Truck,
    title: "Frete",
    subtitle: "Frete Grátis em Londres",
  },
  {
    icon: BadgePercent,
    title: "Descontos",
    subtitle: "5% utilizando cupons",
  },
  {
    icon: Package,
    title: "Produto Montado",
    subtitle: "Mais praticidade",
  },
  {
    icon: CreditCard,
    title: "Pague com Cartão",
    subtitle: "Confira valores s/ juros",
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    subtitle: "Loja oficial",
  },
];

// --- CONFIGURAÇÃO DA ANIMAÇÃO ---
const ANIMATION_CONFIG = {
  SMOOTH_TAU: 0.25,
  MIN_COPIES: 2,
  COPY_HEADROOM: 2,
} as const;

// --- HOOKS ---

const useResizeObserver = (
  callback: () => void,
  elements: Array<React.RefObject<Element | null>>,
  dependencies: React.DependencyList,
) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.ResizeObserver) {
      const handleResize = () => callback();
      window.addEventListener("resize", handleResize);
      callback();
      return () => window.removeEventListener("resize", handleResize);
    }

    const observers = elements.map((ref) => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });

    callback();

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

const useAnimationLoop = (
  trackRef: React.RefObject<HTMLDivElement | null>,
  targetVelocity: number,
  seqWidth: number,
  isHovered: boolean,
  hoverSpeed: number | undefined,
) => {
  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const seqSize = seqWidth;

    if (seqSize > 0) {
      offsetRef.current = ((offsetRef.current % seqSize) + seqSize) % seqSize;
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime =
        Math.max(0, timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      const target =
        isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;

      const easingFactor =
        1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * easingFactor;

      if (seqSize > 0) {
        let nextOffset = offsetRef.current + velocityRef.current * deltaTime;
        nextOffset = ((nextOffset % seqSize) + seqSize) % seqSize;
        offsetRef.current = nextOffset;
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimestampRef.current = null;
    };
    // CORREÇÃO AQUI: Adicionado trackRef nas dependências
  }, [targetVelocity, seqWidth, isHovered, hoverSpeed, trackRef]);
};

// --- COMPONENTE DO LOOP (MARQUEE) ---
interface BenefitsLoopProps {
  speed?: number;
  gap?: number;
  pauseOnHover?: boolean;
}

const BenefitsLoop = ({
  speed = 10,
  gap = 16,
  pauseOnHover = true,
}: BenefitsLoopProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLUListElement>(null);

  const [seqWidth, setSeqWidth] = useState<number>(0);
  const [copyCount, setCopyCount] = useState<number>(
    ANIMATION_CONFIG.MIN_COPIES,
  );
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const targetVelocity = useMemo(() => Math.abs(speed), [speed]);

  const updateDimensions = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const sequenceRect = seqRef.current?.getBoundingClientRect?.();
    const sequenceWidth = sequenceRect?.width ?? 0;

    if (sequenceWidth > 0) {
      setSeqWidth(Math.ceil(sequenceWidth));
      const copiesNeeded =
        Math.ceil(containerWidth / sequenceWidth) +
        ANIMATION_CONFIG.COPY_HEADROOM;
      setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
    }
  }, []);

  useResizeObserver(updateDimensions, [containerRef, seqRef], []);

  useAnimationLoop(
    trackRef,
    targetVelocity,
    seqWidth,
    isHovered,
    pauseOnHover ? 0 : undefined,
  );

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const lists = Array.from({ length: copyCount }, (_, i) => (
    <ul
      key={`copy-${i}`}
      ref={i === 0 ? seqRef : undefined}
      className="flex items-center"
      aria-hidden={i > 0}
    >
      {benefits.map((item, idx) => {
        const Icon = item.icon;
        return (
          <li
            key={idx}
            className="flex-none"
            style={{ paddingRight: `${gap}px` }}
          >
            <div className="mb-4 flex w-[260px] flex-shrink-0 items-center gap-3 rounded-xl border border-neutral-100 p-3 shadow-lg shadow-neutral-200">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100/50 text-orange-600">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <h3 className="text-sm font-bold tracking-wide whitespace-nowrap text-neutral-900 uppercase">
                  {item.title}
                </h3>
                <p className="text-xs whitespace-nowrap text-neutral-500">
                  {item.subtitle}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  ));

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_64px,_black_calc(100%-64px),transparent_100%)] select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Benefícios em destaque"
    >
      <div
        ref={trackRef}
        className="flex w-max will-change-transform"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        {lists}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function Silk() {
  return (
    <section className="w-full bg-white py-6 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        {/* MOBILE */}
        <div className="block lg:hidden">
          <div className="mb-4 px-4">
            <h3 className="text-xs font-bold tracking-wider text-neutral-400 uppercase">
              Nossos Benefícios
            </h3>
          </div>
          <BenefitsLoop speed={30} gap={18} />
        </div>

        {/* DESKTOP */}
        <div className="hidden px-4 md:px-8 lg:block">
          <div className="grid grid-cols-5 gap-8">
            {benefits.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="group flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105"
                >
                  <div className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold tracking-widest text-neutral-900 uppercase">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-neutral-500">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
