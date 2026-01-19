"use client";

import React, { createContext, ReactNode, useContext, useState } from "react";

// --- 1. O DICIONÁRIO DE TRADUÇÕES ---
// Aqui você vai adicionar TODOS os textos do seu site
const translations = {
  pt: {
    topBar: {
      promo: "Midseason Sale: 20% OFF — Tempo Limitado",
      storeLocator: "Lojas Físicas",
      help: "Ajuda: +44 7861 996199",
    },
    header: {
      searchPlaceholder: "O que você procura?",
      categories: "Categorias",
      games: "Jogos",
      affiliate: "Seja Afiliado",
      panel: "Painel Afiliado",
      faq: "Ajuda & FAQ",
      allCategories: "Todas as Categorias",
      bestDeals: "Melhores Ofertas",
      sale: "Promoção 30% OFF",
      account: {
        login: "Entrar",
        create: "Criar Conta",
        myAccount: "Minha Conta",
        orders: "Meus Pedidos",
        logout: "Sair",
        welcome: "Bem-vindo",
      },
      cart: {
        title: "Meu Carrinho",
        empty: "Seu carrinho está vazio",
        total: "Total",
        checkout: "Finalizar Compra",
      },
      wishlist: {
        title: "Meus Favoritos",
        empty: "Lista vazia",
      },
    },
    hero: {
      shopNow: "Comprar Agora",
      deals: "Ofertas do Dia",
    },
  },
  en: {
    topBar: {
      promo: "Midseason Sale: 20% Off — Limited Time Only",
      storeLocator: "Store Locator",
      help: "Help: +44 7861 996199",
    },
    header: {
      searchPlaceholder: "What are you looking for?",
      categories: "Categories",
      games: "Games",
      affiliate: "Become an Affiliate",
      panel: "Affiliate Panel",
      faq: "Help & FAQ",
      allCategories: "All Categories",
      bestDeals: "Best Deals",
      sale: "Sale 30% off",
      account: {
        login: "Login",
        create: "Sign Up",
        myAccount: "My Account",
        orders: "My Orders",
        logout: "Logout",
        welcome: "Welcome",
      },
      cart: {
        title: "My Cart",
        empty: "Your cart is empty",
        total: "Total",
        checkout: "Checkout",
      },
      wishlist: {
        title: "My Wishlist",
        empty: "Wishlist is empty",
      },
    },
    hero: {
      shopNow: "Shop Now",
      deals: "Deals of the Day",
    },
  },
};

// Tipo para as linguagens disponíveis
type Language = "pt" | "en";

// Tipo do Contexto
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)["pt"]; // Isso ajuda o autocompletar do VS Code
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Estado que guarda a linguagem atual (padrão 'pt')
  const [language, setLanguage] = useState<Language>("pt");

  // Função para mudar a linguagem
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    // Opcional: Salvar no localStorage para lembrar a escolha do usuário
    // localStorage.setItem("site-lang", lang);
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t: translations[language], // Retorna o objeto de tradução correto
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook personalizado para usar fácil nos componentes
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage deve ser usado dentro de um LanguageProvider");
  }
  return context;
}
