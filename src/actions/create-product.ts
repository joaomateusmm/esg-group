"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { product } from "@/db/schema";

// --- SCHEMA ATUALIZADO (FÍSICO - SEM PAYMENT METHODS) ---
const productSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  description: z.string().optional(),

  // Preços em centavos
  price: z.number().min(0),
  discountPrice: z.number().optional(),

  images: z.array(z.string()).optional(),
  categories: z.array(z.string()).default([]),

  status: z.enum(["active", "inactive", "draft"]).default("active"),

  // Estoque
  stock: z.number().default(0),
  isStockUnlimited: z.boolean().default(false),

  // --- NOVOS CAMPOS FÍSICOS ---
  sku: z.string().optional(),
  weight: z.number().min(0).default(0),
  width: z.number().int().min(0).default(0),
  height: z.number().int().min(0).default(0),
  length: z.number().int().min(0).default(0),
});

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

  try {
    // 2. Inserir no Banco (Campos Físicos)
    await db.insert(product).values({
      name: data.name,
      description: data.description,

      price: data.price,
      discountPrice: data.discountPrice,

      // Garante array vazio se undefined
      images: data.images || [],
      categories: data.categories || [],

      status: data.status,

      stock: data.stock,
      isStockUnlimited: data.isStockUnlimited,

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

  try {
    await db
      .update(product)
      .set({
        name: data.name,
        description: data.description,

        price: data.price,
        discountPrice: data.discountPrice,

        images: data.images || [],
        categories: data.categories || [],

        stock: data.stock,
        isStockUnlimited: data.isStockUnlimited,

        status: data.status,

        // Dados Logísticos
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

// ... Resto das funções (delete, archive) iguais ao original ...
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
