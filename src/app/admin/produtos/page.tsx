import { count, desc, ilike, or } from "drizzle-orm"; // 1. ADICIONADO: ilike e or

import { db } from "@/db";
import { category, product } from "@/db/schema";

import { AddProductButton } from "./components/add-button";
import { ProductsTable } from "./components/products-table";

export default async function AdminProductsPage({
  searchParams,
}: {
  // 2. ATUALIZADO: Adicionado 'search' na tipagem
  searchParams: Promise<{ limit?: string; search?: string }>;
}) {
  const params = await searchParams;

  const limitParam = params.limit ?? "10";
  const limit = limitParam === "all" ? undefined : Number(limitParam);

  // 3. NOVO: Pega o termo de pesquisa
  const searchTerm = params.search;

  // 4. LÓGICA DE FILTRO
  // Se existir pesquisa, cria a condição: Nome PARECIDO COM ... OU ID PARECIDO COM ...
  // O `%` serve para buscar em qualquer parte do texto (ex: "adei" acha "Cadeira")
  const searchFilter = searchTerm
    ? or(
        ilike(product.name, `%${searchTerm}%`),
        ilike(product.id, `%${searchTerm}%`),
      )
    : undefined;

  // 5. QUERY PRINCIPAL COM FILTRO
  const productsQuery = db
    .select()
    .from(product)
    .where(searchFilter) // Aplica o filtro aqui (se for undefined, o Drizzle ignora)
    .orderBy(desc(product.createdAt));

  if (limit) {
    productsQuery.limit(limit);
  }

  const productsData = await productsQuery;

  // 6. CONTAGEM (Opcional: Filtrar o total também ou mostrar total geral)
  // Aqui mantive a contagem TOTAL da loja, mas podes filtrar se quiseres
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

      <ProductsTable
        data={productsData}
        totalProducts={totalProducts}
        limitParam={limitParam}
        allCategories={categoriesData}
      />
    </div>
  );
}
