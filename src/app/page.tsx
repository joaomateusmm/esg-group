import FaqSection from "@/components/FaqSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header"; // Suponho que você queira o Header aqui também
import { HeroBanners } from "@/components/hero-banners"; // <--- Importe o HeroBanners
import ProductCatalog from "@/components/ProductCatalog";
import { StatsSection } from "@/components/stats-section";
import TestimonialsSection from "@/components/TestimonialsSection";

export default function Home() {
  return (
    <div className="font-montserrat relative flex min-h-screen flex-col overflow-x-hidden bg-[#FFFFFF] text-neutral-900">
      {/* Adicionei o Header aqui para ficar completo, se não precisar, pode remover */}
      <Header />

      {/* AQUI ESTÁ A CORREÇÃO: Usar HeroBanners em vez de BannerCard */}
      <HeroBanners />

      <div className="mt-28" id="catalogo">
        <ProductCatalog />
      </div>

      {/* AJUSTE AQUI: Padding responsivo progressivo */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8 lg:px-12">
        <StatsSection />
      </div>

      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </div>
  );
}
