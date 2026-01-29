import FaqSection from "@/components/FaqSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header"; // Suponho que você queira o Header aqui também
import { HeroBanners } from "@/components/hero-banners"; // <--- Importe o HeroBanners
import ProductCatalog from "@/components/ProductCatalog";
import Silk from "@/components/Silk";

export default function Home() {
  return (
    <div className="font-montserrat relative flex min-h-screen flex-col overflow-x-hidden bg-[#FFFFFF] text-neutral-900">
      <Header />

      <HeroBanners />
      <Silk />
      <div className="mt-5" id="catalogo">
        <ProductCatalog />
      </div>

      <FaqSection />

      <Footer />
    </div>
  );
}
