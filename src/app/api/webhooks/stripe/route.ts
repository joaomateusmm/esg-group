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

// --- HELPER FORMATADOR ---
const formatCurrency = (amount: number, currency = "GBP") => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
};

async function sendStripeOrderEmail(
  email: string,
  name: string,
  orderId: string,
  amount: number,
  currency: string = "GBP",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[] = [], // Recebe itens do banco
) {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://esggroup.com";
    const LOGO_URL = `${BASE_URL}/images/logo.png`;
    const ORDER_LINK = `${BASE_URL}/minha-conta/compras/${orderId}`;
    const formattedTotal = formatCurrency(amount, currency);

    // GERA HTML DA LISTA DE PRODUTOS
    const productsHtml = items
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
            <img src="${LOGO_URL}" alt="ESG Group" width="100" style="display: block; margin: 0 auto 15px auto;" />
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
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: bold; color: #ea580c;">Total Pago</span>
                <span style="font-size: 18px; font-weight: bold; color: #ea580c;">${formattedTotal}</span>
              </div>
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

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "ESG Group <contato@esggroup.shop>",
      to: [email, ADMIN_EMAIL],
      subject: `✅ Pagamento Confirmado: Pedido #${orderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    });
    console.log(`✅ E-mail enviado para ${email}`);
  } catch (err) {
    console.error("❌ Erro email webhook:", err);
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    // Corrigido: usando a variável err para logar antes de retornar
    console.error(`Webhook signature verification failed.`, err);
    return new NextResponse(`Webhook Error`, { status: 400 });
  }

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() + 10);
  const end = new Date(today);
  end.setDate(today.getDate() + 17);

  // Lógica unificada para tratar ambos os eventos de sucesso
  if (
    event.type === "payment_intent.succeeded" ||
    event.type === "checkout.session.completed"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = event.data.object as any;
    const orderId = obj.metadata?.orderId;

    if (orderId) {
      console.log(`💰 Pagamento confirmado: ${orderId}`);

      try {
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

        // --- BUSCA ITENS NO BANCO PARA O EMAIL ---
        const orderData = await db.query.order.findFirst({
          where: eq(order.id, orderId),
          with: { items: true }, // <--- CRUCIAL: Traz os itens
        });

        if (orderData?.customerEmail) {
          await sendStripeOrderEmail(
            orderData.customerEmail,
            orderData.customerName || "Cliente",
            orderData.id,
            orderData.amount,
            orderData.currency || "GBP",
            orderData.items, // <--- Passa a lista de itens
          );
        }

        await decreaseProductStock(orderId);
      } catch (e) {
        console.error("Erro update pedido:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
