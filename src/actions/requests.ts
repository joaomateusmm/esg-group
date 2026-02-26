"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import { z } from "zod";

import NewRequestEmail from "@/components/emails/new-request-email";
import { db } from "@/db";
// IMPORT CORRIGIDO: Agora batendo com seu schema.ts (serviceProvider e serviceOrder)
import { serviceOrder, serviceProvider } from "@/db/schema";
import { auth } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

const requestSchema = z.object({
  providerId: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().min(10, "Descreva o problema com mais detalhes."),
  address: z.string().min(5, "Endereço obrigatório."),
  contactPhone: z.string().min(8, "Telefone obrigatório."),
});

export type RequestFormValues = z.infer<typeof requestSchema>;

export async function createServiceRequest(data: RequestFormValues) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Faça login para contratar um serviço." };
    }

    const parsed = requestSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Dados inválidos." };
    }

    const { providerId, categoryId, description, address, contactPhone } =
      parsed.data;

    // 1. Buscar dados do Prestador (para pegar o e-mail e o preço base)
    const providerData = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, providerId),
      with: {
        user: true,
      },
    });

    if (!providerData) {
      return { success: false, error: "Prestador não encontrado." };
    }

    // 2. Salvar no Banco (Tabela serviceOrder)
    await db.insert(serviceOrder).values({
      id: crypto.randomUUID(),
      customerId: session.user.id,
      providerId,
      categoryId,
      description,
      address,
      contactPhone,
      amount: providerData.servicePrice, // Usando o preço definido no perfil do prestador
      status: "pending",
      paymentStatus: "pending",
    });

    // 3. Enviar E-mail via Resend
    if (providerData.user?.email) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "ESG Group <contato@esggroup.shop>",
          to: providerData.user.email,
          subject: `Novo Pedido de Serviço: ${session.user.name}`,
          react: NewRequestEmail({
            providerName: providerData.user.name ?? "Prestador",
            customerName: session.user.name ?? "Cliente",
            description: description,
            address: address,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/painel-prestador`,
          }),
        });
      } catch (emailError) {
        console.error("Erro ao enviar e-mail:", emailError);
      }
    }

    revalidatePath("/minha-conta/pedidos");
    revalidatePath("/painel-prestador");

    return { success: true, message: "Solicitação enviada com sucesso!" };
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return { success: false, error: "Erro interno ao enviar solicitação." };
  }
}
