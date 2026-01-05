"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { product } from "@/db/schema";

// --- SCHEMA (Mantém igual) ---
const productSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  description: z.string().optional(),
  paymentLink: z.string().url("URL inválida").optional().or(z.literal("")),
  downloadUrl: z.string().optional().or(z.literal("")),
  price: z.number().min(0.01),
  discountPrice: z.number().optional(),
  images: z.array(z.string()).optional(),
  categories: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive", "draft"]).default("active"),
  deliveryMode: z.enum(["email", "none"]).default("email"),
  paymentMethods: z.array(z.string()).default([]),
  stock: z.number().default(0),
  isStockUnlimited: z.boolean().default(false),
});

export type ProductServerPayload = z.infer<typeof productSchema>;

export async function createProduct(rawData: ProductServerPayload) {
  // ... (Mantenha sua função createProduct igualzinha estava antes) ...
  // Vou resumir aqui para não ocupar espaço, mas não altere a lógica de create
  const result = productSchema.safeParse(rawData);
  if (!result.success) throw new Error("Dados inválidos");

  const data = result.data;
  const finalPaymentLink =
    data.paymentLink && data.paymentLink.length > 0 ? data.paymentLink : "#";

  try {
    await db.insert(product).values({
      name: data.name,
      description: data.description,
      paymentLink: finalPaymentLink,
      downloadUrl: data.downloadUrl,
      price: Math.round(data.price * 100),
      discountPrice: data.discountPrice
        ? Math.round(data.discountPrice * 100)
        : null,
      images: data.images || [],
      categories: data.categories,
      status: data.status,
      deliveryMode: data.deliveryMode,
      paymentMethods: data.paymentMethods,
      stock: data.stock,
      isStockUnlimited: data.isStockUnlimited,
    });
    revalidatePath("/admin/produtos");
  } catch (error) {
    console.error("Erro create:", error);
    throw new Error("Erro ao criar");
  }
  redirect("/admin/produtos");
}

// =========================================================
// --- TENTATIVA DE DELEÇÃO (HARD DELETE) ---
// =========================================================

export async function deleteProduct(id: string) {
  console.log(`[DELETE TRY] ID: ${id}`);

  try {
    // Tenta deletar fisicamente sem .returning() para evitar bugs de schema
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

    // Se der erro de chave estrangeira (23503) OU aquele erro genérico de query failed
    // Nós retornamos um código especial "CONSTRAINT_VIOLATION" para o front-end tratar
    if (error.code === "23503" || error.message.includes("delete from")) {
      return {
        success: false,
        code: "CONSTRAINT_VIOLATION", // <--- O front vai ler isso
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

// =========================================================
// --- ARQUIVAR (SOFT DELETE) ---
// =========================================================

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

// Bulk Delete (Mantive simples, mas você pode aplicar a mesma lógica se quiser depois)
export async function deleteProducts(ids: string[]) {
  try {
    await db.delete(product).where(inArray(product.id, ids));
    revalidatePath("/admin/produtos");
    revalidatePath("/");
    return { success: true, message: "Produtos excluídos." };
  } catch (error) {
    return {
      success: false,
      message: "Erro ao excluir (provavelmente produtos em uso).",
    };
  }
}
