import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { category, product } from "@/db/schema";

import { ProductCard } from "./ProductCard"; // <--- Importamos o novo componente

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
      <div className="mx-auto max-w-[1400px]">
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
                  <h3 className="font-clash-display pt-6 pb-6 text-3xl font-medium text-white">
                    {catSection.name}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-5 mb-8">
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
      </div>
    </section>
  );
}
