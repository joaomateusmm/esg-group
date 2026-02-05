"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { category, product } from "@/db/schema";

// --- SCHEMA ATUALIZADO ---
const productSchema = z.object({
  id: z.string().max(50).optional(),
  name: z.string().min(2, "Nome muito curto"),
  description: z.string().optional(),
  price: z.number().min(0),
  discountPrice: z.number().optional(),
  currency: z.enum(["GBP", "USD", "EUR", "BRL"]).default("GBP"),
  images: z.array(z.string()).optional(),
  categories: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive", "draft"]).default("active"),
  stock: z.number().default(0),
  isStockUnlimited: z.boolean().default(false),
  shippingType: z.enum(["calculated", "fixed", "free"]).default("calculated"),
  fixedShippingPrice: z.number().min(0).optional().default(0),
  sku: z.string().optional(),
  weight: z.number().min(0).default(0),
  width: z.number().int().min(0).default(0),
  height: z.number().int().min(0).default(0),
  length: z.number().int().min(0).default(0),
});

export type ProductServerPayload = z.infer<typeof productSchema>;

// --- HELPER: Lógica de Promoção Automática ---
// Extraí para uma função auxiliar para reutilizar no create e no update
async function applyPromoLogic(data: ProductServerPayload) {
  const finalCategories = [...(data.categories || [])];

  if (
    data.discountPrice &&
    data.discountPrice > 0 &&
    data.discountPrice < data.price
  ) {
    try {
      const PROMO_SLUG = "promocoes";
      const existingCategory = await db.query.category.findFirst({
        where: eq(category.slug, PROMO_SLUG),
      });

      let promoCategoryId = existingCategory?.id;

      if (!promoCategoryId) {
        console.log("Categoria 'Promoções' não encontrada. Criando...");
        const [newCat] = await db
          .insert(category)
          .values({
            name: "Promoções",
            description: "Produtos com descontos imperdíveis.",
            slug: PROMO_SLUG,
          })
          .returning({ id: category.id });

        promoCategoryId = newCat.id;
      }

      if (promoCategoryId && !finalCategories.includes(promoCategoryId)) {
        finalCategories.push(promoCategoryId);
      }
    } catch (err) {
      console.error("Erro ao gerenciar categoria automática de promoção:", err);
    }
  }
  return finalCategories;
}

export async function createProduct(rawData: ProductServerPayload) {
  const result = productSchema.safeParse(rawData);

  if (!result.success) {
    console.error("Erro de validação:", result.error.flatten());
    throw new Error(
      `Dados inválidos: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
    );
  }

  const data = result.data;
  const finalCategories = await applyPromoLogic(data);

  try {
    await db.insert(product).values({
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      discountPrice: data.discountPrice,
      currency: data.currency,
      images: data.images || [],
      categories: finalCategories,
      status: data.status,
      stock: data.stock,
      isStockUnlimited: data.isStockUnlimited,
      shippingType: data.shippingType,
      fixedShippingPrice: data.fixedShippingPrice,
      sku: data.sku,
      weight: data.weight,
      width: data.width,
      height: data.height,
      length: data.length,
    });

    // --- REVALIDAÇÃO CRÍTICA ---
    revalidatePath("/admin/produtos");
    revalidatePath("/"); // Home da loja
    revalidatePath("/categorias/[slug]", "page"); // Páginas de categoria
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      throw new Error("Unique constraint: Já existe um produto com este ID.");
    }
    console.error("Erro ao criar produto no banco:", error);
    throw new Error("Erro interno ao salvar produto.");
  }

  redirect("/admin/produtos");
}

export async function updateProduct(id: string, rawData: ProductServerPayload) {
  const result = productSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, message: "Dados inválidos." };
  }
  const data = result.data;

  // Aplicamos a lógica de promoção também na edição
  const finalCategories = await applyPromoLogic(data);

  try {
    await db
      .update(product)
      .set({
        name: data.name,
        description: data.description,
        price: data.price,
        discountPrice: data.discountPrice,
        currency: data.currency,
        images: data.images || [],
        categories: finalCategories, // Usamos as categorias processadas
        status: data.status,
        stock: data.stock,
        isStockUnlimited: data.isStockUnlimited,
        shippingType: data.shippingType,
        fixedShippingPrice: data.fixedShippingPrice,
        sku: data.sku,
        weight: data.weight,
        width: data.width,
        height: data.height,
        length: data.length,
        updatedAt: new Date(),
      })
      .where(eq(product.id, id));

    revalidatePath("/admin/produtos");
    revalidatePath("/");
    revalidatePath(`/produto/${id}`); 
    revalidatePath("/carrinho");

    return { success: true, message: "Produto atualizado com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao atualizar." };
  }
}

export async function deleteProduct(id: string) {
  try {
    await db.delete(product).where(eq(product.id, id));

    revalidatePath("/admin/produtos");
    revalidatePath("/");

    return { success: true, code: "DELETED", message: "Produto excluído." };
  } catch {
    return { success: false, message: "Erro ao excluir." };
  }
}

export async function archiveProduct(id: string) {
  try {
    await db
      .update(product)
      .set({ status: "inactive" })
      .where(eq(product.id, id));

    revalidatePath("/admin/produtos");
    revalidatePath("/");
    revalidatePath(`/produto/${id}`);

    return { success: true, message: "Produto inativado." };
  } catch {
    return { success: false, message: "Erro ao inativar." };
  }
}

export async function deleteProducts(ids: string[]) {
  try {
    await db.delete(product).where(inArray(product.id, ids));

    revalidatePath("/admin/produtos");
    revalidatePath("/");

    return { success: true, message: "Produtos excluídos." };
  } catch {
    return { success: false, message: "Erro ao excluir." };
  }
}
