"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import Stripe from "stripe";
import { z } from "zod";

import { db } from "@/db";
import { serviceOrder, serviceProvider } from "@/db/schema";
import { auth } from "@/lib/auth";

// Inicializa o cliente do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
});

// Inicializa o Resend
const resend = new Resend(process.env.RESEND_API_KEY!);

// Validação dos dados recebidos do frontend
const serviceCheckoutSchema = z.object({
  description: z.string().min(10),
  address: z.string().min(5),
  contactPhone: z.string().min(8),
  providerId: z.string(),
  categoryId: z.string(),
  amount: z.number().positive(),
  scheduledDate: z.string(),
});

type ServiceCheckoutPayload = z.infer<typeof serviceCheckoutSchema>;

export async function createServicePaymentIntent(data: ServiceCheckoutPayload) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: "Você precisa estar logado para contratar um serviço.",
      };
    }

    const parsed = serviceCheckoutSchema.safeParse(data);
    if (!parsed.success) {
      console.error("Erro de validação:", parsed.error.flatten());
      return {
        success: false,
        error: "Dados inválidos enviados no formulário.",
      };
    }

    const {
      description,
      address,
      contactPhone,
      providerId,
      categoryId,
      amount,
      scheduledDate,
    } = parsed.data;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "gbp",
      metadata: {
        type: "service_order",
        customerId: session.user.id,
        providerId: providerId,
        categoryId: categoryId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe não retornou o client_secret.");
    }

    await db.insert(serviceOrder).values({
      id: crypto.randomUUID(),
      customerId: session.user.id,
      providerId: providerId,
      categoryId: categoryId,
      description: description,
      address: address,
      contactPhone: contactPhone,
      amount: amount,
      scheduledDate: new Date(scheduledDate),
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: "pending",
      status: "pending",
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Erro ao criar Service Payment Intent:", error);
    return {
      success: false,
      error: "Ocorreu um erro ao inicializar o pagamento. Tente novamente.",
    };
  }
}

export async function getServiceOrderIdByPaymentIntent(
  paymentIntentId: string,
) {
  try {
    const order = await db.query.serviceOrder.findFirst({
      where: eq(serviceOrder.stripePaymentIntentId, paymentIntentId),
      columns: {
        id: true,
      },
    });

    return order?.id || null;
  } catch (error) {
    console.error("Erro ao buscar pedido de serviço por intent:", error);
    return null;
  }
}

// --- FUNÇÃO ATUALIZADA COM ENVIO DE E-MAIL PELO RESEND ---
export async function requestServiceWithoutPayment(
  data: ServiceCheckoutPayload,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: "Você precisa estar logado para solicitar um serviço.",
      };
    }

    const parsed = serviceCheckoutSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Dados inválidos enviados no formulário.",
      };
    }

    const {
      description,
      address,
      contactPhone,
      providerId,
      categoryId,
      amount,
      scheduledDate,
    } = parsed.data;

    // 1. Apenas insere no banco, sem chamar o Stripe
    await db.insert(serviceOrder).values({
      id: crypto.randomUUID(),
      customerId: session.user.id,
      providerId: providerId,
      categoryId: categoryId,
      description: description,
      address: address,
      contactPhone: contactPhone,
      amount: amount,
      scheduledDate: new Date(scheduledDate),
      paymentStatus: "pending",
      status: "pending",
    });

    // 2. Busca os dados do Prestador para enviar o e-mail
    const provider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, providerId),
      with: {
        user: true, // Pega o nome e e-mail do usuário que é o prestador
        category: true, // Pega o nome do serviço para por no e-mail
      },
    });

    // 3. Formata a data para os e-mails
    const formattedDate = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
    }).format(new Date(scheduledDate));

    // 4. Se achou o prestador e ele tem e-mail, dispara o e-mail para ele
    if (provider?.user?.email) {
      // URL garantida para a produção (sem variáveis confusas)
      const providerDashboardUrl = "https://esggroup.shop/painel-prestador";

      await resend.emails.send({
        from: "ESG Group <contato@esggroup.shop>",
        to: provider.user.email,
        subject: `🎉 Novo Pedido de Serviço: ${provider.category.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #ea580c; margin-top: 0;">Você tem uma nova solicitação!</h2>
            <p style="color: #333; font-size: 16px;">Olá, <strong>${provider.user.name}</strong>,</p>
            <p style="color: #555; font-size: 15px; line-height: 1.5;">Você acabou de receber um novo pedido de serviço na plataforma ESG Group para a categoria <strong>${provider.category.name}</strong>.</p>
            
            <div style="background-color: #fff7ed; padding: 15px; border-left: 4px solid #ea580c; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Cliente:</strong> ${session.user.name}</p>
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Data Desejada:</strong> ${formattedDate}</p>
              <p style="margin: 0; color: #333;"><strong>O que precisa ser feito:</strong><br/> <span style="font-style: italic; color: #666;">"${description}"</span></p>
            </div>
            
            <p style="color: #555; font-size: 15px; line-height: 1.5;">O cliente está aguardando você <strong>aceitar</strong> o serviço para poder realizar o pagamento. Acesse seu painel agora mesmo para conferir os detalhes completos e aprovar a solicitação.</p>
            
            <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
              <a href="${providerDashboardUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">Acessar Meu Painel</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">Equipe ESG Group<br/>Este é um e-mail automático, por favor não responda.</p>
          </div>
        `,
      });
    }

    // 5. Dispara o E-mail SIMPLES para o ADMIN
    const adminDashboardUrl = "https://esggroup.shop/admin/solicitacoes";

    await resend.emails.send({
      from: "ESG Group <contato@esggroup.shop>",
      to: "contatogroupesg@gmail.com",
      subject: `[ADMIN] Nova Solicitação de Serviço`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #333; margin-top: 0;">Novo Serviço Solicitado</h2>
          <p style="color: #555; font-size: 15px;">Um cliente acabou de pedir um serviço na plataforma. O prestador já foi notificado e aguardamos a aprovação dele.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0 0 5px 0; color: #333; font-size: 14px;"><strong>Cliente:</strong> ${session.user.name}</p>
            <p style="margin: 0 0 5px 0; color: #333; font-size: 14px;"><strong>Prestador:</strong> ${provider?.user?.name || "Desconhecido"}</p>
            <p style="margin: 0 0 5px 0; color: #333; font-size: 14px;"><strong>Serviço:</strong> ${provider?.category?.name || "N/A"}</p>
            <p style="margin: 0; color: #333; font-size: 14px;"><strong>Data:</strong> ${formattedDate}</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${adminDashboardUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">Ver no Painel Admin</a>
          </div>
        </div>
      `,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao solicitar serviço ou enviar e-mail:", error);
    return {
      success: false,
      error: "Ocorreu um erro ao enviar sua solicitação. Tente novamente.",
    };
  }
}
export async function generatePaymentIntentForExistingOrder(orderId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Você precisa estar logado." };
    }

    const order = await db.query.serviceOrder.findFirst({
      where: eq(serviceOrder.id, orderId),
    });

    if (!order) {
      return { success: false, error: "Pedido não encontrado." };
    }

    if (order.customerId !== session.user.id) {
      return { success: false, error: "Acesso negado a este pedido." };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.amount,
      currency: "gbp",
      metadata: {
        type: "service_order",
        orderId: order.id,
        customerId: session.user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe não retornou o client_secret.");
    }

    await db
      .update(serviceOrder)
      .set({
        stripePaymentIntentId: paymentIntent.id,
      })
      .where(eq(serviceOrder.id, order.id));

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Erro ao gerar intent de pagamento:", error);
    return { success: false, error: "Erro ao iniciar o pagamento." };
  }
}

export async function notifyPaymentSuccess(orderId: string) {
  try {
    const order = await db.query.serviceOrder.findFirst({
      where: eq(serviceOrder.id, orderId),
      with: {
        customer: true,
        provider: {
          with: {
            user: true,
            category: true,
          },
        },
      },
    });

    if (!order) {
      console.error("Pedido não encontrado ao notificar pagamento.");
      return { success: false, error: "Pedido não encontrado." };
    }

    if (order.provider?.user?.email) {
      const providerDashboardUrl = "https://esggroup.shop/painel-prestador";

      await resend.emails.send({
        from: "ESG Group <contato@esggroup.shop>",
        to: order.provider.user.email,
        subject: `💰 Pagamento Confirmado: ${order.provider.category.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #10b981; margin-top: 0;">Pagamento Confirmado!</h2>
            <p style="color: #333; font-size: 16px;">Olá, <strong>${order.provider.user.name}</strong>,</p>
            <p style="color: #555; font-size: 15px; line-height: 1.5;">O cliente <strong>${order.customer.name}</strong> realizou o pagamento pelo serviço de <strong>${order.provider.category.name}</strong> com sucesso!</p>
            
            <div style="background-color: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #333;"><strong>O que isso significa?</strong></p>
              <p style="margin: 0; color: #333;">Você já pode acessar a plataforma para ver o contato direto do cliente e se dirigir ao local na data combinada. Você receberá sua comissão apenas quando o serviço for concluído. O seu pagamento está 100% garantido pela plataforma!</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
              <a href="${providerDashboardUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">Ver Detalhes do Serviço</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">Equipe ESG Group<br/>Este é um e-mail automático, por favor não responda.</p>
          </div>
        `,
      });
    }

    // 2. E-mail para o ADMIN
    const adminDashboardUrl = "https://esggroup.shop/admin/solicitacoes";
    await resend.emails.send({
      from: "ESG Group <contato@esggroup.shop>",
      to: "contatogroupesg@gmail.com",
      subject: `[ADMIN] Pagamento Confirmado para Serviço`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #333; margin-top: 0;">Pagamento Confirmado</h2>
          <p style="color: #555; font-size: 15px;">Um pagamento de serviço acabou de ser aprovado.</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0 0 5px 0; color: #333; font-size: 14px;"><strong>Cliente:</strong> ${order.customer.name}</p>
            <p style="margin: 0 0 5px 0; color: #333; font-size: 14px;"><strong>Prestador:</strong> ${order.provider.user.name}</p>
            <p style="margin: 0; color: #333; font-size: 14px;"><strong>Serviço:</strong> ${order.provider.category.name}</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${adminDashboardUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">Ver no Painel Admin</a>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar notificação de pagamento:", error);
    return { success: false, error: "Erro ao notificar." };
  }
}

export async function confirmServiceCompletionClient(orderId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Você precisa estar logado." };
    }

    const order = await db.query.serviceOrder.findFirst({
      where: eq(serviceOrder.id, orderId),
    });

    if (!order) return { success: false, error: "Pedido não encontrado." };
    if (order.customerId !== session.user.id)
      return { success: false, error: "Acesso negado." };

    // --- LÓGICA DE CONFIRMAÇÃO DUPLA ---
    if (order.status === "provider_completed") {
      // O prestador JÁ confirmou antes. Então agora concluímos 100%!
      await db
        .update(serviceOrder)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(serviceOrder.id, orderId));

      revalidatePath("/minha-conta/servicos"); // Atualiza a tela do cliente
      return {
        success: true,
        message: "Seu serviço está totalmente concluído.",
      };
    } else if (order.status === "in_progress") {
      // O prestador AINDA NÃO confirmou. Avisamos que o cliente fez a parte dele.
      await db
        .update(serviceOrder)
        .set({ status: "client_completed", updatedAt: new Date() })
        .where(eq(serviceOrder.id, orderId));

      revalidatePath("/minha-conta/servicos"); // Atualiza a tela do cliente
      return {
        success: true,
        message: "Sua confirmação foi registrada! Aguardando o prestador.",
      };
    } else {
      return {
        success: false,
        error: "O serviço não pode ser confirmado neste momento.",
      };
    }
  } catch (error) {
    console.error("Erro ao confirmar conclusão:", error);
    return { success: false, error: "Erro interno ao confirmar serviço." };
  }
}
