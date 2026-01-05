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

// --- CREATE (Mantém igual) ---
export async function createProduct(rawData: ProductServerPayload) {
  const result = productSchema.safeParse(rawData);

  if (!result.success) {
    console.error("Erro de validação:", result.error.flatten());
    throw new Error(
      `Dados inválidos: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
    );
  }

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
    console.error("Erro ao criar produto:", error);
    throw new Error("Erro interno ao salvar produto.");
  }
  redirect("/admin/produtos");
}

// =========================================================
// --- DELEÇÃO BLINDADA (SEM RETURNING E COM ERRO EXPOSTO) ---
// =========================================================

export async function deleteProduct(id: string) {
  console.log(`[DELETE] Tentando deletar produto ID: ${id}`);

  try {
    // MUDANÇA 1: Removemos o .returning().
    // Se o delete funcionar, ele não dá erro. Se falhar, vai pro catch.
    await db.delete(product).where(eq(product.id, id));

    // Assumimos sucesso se não deu erro
    revalidatePath("/admin/produtos");
    revalidatePath("/");

    return { success: true, message: "Produto excluído com sucesso." };
  } catch (err) {
    const error = err as { code?: string; message: string };
    console.error("[DELETE ERROR]", error);

    // Erro de Vínculo (Produto comprado)
    if (error.code === "23503") {
      return {
        success: false,
        message: "ERRO: Este produto já possui vendas e não pode ser excluído.",
      };
    }

    // MUDANÇA 2: Retornamos o erro REAL para o Toast
    return { success: false, message: `Erro do Banco: ${error.message}` };
  }
}

export async function deleteProducts(ids: string[]) {
  console.log(`[BULK DELETE] IDs:`, ids);

  try {
    // MUDANÇA 1: Sem .returning()
    await db.delete(product).where(inArray(product.id, ids));

    revalidatePath("/admin/produtos");
    revalidatePath("/");

    return { success: true, message: "Produtos excluídos com sucesso." };
  } catch (err) {
    const error = err as { code?: string; message: string };
    console.error("[BULK DELETE ERROR]", error);

    if (error.code === "23503") {
      return {
        success: false,
        message:
          "Alguns produtos selecionados possuem vendas e não podem ser excluídos.",
      };
    }

    // MUDANÇA 2: Retornamos o erro REAL
    return { success: false, message: `Erro do Banco: ${error.message}` };
  }
}
