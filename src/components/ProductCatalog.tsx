import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { category, product } from "@/db/schema";

import { ProductCard } from "./ProductCard"; // <--- Importamos o novo componente
import { Button } from "./ui/button";

export default async function ProductCatalog() {
  const allCategories = await db.select().from(category);

  const allProducts = await db
    .select()
    .from(product)
    .where(eq(product.status, "active"))
    .orderBy(desc(product.createdAt));

  const categoriesWithProducts = allCategories
    .map((cat) => {
      const productsInCat = allProducts.filter((prod) =>
        prod.categories?.includes(cat.id),
      );

      return {
        ...cat,
        products: productsInCat,
      };
    })
    .filter((cat) => cat.products.length > 0);

  return (
    <section className="relative z-10 w-full bg-[#010000] px-4 pb-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Cabeçalho Geral */}
        <div className="flex flex-col text-start">
          <span className="font-montserrat text-sm font-medium tracking-wider text-[#D00000] uppercase">
            Nosso Catálogo:
          </span>
        </div>

        {/* --- LISTA DE CATEGORIAS --- */}
        {categoriesWithProducts.length === 0 ? (
          <div className="text-center text-neutral-500">
            <p>Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          <div>
            {categoriesWithProducts.map((catSection) => (
              <div key={catSection.id}>
                {/* Título da Categoria */}
                <div className="flex items-center gap-4">
                  <h3 className="font-clash-display pt-14 pb-6 text-3xl font-medium text-white">
                    {catSection.name}
                  </h3>
                </div>

                {/* Grade de Produtos desta Categoria */}
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {catSection.products.map((item) => (
                    // Aqui usamos o componente ProductCard isolado
                    <ProductCard
                      key={item.id}
                      data={item}
                      categoryName={catSection.name}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botão Ver Tudo */}
        <div className="mt-20 flex justify-center">
          <Button
            variant="outline"
            className="font-montserrat h-12 border-white/10 bg-transparent px-8 text-white hover:border-white/30 hover:bg-white/5 hover:text-white"
          >
            Ver Todos os Produtos
          </Button>
        </div>
      </div>
    </section>
  );
}
