import { Footer } from "@/components/Footer";
import HeroSection from "@/components/HeroSection"; // Importa o componente cliente
import ProductCatalog from "@/components/ProductCatalog"; // Importa o componente servidor

export default function Home() {
  return (
    <div className="font-montserrat relative flex min-h-screen flex-col overflow-x-hidden bg-[#050505] text-white">
      {/* Seção Hero (Cliente - Animações, Auth, Header) */}
      <HeroSection />

      {/* Seção Catálogo (Servidor - Busca no Banco de Dados) */}
      <div id="catalogo">
        <ProductCatalog />
      </div>
      <Footer />
    </div>
  );
}
