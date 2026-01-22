"use client";

import { getCookie,setCookie } from "cookies-next"; // Instale: npm install cookies-next
import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "pt" | "en" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  // Mantemos o 't' vazio ou com fallback para não quebrar componentes antigos
  t: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");

  // Ao iniciar, lê o cookie do Google
  useEffect(() => {
    // O cookie do google geralmente é 'googtrans'
    const googCookie = getCookie("googtrans");
    if (typeof googCookie === "string") {
      // O formato é /pt/en ou /auto/en
      const langCode = googCookie.split("/").pop() as Language;
      if (["pt", "en", "es"].includes(langCode)) {
        setLanguageState(langCode);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    // 1. Define o cookie que o Google Translate lê
    // Formato: /lingua-origem/lingua-destino
    setCookie("googtrans", `/auto/${lang}`, {
      path: "/",
      domain: window.location.hostname,
    });
    setCookie("googtrans", `/auto/${lang}`, { path: "/" }); // Fallback

    // 2. Atualiza estado local
    setLanguageState(lang);

    // 3. Recarrega a página para o Google traduzir o DOM
    window.location.reload();
  };

  // Objeto 't' dummy para não quebrar seu código existente
  // O Google vai traduzir o texto visualmente, então isso aqui importa pouco agora
  const t = {
    topBar: { promo: "Frete Grátis...", storeLocator: "Lojas", help: "Ajuda" },
    header: {
      allCategories: "Categorias",
      searchPlaceholder: "Buscar...",
      bestDeals: "Ofertas",
      sale: "Promoção",
      wishlist: { title: "Lista", empty: "Vazia" },
      account: { myAccount: "Conta", orders: "Pedidos", logout: "Sair" },
      cart: {
        title: "Carrinho",
        empty: "Vazio",
        total: "Total",
        checkout: "Checkout",
      },
    },
    product: {
      description: "Descrição",
      specs: "Especificações",
      reviews: "Avaliações",
    },
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
