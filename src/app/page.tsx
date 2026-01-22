import FaqSection from "@/components/FaqSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header"; // Suponho que você queira o Header aqui também
import { HeroBanners } from "@/components/hero-banners"; // <--- Importe o HeroBanners
import ProductCatalog from "@/components/ProductCatalog";

export default function Home() {
  return (
    <div className="font-montserrat relative flex min-h-screen flex-col overflow-x-hidden bg-[#FFFFFF] text-neutral-900">
      <Header />

      <HeroBanners />
      <div className="mt-28" id="catalogo">
        <ProductCatalog />
      </div>

      <FaqSection />

      <Footer />
    </div>
  );
}
