import FaqSection from "@/components/FaqSection";
import { Footer } from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ProductCatalog from "@/components/ProductCatalog";
import { StatsSection } from "@/components/stats-section";
import TestimonialsSection from "@/components/TestimonialsSection";

export default function Home() {
  return (
    <div className="font-montserrat relative flex min-h-screen flex-col overflow-x-hidden bg-[#010000] text-white">
      <HeroSection />

      <div className="mt-28" id="catalogo">
        <ProductCatalog />
      </div>

      {/* AJUSTE AQUI: Padding responsivo progressivo em vez de px-90 direto */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8 lg:px-12">
        <StatsSection />
      </div>

      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </div>
  );
}
