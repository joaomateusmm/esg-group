import { desc } from "drizzle-orm";

import { db } from "@/db";
import { category } from "@/db/schema";

import { AddCategoryButton } from "./add-category-button";
import { CategoriesTable } from "./categories-table";

export default async function CategoriesPage() {
  // Busca categorias ordenadas por data de criação
  const data = await db
    .select()
    .from(category)
    .orderBy(desc(category.createdAt));

  return (
    <div className="space-y-8 p-2 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-clash-display text-3xl font-medium tracking-tight text-white">
            Categorias
          </h2>
          <p className="text-neutral-400">
            Gerencie as categorias da sua loja.
          </p>
        </div>
        <AddCategoryButton />
      </div>

      <CategoriesTable data={data} />
    </div>
  );
}
