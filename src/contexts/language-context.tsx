"use client";

import { getCookie, setCookie } from "cookies-next";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "pt" | "en" | "es";

// 1. Definimos o objeto de fallback
const defaultTranslations = {
  topBar: {
    promo: "Frete Grátis...",
    storeLocator: "Lojas",
    help: "Ajuda",
  },
  header: {
    allCategories: "Todas as Categorias", // Usado na barra de pesquisa
    categories: "Categorias", // <--- ADICIONADO (Correção do erro)
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
  t: TranslationType;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");

  // Ao iniciar, lê o cookie do Google
  useEffect(() => {
    const googCookie = getCookie("googtrans");
    if (typeof googCookie === "string") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const langCode = googCookie.split("/").pop() as any;
      if (["pt", "en", "es"].includes(langCode)) {
        setLanguageState(langCode as Language);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    // Define o cookie para o Google Translate
    setCookie("googtrans", `/auto/${lang}`, {
      path: "/",
      domain: window.location.hostname,
    });
    setCookie("googtrans", `/auto/${lang}`, { path: "/" });

    // Atualiza estado local
    setLanguageState(lang);

    // Recarrega a página para aplicar a tradução visual do Google
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
