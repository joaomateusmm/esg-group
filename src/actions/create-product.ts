"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { category, product } from "@/db/schema";

// --- SCHEMA ATUALIZADO COM CAMPOS DE FRETE ---
const productSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  description: z.string().optional(),

  // Preços em centavos
  price: z.number().min(0),
  discountPrice: z.number().optional(),

  // 1. CAMPO MOEDA
  currency: z.enum(["GBP", "USD", "EUR", "BRL"]).default("GBP"),

  images: z.array(z.string()).optional(),
  categories: z.array(z.string()).default([]),

  status: z.enum(["active", "inactive", "draft"]).default("active"),

  // Estoque
  stock: z.number().default(0),
  isStockUnlimited: z.boolean().default(false),

  // --- NOVOS CAMPOS DE FRETE ---
  // Tipo de frete: calculado (peso/medidas), fixo ou grátis
  shippingType: z.enum(["calculated", "fixed", "free"]).default("calculated"),
  // Valor do frete fixo (em centavos), opcional se não for 'fixed'
  fixedShippingPrice: z.number().min(0).optional().default(0),

  // --- CAMPOS FÍSICOS (Usados se frete calculado) ---
  sku: z.string().optional(),
  weight: z.number().min(0).default(0),
  width: z.number().int().min(0).default(0),
  height: z.number().int().min(0).default(0),
  length: z.number().int().min(0).default(0),
});

// Exporta o tipo para ser usado no formulário (Frontend)
export type ProductServerPayload = z.infer<typeof productSchema>;

export async function createProduct(rawData: ProductServerPayload) {
  // 1. Validar
  const result = productSchema.safeParse(rawData);

  if (!result.success) {
    console.error("Erro de validação:", result.error.flatten());
    throw new Error(
      `Dados inválidos: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
    );
  }

  const data = result.data;

  // --- LÓGICA DE PROMOÇÃO AUTOMÁTICA ---
  const finalCategories = [...(data.categories || [])];

  // Verifica se existe desconto válido
  if (
    data.discountPrice &&
    data.discountPrice > 0 &&
    data.discountPrice < data.price
  ) {
    try {
      const PROMO_SLUG = "promocoes";

      // 1. Tenta achar a categoria pelo SLUG
      const existingCategory = await db.query.category.findFirst({
        where: eq(category.slug, PROMO_SLUG),
      });

      let promoCategoryId = existingCategory?.id;

      // 2. Se não existir, CRIA ELA AGORA
      if (!promoCategoryId) {
        console.log(
          "Categoria 'Promoções' não encontrada. Criando automaticamente...",
        );
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

      // 3. Adiciona o ID ao array de categorias do produto
      if (promoCategoryId && !finalCategories.includes(promoCategoryId)) {
        finalCategories.push(promoCategoryId);
      }
    } catch (err) {
      console.error("Erro ao gerenciar categoria automática de promoção:", err);
    }
  }
  // ---------------------------------------

  try {
    // 2. Inserir no Banco
    await db.insert(product).values({
      name: data.name,
      description: data.description,

      price: data.price,
      discountPrice: data.discountPrice,

      // SALVAR MOEDA
      currency: data.currency,

      images: data.images || [],
      categories: finalCategories, // Usamos a lista atualizada

      status: data.status,

      stock: data.stock,
      isStockUnlimited: data.isStockUnlimited,

      // --- DADOS DE FRETE ---
      shippingType: data.shippingType,
      fixedShippingPrice: data.fixedShippingPrice,

      // Dados Logísticos
      sku: data.sku,
      weight: data.weight,
      width: data.width,
      height: data.height,
      length: data.length,
    });

    revalidatePath("/admin/produtos");
    revalidatePath("/");
  } catch (error) {
    console.error("Erro ao criar produto no banco:", error);
    throw new Error("Erro interno ao salvar produto.");
  }

  redirect("/admin/produtos");
}

export async function updateProduct(id: string, rawData: ProductServerPayload) {
  // 1. Validar
  const result = productSchema.safeParse(rawData);

  if (!result.success) {
    console.error("Erro de validação (Update):", result.error.flatten());
    return { success: false, message: "Dados inválidos para atualização." };
  }

  const data = result.data;

  // --- LÓGICA DE PROMOÇÃO AUTOMÁTICA (Repetida para Update) ---
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
      console.error("Erro na auto-categoria (Update):", err);
    }
  }
  // -----------------------------------------------------------

  try {
    await db
      .update(product)
      .set({
        name: data.name,
        description: data.description,

        price: data.price,
        discountPrice: data.discountPrice,

        // ATUALIZAR MOEDA
        currency: data.currency,

        images: data.images || [],
        categories: finalCategories,

        stock: data.stock,
        isStockUnlimited: data.isStockUnlimited,

        status: data.status,

        // --- ATUALIZAR FRETE ---
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
    revalidatePath(`/produto/${id}`);

    return { success: true, message: "Produto atualizado com sucesso!" };
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return { success: false, message: "Erro ao atualizar produto." };
  }
}

export async function deleteProduct(id: string) {
  console.log(`[DELETE TRY] ID: ${id}`);

  try {
    await db.delete(product).where(eq(product.id, id));

    revalidatePath("/admin/produtos");
    revalidatePath("/");

    return {
      success: true,
      code: "DELETED",
      message: "Produto excluído com sucesso.",
    };
  } catch (err) {
    const error = err as { code?: string; message: string };
    console.error("[DELETE ERROR]", error);

    if (error.code === "23503" || error.message.includes("delete from")) {
      return {
        success: false,
        code: "CONSTRAINT_VIOLATION",
        message: "Produto em uso.",
      };
    }

    return {
      success: false,
      code: "ERROR",
      message: `Erro do Banco: ${error.message}`,
    };
  }
}

export async function archiveProduct(id: string) {
  console.log(`[ARCHIVE] Inativando ID: ${id}`);
  try {
    await db
      .update(product)
      .set({ status: "inactive" })
      .where(eq(product.id, id));

    revalidatePath("/admin/produtos");
    revalidatePath("/");

    return { success: true, message: "Produto inativado com sucesso." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao inativar produto." };
  }
}

export async function deleteProducts(ids: string[]) {
  try {
    await db.delete(product).where(inArray(product.id, ids));
    revalidatePath("/admin/produtos");
    revalidatePath("/");
    return { success: true, message: "Produtos excluídos." };
  } catch {
    return {
      success: false,
      message: "Erro ao excluir (provavelmente produtos em uso).",
    };
  }
}
