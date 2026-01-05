"use server";

import { db } from "@/db";
import { category } from "@/db/schema";

export async function getCategories() {
  const categories = await db
    .select({
      id: category.id,
      name: category.name,
    })
    .from(category);

  return categories;
}
