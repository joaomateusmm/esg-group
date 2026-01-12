import FaqSection from "@/components/FaqSection";
import { Footer } from "@/components/Footer";
import HeroSection from "@/components/HeroSection"; // Importa o componente cliente
import ProductCatalog from "@/components/ProductCatalog"; // Importa o componente servidor
import TestimonialsSection from "@/components/TestimonialsSection";

export default function Home() {
  return (
    <div className="font-montserrat relative flex min-h-screen flex-col overflow-x-hidden bg-[#010000] text-white">
      {/* Seção Hero (Cliente - Animações, Auth, Header) */}
      <HeroSection />

      <div id="catalogo">
        <ProductCatalog />
      </div>
      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </div>
  );
}
