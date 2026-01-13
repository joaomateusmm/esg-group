import FaqSection from "@/components/FaqSection";
import { Footer } from "@/components/Footer";
import HeroSection from "@/components/HeroSection"; // Importa o componente cliente
import ProductCatalog from "@/components/ProductCatalog"; // Importa o componente servidor
import { StatsSection } from "@/components/stats-section";
import TestimonialsSection from "@/components/TestimonialsSection";

export default function Home() {
  return (
    <div className="font-montserrat relative flex min-h-screen flex-col overflow-x-hidden bg-[#010000] text-white">

      <HeroSection />

      <div className="mt-28" id="catalogo">
        <ProductCatalog />
      </div>

      <div className="mx-auto max-w-[90vw] px-4 md:px-8">
        <StatsSection />
      </div>

      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </div>
  );
}
