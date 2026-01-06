import { count, desc } from "drizzle-orm";

import { db } from "@/db";
// ALTERAÇÃO 1: Adicionei 'category' na importação
import { category, product } from "@/db/schema";

import { AddProductButton } from "./add-button";
import { ProductsTable } from "./products-table";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const params = await searchParams;
  const limitParam = params.limit ?? "10";
  const limit = limitParam === "all" ? undefined : Number(limitParam);

  // 1. Busca os produtos
  const productsQuery = db
    .select()
    .from(product)
    .orderBy(desc(product.createdAt));

  if (limit) {
    productsQuery.limit(limit);
  }

  const productsData = await productsQuery;

  // 2. Conta o total de produtos
  const totalCountResult = await db.select({ value: count() }).from(product);
  const totalProducts = totalCountResult[0].value;

  // ALTERAÇÃO 2: Busca todas as categorias (apenas ID e Nome) para passar para a tabela
  const categoriesData = await db
    .select({
      id: category.id,
      name: category.name,
    })
    .from(category);

  return (
    <div className="space-y-8 p-2 pt-6">
      {/* --- HEADER DA PÁGINA --- */}
      <div className="flex items-center justify-between gap-4 flex-row">
        <div>
          <h1 className="font-clash-display text-3xl font-medium text-white">
            Meus Produtos
          </h1>
          <p className="text-sm text-neutral-400">
            Gerencie o catálogo da sua loja.
          </p>
        </div>

        <AddProductButton />
      </div>

      {/* --- TABELA INTERATIVA --- */}
      <ProductsTable
        data={productsData}
        totalProducts={totalProducts}
        limitParam={limitParam}
        // ALTERAÇÃO 3: Passando a prop que estava faltando
        allCategories={categoriesData}
      />
    </div>
  );
}
