import FaqSection from "@/components/FaqSection";
// FloatingScrollbar removido daqui, pois já está no Layout
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroBanners } from "@/components/hero-banners";
import ProductCatalog from "@/components/ProductCatalog";
import Silk from "@/components/Silk";

export default function Home() {
  return (
    // REMOVIDO: overflow-x-hidden (Isso causava o travamento do scroll)
    <div className="font-montserrat relative flex min-h-screen flex-col bg-[#FFFFFF] text-neutral-900">
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
