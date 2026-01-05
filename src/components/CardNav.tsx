import { gsap } from "gsap";
import React, { useLayoutEffect, useRef, useState } from "react";
import { GoArrowUpRight } from "react-icons/go";

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  logo?: string;
  logoAlt?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

const CardNav: React.FC<CardNavProps> = ({
  items,
  className = "",
  ease = "power3.out",
  baseColor = "#0A0A0A",
  menuColor,
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector(".card-nav-content") as HTMLElement;
      if (contentEl) {
        // Clonar o elemento para medir a altura real sem afetar o layout atual
        const clone = contentEl.cloneNode(true) as HTMLElement;
        clone.style.visibility = "hidden";
        clone.style.position = "absolute";
        clone.style.height = "auto";
        clone.style.width = `${navEl.offsetWidth}px`; // Garante que a largura seja a mesma para o wrap do texto
        document.body.appendChild(clone);

        const contentHeight = clone.scrollHeight;
        document.body.removeChild(clone);

        const topBar = 60;
        const padding = 16;
        return topBar + contentHeight + padding;
      }
    }
    return 260; // Altura fixa para desktop (ajuste conforme necessário)
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    // Estado inicial
    gsap.set(navEl, { height: 60, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease,
    });

    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 },
      "-=0.1",
    );

    return tl;
  };

  // Cria a timeline inicial
  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }); // Removi 'items' para evitar recriação desnecessária, mas pode adicionar se os items mudarem dinamicamente

  // Lida com resize
  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      // Recalcula altura apenas se estiver expandido para evitar bugs visuais
      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.to(navRef.current, { height: newHeight, duration: 0.2 });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded]); // Adicionei isExpanded como dependência

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;

    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(); // Toca a animação de abrir
    } else {
      setIsHamburgerOpen(false);
      tl.reverse(); // Toca a animação de fechar
      // Só define isExpanded false quando a animação terminar
      tl.eventCallback("onReverseComplete", () => {
        setIsExpanded(false);
        tl.eventCallback("onReverseComplete", null); // Limpa o callback
      });
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div
      className={`card-nav-container absolute top-[1.2em] left-1/2 z-[999] w-[90%] max-w-[800px] -translate-x-1/2 md:top-[2em] ${className}`}
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""} relative block h-[60px] overflow-hidden rounded-md border border-[#ffffff09] p-0 shadow-2xl will-change-[height]`}
        style={{ backgroundColor: baseColor }}
      >
        {/* Aumentei o z-index aqui para garantir que fique acima do conteúdo expandido */}
        <div className="card-nav-top absolute inset-x-0 top-0 z-[10] flex h-[60px] flex-row-reverse items-center justify-between gap-6 px-6">
          {/* SEARCH BAR */}
          <div className="relative flex-1">
            <div className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Procure pelo nome do produto..."
              className="h-10 w-full rounded-md border border-[#ffffff09] bg-black/20 py-2 pr-4 pl-10 text-sm text-neutral-200 placeholder-neutral-500 duration-300 hover:border-white/10 hover:bg-black/40 focus:border-[#D00000] focus:bg-black/60 focus:outline-none"
            />
          </div>

          {/* HAMBURGER BUTTON */}
          <div
            className={`hamburger-menu ${isHamburgerOpen ? "open" : ""} group flex h-10 w-10 shrink-0 cursor-pointer flex-col items-center justify-center gap-[5px] rounded-md border border-[#ffffff09] bg-black/20 duration-300 hover:border-white/10 hover:bg-black/40`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
            style={{ color: menuColor || "#fff" }}
          >
            <div
              className={`hamburger-line h-[2px] w-[20px] [transform-origin:50%_50%] bg-current transition-[transform,opacity,margin] duration-300 ease-linear ${
                isHamburgerOpen ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <div
              className={`hamburger-line h-[2px] w-[20px] [transform-origin:50%_50%] bg-current transition-[transform,opacity,margin] duration-300 ease-linear ${
                isHamburgerOpen ? "-translate-y-[3.5px] -rotate-45" : ""
              } `}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div
          className={`card-nav-content absolute top-[60px] right-0 bottom-0 left-0 z-[1] flex flex-col items-stretch justify-start gap-2 p-2 md:flex-row md:items-end md:gap-[12px]`}
          style={{ visibility: isExpanded ? "visible" : "hidden" }} // Controla visibilidade via style para evitar flash
          aria-hidden={!isExpanded}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card relative flex h-auto min-h-[60px] min-w-0 flex-[1_1_auto] flex-col gap-2 rounded-[calc(0.75rem-0.2rem)] p-[12px_16px] select-none md:h-full md:min-h-0 md:flex-[1_1_0%]"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label font-clash-display text-[18px] font-medium tracking-[-0.5px] md:text-[22px]">
                {item.label}
              </div>
              <div className="nav-card-links mt-auto flex flex-col gap-[2px]">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link inline-flex cursor-pointer items-center gap-[6px] text-[15px] no-underline transition-opacity duration-300 hover:opacity-75 md:text-[16px]"
                    href={lnk.href}
                    aria-label={lnk.ariaLabel}
                  >
                    <GoArrowUpRight
                      className="nav-card-link-icon shrink-0"
                      aria-hidden="true"
                    />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
