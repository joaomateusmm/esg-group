import { desc, eq } from "drizzle-orm"; // Adicionei 'eq'
import { ArrowLeft, Frown } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/db";
import { category, product } from "@/db/schema";

// --- FUNÇÃO PARA GERAR SLUG CORRIGIDA ---
// Agora ela remove acentos, igual à action que cria os links
function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD") // Separa acentos
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-") // Substitui espaços/símbolos por hífen
    .replace(/^-+|-+$/g, ""); // Remove hífens sobrando
}

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  // 1. Tenta buscar diretamente pela coluna 'slug' no banco (Mais rápido e correto)
  let currentCategory = await db.query.category.findFirst({
    where: eq(category.slug, slug),
  });

  // 2. Fallback: Se não achar pelo slug (ex: categorias antigas), procura pelo nome
  if (!currentCategory) {
    const allCategories = await db.select().from(category);
    currentCategory = allCategories.find((c) => {
      // Usa o slug salvo ou gera um na hora para comparar
      const catSlug = c.slug || generateSlug(c.name);
      return catSlug === slug;
    });
  }

  // Se mesmo assim não achar, retorna 404
  if (!currentCategory) {
    return notFound();
  }

  // 3. Buscar produtos e filtrar pelo ID da categoria
  const allProducts = await db
    .select()
    .from(product)
    .orderBy(desc(product.createdAt));

  const categoryProducts = allProducts.filter((p) => {
    // Verifica se categories não é null e é um array
    const cats = Array.isArray(p.categories) ? p.categories : [];
    // O ID da categoria atual está na lista de categorias do produto?
    return cats.includes(currentCategory.id);
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-36 pb-16 md:px-8">
        {/* --- CABEÇALHO DA CATEGORIA --- */}
        <div className="mb-12 flex flex-col gap-4">
          <Link
            href="/"
            className="flex w-fit items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o catálogo
          </Link>

          <div>
            <h1 className="font-clash-display text-4xl font-medium text-black capitalize md:text-5xl">
              {currentCategory.name}
            </h1>
            <p className="mt-2 text-neutral-700">
              {currentCategory.description ||
                `Confira os melhores produtos da categoria ${currentCategory.name}.`}
            </p>
          </div>
        </div>

        {/* --- GRID DE PRODUTOS --- */}
        {categoryProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#f4f4f4] py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 shadow-md">
              <Frown className="h-8 w-8 text-neutral-700" />
            </div>
            <h3 className="text-xl font-medium text-black">
              Nenhum produto encontrado
            </h3>
            <p className="mt-2 text-neutral-400">
              Ainda não temos produtos cadastrados nesta categoria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                data={{
                  id: prod.id,
                  name: prod.name,
                  description: prod.description,
                  price: prod.price,
                  discountPrice: prod.discountPrice,
                  images: prod.images,
                  stock: prod.stock,
                  isStockUnlimited: prod.isStockUnlimited ?? false,
                  // IMPORTANTE: Adicionei a moeda aqui
                  currency: prod.currency,
                }}
                categoryName={currentCategory!.name}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
