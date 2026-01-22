import "./globals.css";

import { eq } from "drizzle-orm"; // Import necessário
import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";

import { CouponPopup } from "@/components/coupon-popup"; // Importe o componente que criamos
import FloatingScrollbar from "@/components/FloatingScrollbar";
import { GoogleTranslator } from "@/components/google-translator";
import SmoothScroll from "@/components/SmoothScroll";
import { LanguageProvider } from "@/contexts/language-context";
import { db } from "@/db"; // Importe seu db
import { coupon } from "@/db/schema"; // Importe o schema

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const clash = localFont({
  src: [
    {
      path: "../fonts/ClashDisplay-Variable.ttf",
      style: "normal",
      weight: "100 900",
    },
  ],
  variable: "--font-clash-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ESG Group - Ecommerce",
  description:
    "Compre móveis e Contrate serviços, no melhor preço da Inglaterra.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Buscar se existe algum cupom destacado (Server-side)
  // Usamos try/catch para evitar que erro no banco quebre o site todo
  let activePromo = null;
  try {
    const featuredCoupon = await db.query.coupon.findFirst({
      where: eq(coupon.isFeatured, true),
      columns: {
        code: true,
        value: true,
        type: true,
        isActive: true,
        popupTitle: true,
        popupDescription: true,
      },
    });

    // Só exibimos se ele existir E estiver ativo
    if (featuredCoupon && featuredCoupon.isActive) {
      activePromo = {
        code: featuredCoupon.code,
        value: featuredCoupon.value,
        type: featuredCoupon.type as "percent" | "fixed",
        title: featuredCoupon.popupTitle,
        description: featuredCoupon.popupDescription,
      };
    }
  } catch (error) {
    console.error("Erro ao buscar cupom destaque:", error);
  }

  return (
    <html lang="pt-br">
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${clash.variable} antialiased`}
      >
        <FloatingScrollbar />
        <GoogleTranslator />
        <LanguageProvider>
          <SmoothScroll>{children}</SmoothScroll>

          {/* Inserimos o Pop-up aqui, passando os dados */}
          <CouponPopup coupon={activePromo} />

          <Toaster position="top-left" />
        </LanguageProvider>
      </body>
    </html>
  );
}
