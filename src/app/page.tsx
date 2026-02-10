import FaqSection from "@/components/FaqSection";
// FloatingScrollbar removido daqui, pois já está no Layout
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroBanners } from "@/components/hero-banners";
import ProductCatalog from "@/components/ProductCatalog";
import { ServicesSection } from "@/components/services-section";
import Silk from "@/components/Silk";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return (
    // REMOVIDO: overflow-x-hidden (Isso causava o travamento do scroll)
    <div className="font-montserrat relative flex min-h-screen flex-col">
      <Header />

      <HeroBanners />
      <Silk />

      <div className="mt-5" id="catalogo">
        <ProductCatalog />
      </div>

      <ServicesSection />

      <FaqSection />

      <Footer />
    </div>
  );
}
