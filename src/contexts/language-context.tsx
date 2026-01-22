"use client";

import { getCookie, setCookie } from "cookies-next";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "pt" | "en" | "es";

// 1. Definimos o objeto de fallback fora para poder extrair o tipo dele
const defaultTranslations = {
  topBar: {
    promo: "Frete Grátis...",
    storeLocator: "Lojas",
    help: "Ajuda",
  },
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

// 2. Criamos um Tipo baseado na estrutura do objeto acima
type TranslationType = typeof defaultTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  // 3. Substituímos 'any' pelo tipo correto
  t: TranslationType;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const langCode = googCookie.split("/").pop() as any; // Cast forçado temporário para validar string
      if (["pt", "en", "es"].includes(langCode)) {
        setLanguageState(langCode as Language);
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

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: defaultTranslations }}
    >
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
