"use server";

import { eq, inArray } from "drizzle-orm"; // <--- Adicionado
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
    // Retornamos o erro para ser tratado, ou lançamos (como estava antes)
    throw new Error(
      `Dados inválidos: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
    );
  }

  const data = result.data;

  // 2. Preparar dados para o banco
  // TRUQUE: Se o paymentLink vier vazio, salvamos "#" para o banco não dar erro de NOT NULL
  const finalPaymentLink =
    data.paymentLink && data.paymentLink.length > 0 ? data.paymentLink : "#";

  try {
    // 3. Inserir no Banco de Dados
    await db.insert(product).values({
      name: data.name,
      description: data.description,

      paymentLink: finalPaymentLink, // Usamos o valor tratado
      downloadUrl: data.downloadUrl, // Novo campo

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

// --- FUNÇÕES NOVAS DE DELEÇÃO ---

// Função para deletar UM produto
export async function deleteProduct(id: string) {
  try {
    await db.delete(product).where(eq(product.id, id));

    // Atualiza a tabela de produtos
    revalidatePath("/admin/produtos");

    return { success: true, message: "Produto deletado com sucesso." };
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return { success: false, message: "Erro ao deletar produto." };
  }
}

// Função para deletar VÁRIOS produtos (Bulk Delete)
export async function deleteProducts(ids: string[]) {
  try {
    await db.delete(product).where(inArray(product.id, ids));

    // Atualiza a tabela de produtos
    revalidatePath("/admin/produtos");

    return { success: true, message: "Produtos deletados com sucesso." };
  } catch (error) {
    console.error("Erro ao deletar produtos:", error);
    return { success: false, message: "Erro ao deletar produtos." };
  }
}
