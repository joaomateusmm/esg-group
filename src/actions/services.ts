"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { serviceCategory } from "@/db/schema";
import { auth } from "@/lib/auth";
import { serviceCategorySchema } from "@/schemas/services";

export type ServiceCategoryInput = z.infer<typeof serviceCategorySchema>;

function generateSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function createServiceCategory(data: ServiceCategoryInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Acesso negado." };
    }

    const parsedData = serviceCategorySchema.safeParse(data);
    if (!parsedData.success) {
      return { success: false, error: "Dados inválidos." };
    }

    const { name, description, image, isActive } = parsedData.data;
    const slug = generateSlug(name);

    const existingCategory = await db.query.serviceCategory.findFirst({
      where: eq(serviceCategory.slug, slug),
    });

    if (existingCategory) {
      return {
        success: false,
        error: "Já existe uma categoria com este nome.",
      };
    }

    await db.insert(serviceCategory).values({
      id: crypto.randomUUID(),
      name,
      slug,
      description: description || null,
      image: image || null,
      isActive,
    });

    revalidatePath("/admin/servicos");
    return { success: true, message: "Sucesso!" };
  } catch {
    return { success: false, error: "Erro interno." };
  }
}

export async function updateServiceCategory(
  id: string,
  data: Partial<ServiceCategoryInput>,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Acesso negado." };
    }

    // Validação parcial pois é update
    const parsedData = serviceCategorySchema.partial().safeParse(data);
    if (!parsedData.success) {
      return { success: false, error: "Dados inválidos." };
    }

    const { name, description, image, isActive } = parsedData.data;

    // Se o nome mudou, recalcula o slug
    let newSlug = undefined;
    if (name) {
      newSlug = generateSlug(name);
      // Verifica duplicidade apenas se o slug mudar
      const existing = await db.query.serviceCategory.findFirst({
        where: eq(serviceCategory.slug, newSlug),
      });
      if (existing && existing.id !== id) {
        return { success: false, error: "Já existe um serviço com este nome." };
      }
    }

    await db
      .update(serviceCategory)
      .set({
        name,
        slug: newSlug,
        description,
        image,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(serviceCategory.id, id));

    revalidatePath("/admin/servicos");
    revalidatePath("/servicos");

    return { success: true, message: "Serviço atualizado!" };
  } catch (error) {
    console.error("Erro update serviço:", error);
    return { success: false, error: "Erro ao atualizar." };
  }
}

// --- 4. EXCLUIR SERVIÇOS (Em Massa) ---
export async function deleteServices(ids: string[]) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return { success: false, error: "Acesso negado." };
    }

    await db.delete(serviceCategory).where(inArray(serviceCategory.id, ids));

    revalidatePath("/admin/servicos");
    revalidatePath("/servicos");

    return { success: true, message: "Serviços excluídos com sucesso." };
  } catch (error) {
    console.error("Erro delete serviço:", error);
    return { success: false, error: "Erro ao excluir." };
  }
}
