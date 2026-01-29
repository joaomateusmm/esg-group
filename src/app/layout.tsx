import "./globals.css";

import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { Suspense } from "react";
import { Toaster } from "sonner";

import { CouponPopup } from "@/components/coupon-popup";
import FloatingScrollbar from "@/components/FloatingScrollbar";
import { GoogleTranslator } from "@/components/google-translator";
import SmoothScroll from "@/components/SmoothScroll";
import { LanguageProvider } from "@/contexts/language-context";
import { db } from "@/db";
import { coupon } from "@/db/schema";

// Configuração de fontes (mantidas)
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
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

// 1. Criamos um componente separado para o Cupom para não travar o RootLayout
async function CouponDataWrapper() {
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

    if (featuredCoupon?.isActive) {
      const activePromo = {
        code: featuredCoupon.code,
        value: featuredCoupon.value,
        type: featuredCoupon.type as "percent" | "fixed",
        title: featuredCoupon.popupTitle,
        description: featuredCoupon.popupDescription,
      };
      return <CouponPopup coupon={activePromo} />;
    }
  } catch (error) {
    console.error("Erro ao buscar cupom destaque:", error);
  }
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${clash.variable} antialiased`}
      >
        {/* Suspense Global para capturar hooks de busca em qualquer lugar */}
        <Suspense fallback={null}>
          <FloatingScrollbar />
          <GoogleTranslator />
          <LanguageProvider>
            <SmoothScroll>{children}</SmoothScroll>

            {/* 2. O Cupom agora carrega em paralelo e não trava o carregamento do site */}
            <Suspense fallback={null}>
              <CouponDataWrapper />
            </Suspense>

            <Toaster position="top-left" />
          </LanguageProvider>
        </Suspense>
      </body>
    </html>
  );
}
