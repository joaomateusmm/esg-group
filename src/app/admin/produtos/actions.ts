"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { product } from "@/db/schema";

// --- SCHEMA DE VALIDAÇÃO (SERVER SIDE) ---
const productSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  description: z.string().optional(),

  // CORREÇÃO: Aceita URL válida, mas também aceita string vazia ou undefined
  paymentLink: z.string().url("URL inválida").optional().or(z.literal("")),

  // CORREÇÃO: Novo campo de download (opcional)
  downloadUrl: z.string().optional().or(z.literal("")),

  price: z.number().min(0.01),
  discountPrice: z.number().optional(),

  // Aceitamos array de strings ou undefined
  images: z.array(z.string()).optional(),
  categories: z.array(z.string()).default([]),

  status: z.enum(["active", "inactive", "draft"]).default("active"),
  deliveryMode: z.enum(["email", "none"]).default("email"),
  paymentMethods: z.array(z.string()).default([]),

  stock: z.number().default(0),
  isStockUnlimited: z.boolean().default(false),
});

// Tipo inferido do Zod para usar no frontend se precisar
export type ProductServerPayload = z.infer<typeof productSchema>;

export async function createProduct(rawData: ProductServerPayload) {
  // 1. Validar os dados recebidos
  const result = productSchema.safeParse(rawData);

  if (!result.success) {
    console.error("Erro de validação:", result.error.flatten());
    throw new Error(
      `Dados inválidos: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
    );
  }

  const data = result.data;

  // 2. Preparar dados para o banco
  const finalPaymentLink =
    data.paymentLink && data.paymentLink.length > 0 ? data.paymentLink : "#";

  try {
    // 3. Inserir no Banco de Dados
    await db.insert(product).values({
      name: data.name,
      description: data.description,

      paymentLink: finalPaymentLink,
      downloadUrl: data.downloadUrl,

      price: Math.round(data.price * 100), // Converter R$ para centavos
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

    // 4. Atualizar o cache da página de produtos
    revalidatePath("/admin/produtos");
  } catch (error) {
    console.error("Erro ao criar produto no banco:", error);
    throw new Error("Erro interno ao salvar produto.");
  }

  // 5. Redirecionar
  redirect("/admin/produtos");
}

// =========================================================
// --- FUNÇÕES MELHORADAS DE DELEÇÃO (COM DEBUG E TRATAMENTO DE ERRO) ---
// =========================================================

// Função para deletar UM produto
export async function deleteProduct(id: string) {
  console.log(`[DELETE] Tentando deletar produto ID: ${id}`);

  try {
    // .returning() nos permite ver se algo foi realmente apagado
    const result = await db
      .delete(product)
      .where(eq(product.id, id))
      .returning();

    console.log("[DELETE] Resultado do banco:", result);

    if (result.length === 0) {
      console.error(
        "[DELETE] O banco retornou 0 deletados (ID não encontrado ou já deletado).",
      );
      return {
        success: false,
        message: "Produto não encontrado ou já deletado.",
      };
    }

    // Atualiza o Admin e a Loja Principal
    revalidatePath("/admin/produtos");
    revalidatePath("/");

    return { success: true, message: "Produto deletado com sucesso." };
  } catch (err) {
    // CORREÇÃO: Tratamos o erro como um objeto que pode ter 'code' e 'message'
    const error = err as { code?: string; message: string };

    console.error("[DELETE ERROR] Erro crítico:", error);

    // Código 23503 no Postgres = Violação de Chave Estrangeira (Foregin Key)
    // Significa que o produto está sendo usado em outra tabela (ex: vendas/pedidos)
    if (error.code === "23503") {
      return {
        success: false,
        message:
          "ERRO: Este produto já possui vendas registradas e não pode ser excluído.",
      };
    }

    return { success: false, message: `Erro no banco: ${error.message}` };
  }
}

// Função para deletar VÁRIOS produtos (Bulk Delete)
export async function deleteProducts(ids: string[]) {
  console.log(`[BULK DELETE] Tentando deletar IDs:`, ids);

  try {
    const result = await db
      .delete(product)
      .where(inArray(product.id, ids))
      .returning();

    console.log(`[BULK DELETE] Deletados: ${result.length} de ${ids.length}`);

    if (result.length === 0) {
      return { success: false, message: "Nenhum produto foi deletado." };
    }

    revalidatePath("/admin/produtos");
    revalidatePath("/");

    return { success: true, message: `${result.length} produtos deletados.` };
  } catch (err) {
    // CORREÇÃO: Tratamos o erro como um objeto tipado aqui também
    const error = err as { code?: string; message: string };

    console.error("[BULK DELETE ERROR]", error);

    if (error.code === "23503") {
      return {
        success: false,
        message:
          "Alguns produtos selecionados possuem vendas e não podem ser excluídos.",
      };
    }

    return { success: false, message: "Erro ao deletar produtos." };
  }
}
