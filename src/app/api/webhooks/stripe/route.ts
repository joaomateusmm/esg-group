import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import Stripe from "stripe";

import { decreaseProductStock } from "@/actions/stock";
import { db } from "@/db";
import { order } from "@/db/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
  typescript: true,
});

const resend = new Resend(process.env.RESEND_API_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@esggroup.com";

// --- DEBUG INICIAL ---
console.log("🔧 WEBHOOK INIT: ADMIN_EMAIL carregado como:", ADMIN_EMAIL);

// --- HELPER FORMATADOR ---
const formatCurrency = (amount: number, currency = "GBP") => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
};

// --- HELPER GERADOR DE HTML DE PRODUTOS ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateProductsHtml = (items: any[], currency: string) => {
  return items
    .map(
      (item) => `
      <div style="border-bottom: 1px solid #eeeeee; padding: 15px 0; display: flex; align-items: center;">
        <img src="${item.image || "https://placehold.co/60"}" width="60" height="60" style="border-radius: 6px; object-fit: cover; margin-right: 15px; background-color: #f9f9f9;" />
        <div style="flex: 1;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #333;">${item.productName}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #888;">Qtd: ${item.quantity}</p>
        </div>
        <div style="font-size: 14px; font-weight: 600; color: #333;">
          ${formatCurrency(item.price, currency)}
        </div>
      </div>
    `,
    )
    .join("");
};

// --- EMAIL PARA O CLIENTE ---
async function sendStripeOrderEmail(
  email: string,
  name: string,
  orderId: string,
  amount: number,
  currency: string = "GBP",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[] = [],
) {
  console.log(`📧 CLIENTE: Iniciando envio para ${email}...`);
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://esggroup.com";
    const LOGO_URL = `${BASE_URL}/images/logo.png`;
    const ORDER_LINK = `${BASE_URL}/minha-conta/compras/${orderId}`;
    const formattedTotal = formatCurrency(amount, currency);
    const productsHtml = generateProductsHtml(items, currency);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; color: #333; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(to right, #ea580c, #f97316); padding: 30px 20px; text-align: center; color: white; }
          .content { padding: 30px 25px; }
          .btn { display: inline-block; background-color: #ea580c; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .summary-box { background-color: #fff7ed; border: 1px solid #ffedd5; padding: 15px; border-radius: 6px; margin-top: 20px; }
          .footer { background-color: #fafafa; padding: 20px; text-align: center; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${LOGO_URL}" alt="ESG Group" width="80" height="80" style="display: block; margin: 0 auto 15px auto; background-color: #ffffff; padding: 10px; border-radius: 50%; object-fit: contain;" />
            <h2 style="margin:0;">Pagamento Aprovado!</h2>
            <p style="margin:5px 0 0 0; opacity:0.9;">#${orderId.slice(0, 8).toUpperCase()}</p>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Olá, <strong>${name}</strong>!</p>
            <p style="color: #555; line-height: 1.5;">Seu pagamento foi confirmado com sucesso. Já estamos separando seus itens para envio.</p>
            
            <div style="margin-top: 25px; margin-bottom: 25px;">
              <h3 style="font-size: 14px; text-transform: uppercase; color: #888; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 0;">Itens Comprados</h3>
              ${productsHtml}
            </div>

            <div class="summary-box">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 14px; font-weight: bold; color: #ea580c; text-align: left;">Total Pago</td>
                  <td style="font-size: 18px; font-weight: bold; color: #ea580c; text-align: right;">${formattedTotal}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center;">
              <a href="${ORDER_LINK}" class="btn">Acompanhar Pedido</a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ESG Group. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "ESG Group <contato@esggroup.shop>",
      to: [email],
      subject: `Pagamento Confirmado: Pedido #${orderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    });
    console.log(
      `✅ CLIENTE: Email enviado com sucesso! ID: ${result.data?.id}`,
    );
  } catch (err) {
    console.error("❌ CLIENTE: Erro ao enviar email:", err);
  }
}

// --- EMAIL PARA O ADMIN ---
async function sendAdminOrderEmail(
  customerName: string,
  orderId: string,
  amount: number,
  currency: string = "GBP",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[] = [],
) {
  console.log(`📧 ADMIN: Iniciando envio para ${ADMIN_EMAIL}...`);
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://esggroup.com";
    const LOGO_URL = `${BASE_URL}/images/logo.png`;
    const ADMIN_ORDER_LINK = `${BASE_URL}/admin/pedidos`;
    const formattedTotal = formatCurrency(amount, currency);
    const productsHtml = generateProductsHtml(items, currency);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; color: #333; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(to right, #1e293b, #334155); padding: 30px 20px; text-align: center; color: white; }
          .content { padding: 30px 25px; }
          .btn { display: inline-block; background-color: #1e293b; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .alert-box { background-color: #e0f2fe; border: 1px solid #bae6fd; color: #0369a1; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-weight: 500; }
          .footer { background-color: #fafafa; padding: 20px; text-align: center; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${LOGO_URL}" alt="ESG Group" width="80" height="80" style="display: block; margin: 0 auto 15px auto; background-color: #ffffff; padding: 10px; border-radius: 50%; object-fit: contain;" />
            <h2 style="margin:0;">Novo Pedido Recebido!</h2>
            <p style="margin:5px 0 0 0; opacity:0.8;">#${orderId.slice(0, 8).toUpperCase()}</p>
          </div>
          <div class="content">
            
            <div class="alert-box">
              ⚠️ Um novo pedido foi gerado. Acesse a tabela de pedidos para analisar e seguir com a entrega.
            </div>

            <p style="font-size: 15px;"><strong>Cliente:</strong> ${customerName}</p>
            <p style="font-size: 15px;"><strong>Valor Total:</strong> ${formattedTotal}</p>

            <div style="margin-top: 25px; margin-bottom: 25px;">
              <h3 style="font-size: 14px; text-transform: uppercase; color: #888; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 0;">Detalhes do Pedido</h3>
              ${productsHtml}
            </div>

            <div style="text-align: center;">
              <a href="${ADMIN_ORDER_LINK}" class="btn">Gerenciar Pedido no Painel</a>
            </div>
          </div>
          <div class="footer">
            <p>Notificação automática do Sistema Administrativo ESG Group.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "ESG Group <contato@esggroup.shop>",
      to: [ADMIN_EMAIL],
      subject: `🔔 NOVO PEDIDO: #${orderId.slice(0, 8).toUpperCase()} - ${customerName}`,
      html: emailHtml,
    });

    if (result.error) {
      console.error("❌ ADMIN: Erro retornado pelo Resend:", result.error);
    } else {
      console.log(
        `✅ ADMIN: Email enviado com sucesso! ID: ${result.data?.id}`,
      );
    }
  } catch (err) {
    console.error("❌ ADMIN: Erro Crítico ao enviar email:", err);
  }
}

// --- WEBHOOK HANDLER ---
export async function POST(req: Request) {
  console.log("⚡ WEBHOOK: Recebido evento do Stripe");
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`❌ WEBHOOK: Falha na assinatura.`, err);
    return new NextResponse(`Webhook Error`, { status: 400 });
  }

  console.log(`⚡ WEBHOOK: Evento Tipo: ${event.type}`);

  if (
    event.type === "payment_intent.succeeded" ||
    event.type === "checkout.session.completed"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = event.data.object as any;
    const orderId = obj.metadata?.orderId;

    if (orderId) {
      console.log(`⚡ WEBHOOK: Processando Pedido ID: ${orderId}`);

      try {
        // 1. VERIFICAÇÃO DE SEGURANÇA (EVITA E-MAIL DUPLO)
        // Buscamos o pedido antes de atualizar
        const existingOrder = await db.query.order.findFirst({
          where: eq(order.id, orderId),
        });

        if (existingOrder && existingOrder.status === "paid") {
          console.log(
            "🛑 WEBHOOK: Pedido já processado anteriormente. Ignorando evento duplicado.",
          );
          return NextResponse.json({ received: true });
        }

        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() + 10);
        const end = new Date(today);
        end.setDate(today.getDate() + 17);

        await db
          .update(order)
          .set({
            status: "paid",
            fulfillmentStatus: "processing",
            stripePaymentIntentId: obj.id || obj.payment_intent,
            estimatedDeliveryStart: start,
            estimatedDeliveryEnd: end,
          })
          .where(eq(order.id, orderId));

        console.log("⚡ WEBHOOK: Banco de dados atualizado.");

        // 3. RECUPERAMOS OS DADOS ATUALIZADOS PARA O EMAIL (incluindo items)
        const orderData = await db.query.order.findFirst({
          where: eq(order.id, orderId),
          with: { items: true },
        });

        if (orderData) {
          console.log("⚡ WEBHOOK: Dados recuperados. Iniciando envios...");

          // Enviar Cliente
          if (orderData.customerEmail) {
            await sendStripeOrderEmail(
              orderData.customerEmail,
              orderData.customerName || "Cliente",
              orderData.id,
              orderData.amount,
              orderData.currency || "GBP",
              orderData.items,
            );
          }

          // Enviar Admin
          await sendAdminOrderEmail(
            orderData.customerName || "Cliente",
            orderData.id,
            orderData.amount,
            orderData.currency || "GBP",
            orderData.items,
          );
        }

        await decreaseProductStock(orderId);
      } catch (e) {
        console.error("❌ WEBHOOK: Erro ao processar pedido:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
