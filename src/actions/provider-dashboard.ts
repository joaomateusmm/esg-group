"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend"; // IMPORT DO RESEND

import { db } from "@/db";
import { serviceOrder } from "@/db/schema";
import { auth } from "@/lib/auth";

// Inicializa o Resend
const resend = new Resend(process.env.RESEND_API_KEY!);

// --- VERIFICAÇÃO DE AUTENTICAÇÃO ---
async function checkProviderAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Não autenticado");
  }
  return session;
}

// --- ACEITAR SOLICITAÇÃO ---
export async function acceptRequest(requestId: string) {
  try {
    await checkProviderAuth();

    // 1. Atualiza o status do pedido para "accepted" (Aguardando Pagamento)
    await db
      .update(serviceOrder)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(serviceOrder.id, requestId));

    // 2. Busca os dados completos do pedido para enviar os e-mails
    const order = await db.query.serviceOrder.findFirst({
      where: eq(serviceOrder.id, requestId),
      with: {
        customer: true, // Pega o email e nome do cliente que solicitou
        provider: {
          with: {
            user: true, // Pega o nome do prestador
            category: true, // Pega o nome do serviço (ex: Encanador)
          },
        },
      },
    });

    // 3. Envia os e-mails se achou o pedido e o cliente
    if (order && order.customer?.email) {
      const clientDashboardUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/minha-conta/servicos`
        : "https://esggroup.shop/minha-conta/servicos";

      // --- E-mail para o CLIENTE ---
      await resend.emails.send({
        from: "ESG Group <contato@esggroup.shop>",
        to: order.customer.email,
        subject: `✅ Seu serviço foi aceito! Efetue o pagamento`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #ea580c; margin-top: 0;">Serviço Confirmado pelo Profissional!</h2>
            <p style="color: #333; font-size: 16px;">Olá, <strong>${order.customer.name}</strong>,</p>
            <p style="color: #555; font-size: 15px; line-height: 1.5;">Temos uma ótima notícia: o profissional <strong>${order.provider.user.name}</strong> aceitou a sua solicitação para o serviço de <strong>${order.provider.category.name}</strong>.</p>
            
            <p style="color: #555; font-size: 15px; line-height: 1.5;">Para que o serviço seja realizado, você precisa efetuar o pagamento seguro através da nossa plataforma.</p>
            
            <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
              <a href="${clientDashboardUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">Pagar Serviço Agora</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">Equipe ESG Group<br/>Este é um e-mail automático, por favor não responda.</p>
          </div>
        `,
      });

      // --- E-mail para o ADMIN ---
      const adminDashboardUrl = "https://esggroup.shop/admin/solicitacoes";
      await resend.emails.send({
        from: "ESG Group <contato@esggroup.shop>",
        to: "contatogroupesg@gmail.com",
        subject: `[ADMIN] Prestador Aceitou o Serviço`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #333; margin-top: 0;">Serviço Aceito</h2>
            <p style="color: #555; font-size: 15px;">O prestador <strong>${order.provider.user.name}</strong> acabou de ACEITAR a solicitação de serviço.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 5px 0; color: #333; font-size: 14px;"><strong>Cliente:</strong> ${order.customer.name}</p>
              <p style="margin: 0 0 5px 0; color: #333; font-size: 14px;"><strong>Serviço:</strong> ${order.provider.category.name}</p>
              <p style="margin: 0; color: #333; font-size: 14px;"><strong>Status Atual:</strong> Aguardando Pagamento do Cliente</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${adminDashboardUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">Ver no Painel Admin</a>
            </div>
          </div>
        `,
      });
    }

    revalidatePath("/painel-prestador");
    return {
      success: true,
      message: "Serviço aceito! O cliente foi notificado para pagamento.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao aceitar solicitação." };
  }
}

// --- REJEITAR / CANCELAR SOLICITAÇÃO ---
export async function rejectRequest(requestId: string, reason?: string) {
  try {
    await checkProviderAuth();

    await db
      .update(serviceOrder)
      .set({
        status: "canceled",
        updatedAt: new Date(),
        rejectionReason: reason || null, // Salva o motivo se for enviado
      })
      .where(eq(serviceOrder.id, requestId));

    revalidatePath("/painel-prestador");
    return { success: true, message: "Solicitação cancelada." };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao cancelar solicitação." };
  }
}

// --- CONCLUIR SERVIÇO (PAINEL DO PRESTADOR) ---
export async function completeRequest(
  requestId: string,
  summary?: string,
  photoUrl?: string,
) {
  try {
    await checkProviderAuth();

    const order = await db.query.serviceOrder.findFirst({
      where: eq(serviceOrder.id, requestId),
      with: {
        customer: true,
        provider: {
          with: { user: true, category: true },
        },
      },
    });

    if (!order) return { success: false, error: "Pedido não encontrado." };

    // 🚨 TRAVA DE SEGURANÇA: Não conclui se não estiver pago
    if (order.paymentStatus !== "succeeded") {
      return {
        success: false,
        error: "O cliente ainda não realizou o pagamento.",
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updatedAt: new Date(),
      completionSummary: summary || null,
      completionPhotoUrl: photoUrl || null,
    };

    if (order.status === "client_completed") {
      updateData.status = "completed";

      await db
        .update(serviceOrder)
        .set(updateData)
        .where(eq(serviceOrder.id, requestId));

      // --- DISPARO DE E-MAILS DE CONCLUSÃO ---
      if (order.customer?.email && order.provider?.user?.email) {
        // 1. Email pro Cliente
        await resend.emails.send({
          from: "ESG Group <contato@esggroup.shop>",
          to: order.customer.email,
          subject: `🌟 Serviço 100% Concluído: ${order.provider.category.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2 style="color: #10b981; margin-top: 0;">Serviço Finalizado!</h2>
              <p style="color: #333; font-size: 16px;">Olá, <strong>${order.customer.name}</strong>,</p>
              <p style="color: #555; font-size: 15px;">O serviço de <strong>${order.provider.category.name}</strong> foi marcado como concluído por ambas as partes!</p>
              <p style="color: #555; font-size: 15px;">Agradecemos por confiar no ESG Group. Esperamos vê-lo novamente em breve!</p>
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
              <p style="color: #999; font-size: 12px; text-align: center;">Equipe ESG Group</p>
            </div>
          `,
        });

        // 2. Email pro Prestador
        await resend.emails.send({
          from: "ESG Group <contato@esggroup.shop>",
          to: order.provider.user.email,
          subject: `🎉 Parabéns! Serviço Concluído`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2 style="color: #10b981; margin-top: 0;">Serviço Finalizado com Sucesso!</h2>
              <p style="color: #333; font-size: 16px;">Olá, <strong>${order.provider.user.name}</strong>,</p>
              <p style="color: #555; font-size: 15px;">O serviço de <strong>${order.provider.category.name}</strong> para o cliente ${order.customer.name} foi confirmado por ambos.</p>
              <p style="color: #555; font-size: 15px;">A sua comissão já está contabilizada e será repassada conforme nossos termos. Excelente trabalho!</p>
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
              <p style="color: #999; font-size: 12px; text-align: center;">Equipe ESG Group</p>
            </div>
          `,
        });

        // 3. Email pro Admin
        await resend.emails.send({
          from: "ESG Group <contato@esggroup.shop>",
          to: "contatogroupesg@gmail.com",
          subject: `[ADMIN] Serviço Totalmente Concluído`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2 style="color: #333; margin-top: 0;">Serviço Finalizado</h2>
              <p style="color: #555; font-size: 15px;">Um serviço foi confirmado como concluído pelo Prestador e pelo Cliente.</p>
              <p style="color: #333; font-size: 14px;"><strong>Cliente:</strong> ${order.customer.name}</p>
              <p style="color: #333; font-size: 14px;"><strong>Prestador:</strong> ${order.provider.user.name}</p>
              <p style="color: #333; font-size: 14px;"><strong>Serviço:</strong> ${order.provider.category.name}</p>
            </div>
          `,
        });
      }

      revalidatePath("/painel-prestador");
      return {
        success: true,
        message: "Serviço totalmente concluído com sucesso!",
      };
    } else if (order.status === "in_progress" || order.status === "accepted") {
      updateData.status = "provider_completed";

      await db
        .update(serviceOrder)
        .set(updateData)
        .where(eq(serviceOrder.id, requestId));

      revalidatePath("/painel-prestador");
      return {
        success: true,
        message: "Sua parte foi confirmada! Aguardando o cliente.",
      };
    } else {
      return {
        success: false,
        error: "O serviço não pode ser concluído neste momento.",
      };
    }
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro ao concluir serviço." };
  }
}
