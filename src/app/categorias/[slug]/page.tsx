import { desc } from "drizzle-orm";
import { ArrowLeft, Frown } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/db";
import { category, product } from "@/db/schema";

// --- FUNÇÃO PARA GERAR SLUG ---
function generateSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

interface CategoryPageProps {
  // CORREÇÃO: params agora é uma Promise
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // CORREÇÃO: Precisamos usar 'await' para pegar os dados do params
  const { slug } = await params;

  // 1. Buscar a categoria correta baseada no Slug
  const allCategories = await db.select().from(category);

  const currentCategory = allCategories.find(
    (c) => generateSlug(c.name) === slug,
  );

  // Se não achar a categoria, retorna 404
  if (!currentCategory) {
    return notFound();
  }

  // 2. Buscar produtos e filtrar pelo ID da categoria
  const allProducts = await db
    .select()
    .from(product)
    .orderBy(desc(product.createdAt));

  const categoryProducts = allProducts.filter((p) => {
    const cats = Array.isArray(p.categories) ? p.categories : [];
    return cats.includes(currentCategory.id);
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#010000]">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-42 md:px-8">
        {/* --- CABEÇALHO DA CATEGORIA --- */}
        <div className="mb-12 flex flex-col gap-4">
          <Link
            href="/"
            className="flex w-fit items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o catálogo
          </Link>

          <div>
            <h1 className="font-clash-display text-4xl font-medium text-white capitalize md:text-5xl">
              {currentCategory.name}
            </h1>
            <p className="mt-2 text-neutral-400">
              Confira os melhores produtos da categoria {currentCategory.name}.
            </p>
          </div>
        </div>

        {/* --- GRID DE PRODUTOS --- */}
        {categoryProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#0A0A0A] py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Frown className="h-8 w-8 text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium text-white">
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
                  // --- CORREÇÃO: Adicionando as props de estoque ---
                  stock: prod.stock,
                  isStockUnlimited: prod.isStockUnlimited ?? false, // Garante booleano caso venha null
                }}
                categoryName={currentCategory.name}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
