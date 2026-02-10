"use server";

import { eq } from "drizzle-orm"; // Importar eq
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend"; // Importar Resend
import { z } from "zod";

import NewRequestEmail from "@/components/emails/new-request-email"; // Importar o template
import { db } from "@/db";
import { serviceProvider, serviceRequest } from "@/db/schema"; // Importar serviceProvider
import { auth } from "@/lib/auth";

// Instância do Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Schema de Validação do Pedido
const requestSchema = z.object({
  providerId: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().min(10, "Descreva o problema com mais detalhes."),
  address: z.string().min(5, "Endereço obrigatório."),
  contactPhone: z.string().min(8, "Telefone obrigatório."),
  budgetType: z.enum(["negotiable", "range"]),
  minBudget: z.string().optional(),
  maxBudget: z.string().optional(),
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

    const {
      providerId,
      categoryId,
      description,
      address,
      contactPhone,
      budgetType,
      minBudget,
      maxBudget,
    } = parsed.data;

    // Formata o valor do orçamento
    let budgetValue = null;
    if (budgetType === "range") {
      if (!minBudget || !maxBudget) {
        return { success: false, error: "Defina o valor mínimo e máximo." };
      }
      budgetValue = `${minBudget} - ${maxBudget}`;
    }

    // 1. Salvar no Banco
    await db.insert(serviceRequest).values({
      id: crypto.randomUUID(),
      customerId: session.user.id,
      providerId,
      categoryId,
      description,
      address,
      contactPhone,
      budgetType,
      budgetValue,
      status: "pending",
    });

    // 2. Buscar dados do Prestador para enviar o E-mail
    // Precisamos do E-mail do usuário que é dono do perfil de prestador
    const providerData = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, providerId),
      with: {
        user: true, // Traz os dados do usuário (email, nome)
      },
    });

    // 3. Enviar E-mail via Resend
    if (providerData && providerData.user.email) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "ESG Group <contato@esggroup.shop>",
          to: providerData.user.email,
          subject: `Novo Pedido de Serviço: ${session.user.name}`,
          react: NewRequestEmail({
            providerName: providerData.user.name,
            customerName: session.user.name,
            description: description,
            address: address,
            budgetType: budgetType,
            budgetValue: budgetValue,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/painel-prestador`,
          }),
        });
      } catch (emailError) {
        console.error("Erro ao enviar e-mail:", emailError);
        // Não bloqueamos o sucesso do pedido se o e-mail falhar, apenas logamos
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
