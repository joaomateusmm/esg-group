import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Resend } from "resend";

import { decreaseProductStock } from "@/actions/stock";
import { db } from "@/db";
import {
  affiliate,
  commission,
  order,
  orderItem,
  product,
  user,
} from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  console.log("🔔 Webhook InfinitePay Recebido!");

  try {
    const payload = await request.json();
    const orderId = payload.order_nsu;

    if (!orderId) {
      return NextResponse.json(
        { message: "Order NSU missing" },
        { status: 400 },
      );
    }

    // 1. Buscar o pedido e validar
    const existingOrder = await db.query.order.findFirst({
      where: eq(order.id, orderId),
    });

    if (!existingOrder) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (existingOrder.status === "paid") {
      return NextResponse.json(
        { message: "Already processed" },
        { status: 200 },
      );
    }

    // 2. Atualizar status para PAGO
    await db
      .update(order)
      .set({
        status: "paid",
        transactionId: payload.transaction_nsu,
        metadata: JSON.stringify(payload),
      })
      .where(eq(order.id, orderId));

    // --- NOVA LÓGICA: BAIXAR ESTOQUE ---
    try {
      console.log(`📉 Baixando estoque para o pedido ${orderId}...`);
      await decreaseProductStock(orderId);
      console.log("✅ Estoque atualizado com sucesso!");
    } catch (stockError) {
      console.error("❌ Erro ao atualizar estoque:", stockError);
      // Não interrompemos o fluxo, pois o pagamento já foi confirmado
    }
    // -----------------------------------

    // --- PROCESSAR COMISSÃO DE AFILIADO ---
    try {
      const pendingCommission = await db.query.commission.findFirst({
        where: eq(commission.orderId, orderId),
      });

      if (pendingCommission && pendingCommission.status === "pending") {
        console.log(
          `💰 Processando comissão de: R$ ${(pendingCommission.amount / 100).toFixed(2)}`,
        );

        await db
          .update(commission)
          .set({ status: "paid" })
          .where(eq(commission.id, pendingCommission.id));

        await db
          .update(affiliate)
          .set({
            balance: sql`${affiliate.balance} + ${pendingCommission.amount}`,
            totalEarnings: sql`${affiliate.totalEarnings} + ${pendingCommission.amount}`,
          })
          .where(eq(affiliate.id, pendingCommission.affiliateId));

        console.log("✅ Saldo do afiliado atualizado!");
      }
    } catch (commError) {
      console.error("❌ Erro ao processar comissão:", commError);
    }

    // 3. Buscar os produtos e seus links de download
    const orderItemsList = await db
      .select({
        productName: orderItem.productName,
        productId: orderItem.productId,
      })
      .from(orderItem)
      .where(eq(orderItem.orderId, orderId));

    const productsWithLinks = await Promise.all(
      orderItemsList.map(async (item) => {
        const prod = await db.query.product.findFirst({
          where: eq(product.id, item.productId),
          columns: { downloadUrl: true },
        });
        return {
          name: item.productName,
          url: prod?.downloadUrl || "#",
        };
      }),
    );

    // 4. Buscar dados do Cliente
    const customer = await db.query.user.findFirst({
      where: eq(user.id, existingOrder.userId),
    });

    // 5. ENVIAR O E-MAIL
    if (customer?.email) {
      console.log(`📧 Preparando email para: ${customer.email}`);

      const productsHtml = productsWithLinks
        .map(
          (p) => `
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
          <h3 style="margin: 0 0 5px; color: #333;">${p.name}</h3>
          ${
            p.url && p.url !== "#"
              ? `<a href="${p.url}" style="background-color: #D00000; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-family: sans-serif;">Baixar Arquivo</a>`
              : `<p style="color: #666; font-size: 14px;">Acesse sua conta para visualizar.</p>`
          }
        </div>
      `,
        )
        .join("");

      const emailHtml = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #D00000;">Pagamento Confirmado! 🚀</h1>
          <p>Olá, <strong>${customer.name}</strong>!</p>
          <p>Seu pagamento foi aprovado com sucesso. Aqui estão seus arquivos:</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
            ${productsHtml}
          </div>

          <p>Você também pode acessar seus arquivos a qualquer momento na sua área de membros:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/minha-conta/compras" style="color: #D00000; text-decoration: underline;">Acessar Minhas Compras</a>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">Obrigado por comprar na ESG-Group.</p>
        </div>
      `;

      await resend.emails.send({
        from: "ESG-Group Store <onboarding@resend.dev>",
        to: [customer.email],
        subject: "Seu pedido está aqui! 📦",
        html: emailHtml,
      });

      console.log(`✅ Email enviado com sucesso para ${customer.email}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
