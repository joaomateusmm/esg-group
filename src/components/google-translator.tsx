"use client";

import Script from "next/script";
import { useEffect } from "react";

// Definição de tipos mais segura para evitar 'any'
interface GoogleTranslateElement {
  new (
    config: {
      pageLanguage: string;
      includedLanguages: string;
      layout: number; // Enum numérico do layout
      autoDisplay: boolean;
    },
    targetId: string,
  ): void;
  InlineLayout: {
    SIMPLE: number;
  };
}

interface GoogleTranslate {
  TranslateElement: GoogleTranslateElement;
}

declare global {
  interface Window {
    google?: {
      translate: GoogleTranslate;
    };
    googleTranslateElementInit?: () => void;
  }
}

export function GoogleTranslator() {
  useEffect(() => {
    // 1. Configuração do Google Translate
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "pt",
            includedLanguages: "pt,en,es",
            layout:
              window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element",
        );
      }
    };

    // 2. FORÇA BRUTA: MutationObserver
    const observer = new MutationObserver(() => {
      const body = document.body;
      const googleIframe = document.querySelector(".goog-te-banner-frame");
      const googleGadget = document.querySelector(".goog-te-gadget-simple");

      // Força o body a ficar no topo
      if (body.style.top !== "0px" && body.style.top !== "") {
        body.style.top = "0px";
        body.style.position = "static";
      }

      // Esconde o iframe da barra superior se ele existir
      if (googleIframe) {
        (googleIframe as HTMLElement).style.display = "none";
        (googleIframe as HTMLElement).style.visibility = "hidden";
        (googleIframe as HTMLElement).style.height = "0";
      }

      // Esconde o gadget flutuante se aparecer
      if (googleGadget) {
        (googleGadget as HTMLElement).style.display = "none";
      }
    });

    // Começa a observar mudanças de estilo no body e no DOM
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
    });

    // Limpeza ao desmontar
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx global>{`
        /* Esconde o iframe da barra superior */
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
        }

        /* Regra extra para iframes do Google */
        iframe[id^=":"] {
          display: none !important;
        }

        /* Força o body a não ter margem no topo */
        body {
          top: 0px !important;
          position: static !important;
          margin-top: 0px !important;
        }

        /* Oculta o container do widget */
        #google_translate_element {
          display: none !important;
          visibility: hidden !important;
          width: 0px !important;
          height: 0px !important;
        }

        /* Oculta tooltips/popups de tradução ao passar o mouse */
        .goog-tooltip {
          display: none !important;
          visibility: hidden !important;
        }

        .goog-tooltip:hover {
          display: none !important;
        }

        /* Remove o fundo azul/amarelo dos textos traduzidos */
        .goog-text-highlight {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Esconde o logo do Google */
        .goog-logo-link {
          display: none !important;
        }

        .goog-te-gadget {
          height: 0 !important;
          overflow: hidden !important;
        }

        /* Remove qualquer padding que o google adicione no html */
        html {
          height: 100% !important;
          margin-top: 0 !important;
        }
      `}</style>

      <div
        id="google_translate_element"
        className="fixed right-0 bottom-0 z-[-1] hidden h-0 w-0"
      ></div>

      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
