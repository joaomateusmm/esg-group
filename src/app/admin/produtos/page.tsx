import { count, desc, ilike, or } from "drizzle-orm";
import { Suspense } from "react"; // 1. IMPORTAR SUSPENSE

import { db } from "@/db";
import { category, product } from "@/db/schema";

import { AddProductButton } from "./components/add-button";
import { ProductsTable } from "./components/products-table";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string; search?: string }>;
}) {
  const params = await searchParams;

  const limitParam = params.limit ?? "10";
  const limit = limitParam === "all" ? undefined : Number(limitParam);

  const searchTerm = params.search;

  // LÓGICA DE FILTRO
  const searchFilter = searchTerm
    ? or(
        ilike(product.name, `%${searchTerm}%`),
        ilike(product.id, `%${searchTerm}%`),
      )
    : undefined;

  // QUERY PRINCIPAL COM FILTRO
  const productsQuery = db
    .select()
    .from(product)
    .where(searchFilter)
    .orderBy(desc(product.createdAt));

  if (limit) {
    productsQuery.limit(limit);
  }

  const productsData = await productsQuery;

  // CONTAGEM
  const totalCountResult = await db.select({ value: count() }).from(product);
  const totalProducts = totalCountResult[0].value;

  const categoriesData = await db
    .select({
      id: category.id,
      name: category.name,
    })
    .from(category);

  return (
    <div className="space-y-8 p-2 pt-6">
      {/* --- HEADER DA PÁGINA --- */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-clash-display text-3xl font-medium text-black">
            Meus Produtos
          </h1>
          <p className="text-sm text-neutral-700">
            Gerencie o catálogo da sua loja.
          </p>
        </div>

        <AddProductButton />
      </div>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-neutral-400">
            Carregando tabela...
          </div>
        }
      >
        <ProductsTable
          data={productsData}
          totalProducts={totalProducts}
          limitParam={limitParam}
          allCategories={categoriesData}
        />
      </Suspense>
    </div>
  );
}
