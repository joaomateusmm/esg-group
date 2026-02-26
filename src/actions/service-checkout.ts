"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Stripe from "stripe";
import { z } from "zod";

import { db } from "@/db";
import { serviceOrder } from "@/db/schema";
import { auth } from "@/lib/auth";

// Inicializa o cliente do Stripe com a sua chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
});

// Validação dos dados recebidos do frontend
const serviceCheckoutSchema = z.object({
  description: z.string().min(10),
  address: z.string().min(5),
  contactPhone: z.string().min(8),
  providerId: z.string(),
  categoryId: z.string(),
  amount: z.number().positive(), // Valor em centavos
});

type ServiceCheckoutPayload = z.infer<typeof serviceCheckoutSchema>;

export async function createServicePaymentIntent(data: ServiceCheckoutPayload) {
  try {
    // 1. Verificar Autenticação (Quem está contratando)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: "Você precisa estar logado para contratar um serviço.",
      };
    }

    // 2. Validar Dados
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
    } = parsed.data;

    // 3. Criar a Intenção de Pagamento na Stripe
    // A Stripe exige o valor em centavos (que já enviamos assim do banco/front)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "gbp", // Libras Esterlinas
      metadata: {
        type: "service_order", // Para identificarmos no Webhook depois
        customerId: session.user.id,
        providerId: providerId,
        categoryId: categoryId,
      },
      // Configurações recomendadas para evitar recusas automáticas rígidas sem necessidade
      automatic_payment_methods: {
        enabled: true,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe não retornou o client_secret.");
    }

    // 4. Salvar o Pedido no Banco de Dados com Status Pendente
    // Geramos o ID aqui caso seu schema não use o $defaultFn, mas se usar, o DB cria sozinho.
    // Garantimos salvar o ID da intenção de pagamento para bater com o webhook.
    await db.insert(serviceOrder).values({
      id: crypto.randomUUID(),
      customerId: session.user.id,
      providerId: providerId,
      categoryId: categoryId,
      description: description,
      address: address,
      contactPhone: contactPhone,
      amount: amount,
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: "pending",
      status: "pending",
    });

    // 5. Retornar o Client Secret para o Frontend exibir o form do cartão
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

// Adicione isso no final do arquivo src/actions/service-checkout.ts

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
