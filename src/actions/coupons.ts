"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { coupon } from "@/db/schema";
import { auth } from "@/lib/auth";

// --- 1. ATUALIZAÇÃO DO SCHEMA ZOD ---
const createCouponSchema = z.object({
  code: z.string().min(3).toUpperCase().trim(),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().min(1),
  minValue: z.coerce.number().optional(), // Em centavos
  maxUses: z.coerce.number().optional(),
  expiresAt: z.string().optional(), // Recebe string do input date
  popupTitle: z.string().optional(),
  popupDescription: z.string().optional(),
});

export async function validateCoupon(code: string, currentTotal: number) {
  try {
    const normalizedCode = code.toUpperCase();

    const couponData = await db.query.coupon.findFirst({
      where: eq(coupon.code, normalizedCode),
    });

    if (!couponData) {
      return { valid: false, message: "Cupom inválido." };
    }

    if (!couponData.isActive) {
      return { valid: false, message: "Este cupom foi desativado." };
    }

    if (couponData.expiresAt && new Date() > couponData.expiresAt) {
      return { valid: false, message: "Este cupom expirou." };
    }

    if (
      couponData.maxUses !== null &&
      couponData.usedCount >= couponData.maxUses
    ) {
      return {
        valid: false,
        message: "O limite de uso deste cupom foi atingido.",
      };
    }

    if (couponData.minValue && currentTotal < couponData.minValue) {
      const formattedMin = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(couponData.minValue / 100);

      return {
        valid: false,
        message: `Valor mínimo para este cupom: ${formattedMin}`,
      };
    }

    let discountAmount = 0;

    if (couponData.type === "percent") {
      discountAmount = Math.round(currentTotal * (couponData.value / 100));
    } else {
      discountAmount = couponData.value;
    }

    if (discountAmount > currentTotal) {
      discountAmount = currentTotal;
    }

    const newTotal = currentTotal - discountAmount;

    return {
      valid: true,
      message: "Cupom aplicado com sucesso!",
      discountAmount,
      newTotal,
      couponId: couponData.id,
    };
  } catch (error) {
    console.error("Erro ao validar cupom:", error);
    return { valid: false, message: "Erro ao validar cupom." };
  }
}

export async function createCouponAction(
  rawFormData: z.infer<typeof createCouponSchema>,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      throw new Error("Não autorizado.");
    }

    // --- CORREÇÃO: Validar os dados usando o Schema ---
    // Isso remove o erro do ESLint e garante segurança
    const formData = createCouponSchema.parse(rawFormData);

    const existing = await db.query.coupon.findFirst({
      where: eq(coupon.code, formData.code),
    });

    if (existing) {
      return { success: false, message: "Já existe um cupom com este código." };
    }

    await db.insert(coupon).values({
      code: formData.code,
      type: formData.type,
      value: formData.value,
      minValue: formData.minValue || 0,
      maxUses: formData.maxUses || null,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
      popupTitle: formData.popupTitle || null,
      popupDescription: formData.popupDescription || null,
      usedCount: 0,
      isActive: true,
      isFeatured: false,
    });

    revalidatePath("/admin/cupons");
    return { success: true, message: "Cupom criado com sucesso!" };
  } catch (error) {
    console.error(error);
    // Se for erro do Zod, mostra mensagem específica
    if (error instanceof z.ZodError) {
      return { success: false, message: "Dados inválidos." };
    }
    return { success: false, message: "Erro ao criar cupom." };
  }
}

export async function deleteCouponAction(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin")
      throw new Error("Não autorizado");

    await db.delete(coupon).where(eq(coupon.id, id));
    revalidatePath("/admin/cupons");
    return { success: true, message: "Cupom deletado." };
  } catch {
    return { success: false, message: "Erro ao deletar." };
  }
}

export async function toggleCouponStatusAction(
  id: string,
  currentStatus: boolean,
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin")
      throw new Error("Não autorizado");

    await db
      .update(coupon)
      .set({ isActive: !currentStatus })
      .where(eq(coupon.id, id));
    revalidatePath("/admin/cupons");
    return { success: true, message: "Status atualizado." };
  } catch {
    return { success: false, message: "Erro ao atualizar." };
  }
}

export async function setFeaturedCouponAction(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin")
      throw new Error("Não autorizado");

    await db.transaction(async (tx) => {
      await tx.update(coupon).set({ isFeatured: false });
      await tx
        .update(coupon)
        .set({ isFeatured: true })
        .where(eq(coupon.id, id));
    });

    revalidatePath("/admin/cupons");
    revalidatePath("/");
    return { success: true, message: "Cupom destacado com sucesso!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao destacar cupom." };
  }
}

export async function removeFeaturedCouponAction() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin")
      throw new Error("Não autorizado");

    await db.update(coupon).set({ isFeatured: false });

    revalidatePath("/admin/cupons");
    revalidatePath("/");
    return { success: true, message: "Divulgação parada." };
  } catch {
    return { success: false, message: "Erro ao atualizar." };
  }
}
