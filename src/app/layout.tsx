import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";

import FloatingScrollbar from "@/components/FloatingScrollbar";
import SmoothScroll from "@/components/SmoothScroll";

// ... configurações da Geist e Montserrat mantidas iguais ...
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
  title: "SubMind - Loja Virtual",
  description:
    "A melhor loja de Citizens, Configs Privadas e Mod Sons premium, oferecendo soluções inovadoras e de alta qualidade para melhorar a sua experiencia de jogo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        // Verifique se não há espaços extras que quebrem a string, mas o teu estava ok
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${clash.variable} antialiased`}
      >
        <FloatingScrollbar />
        <SmoothScroll>{children}</SmoothScroll>
        <Toaster />
      </body>
    </html>
  );
}
