"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { coupon } from "@/db/schema";
import { auth } from "@/lib/auth";

// --- SCHEMA DE VALIDAÇÃO (Usado na criação) ---
const createCouponSchema = z.object({
  code: z.string().min(3).toUpperCase().trim(),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().min(1),
  minValue: z.coerce.number().optional(), // Em centavos
  maxUses: z.coerce.number().optional(),
  expiresAt: z.string().optional(), // Recebe string do input date
});

// ==============================================================================
// 1. FUNÇÃO EXISTENTE (Validação no Checkout)
// ==============================================================================
export async function validateCoupon(code: string, currentTotal: number) {
  try {
    // Normaliza o código para maiúsculo para evitar erros de digitação
    const normalizedCode = code.toUpperCase();

    const couponData = await db.query.coupon.findFirst({
      where: eq(coupon.code, normalizedCode),
    });

    // 1. Verificações Básicas
    if (!couponData) {
      return { valid: false, message: "Cupom inválido." };
    }

    if (!couponData.isActive) {
      return { valid: false, message: "Este cupom foi desativado." };
    }

    // 2. Verificação de Validade (Data)
    if (couponData.expiresAt && new Date() > couponData.expiresAt) {
      return { valid: false, message: "Este cupom expirou." };
    }

    // 3. Verificação de Limite de Uso
    if (
      couponData.maxUses !== null &&
      couponData.usedCount >= couponData.maxUses
    ) {
      return {
        valid: false,
        message: "O limite de uso deste cupom foi atingido.",
      };
    }

    // 4. Verificação de Valor Mínimo
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

    // 5. Calcular Desconto
    let discountAmount = 0;

    if (couponData.type === "percent") {
      // Ex: 20% de 10000 = 2000
      discountAmount = Math.round(currentTotal * (couponData.value / 100));
    } else {
      // Ex: Fixo R$ 10,00 (1000)
      discountAmount = couponData.value;
    }

    // Garante que o desconto não seja maior que o total (evita valor negativo)
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

// ==============================================================================
// 2. FUNÇÕES ADMINISTRATIVAS (Criar, Deletar, Ativar/Desativar)
// ==============================================================================

export async function createCouponAction(
  formData: z.infer<typeof createCouponSchema>,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      throw new Error("Não autorizado.");
    }

    // Verifica se código já existe
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
      usedCount: 0,
      isActive: true,
    });

    revalidatePath("/admin/cupons");
    return { success: true, message: "Cupom criado com sucesso!" };
  } catch (error) {
    console.error(error);
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
