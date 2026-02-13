"use server";

import { eq, ilike, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

import { db } from "@/db";
import { order, orderItem, user } from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@esggroup.com";

// Helper para formatar moeda
const formatCurrency = (amount: number, currency = "BRL") => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
};

// --- NOVA FUNÇÃO: Atualizar Datas de Entrega Manualmente ---
export async function updateDeliveryDates(
  orderId: string,
  startDate: Date,
  endDate: Date,
) {
  try {
    await db
      .update(order)
      .set({
        estimatedDeliveryStart: startDate,
        estimatedDeliveryEnd: endDate,
        updatedAt: new Date(),
      })
      .where(eq(order.id, orderId));

    revalidatePath("/admin/pedidos");
    return { success: true, message: "Prazo de entrega atualizado!" };
  } catch (error) {
    console.error("Erro ao atualizar datas:", error);
    return { success: false, message: "Erro ao atualizar prazo." };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  type: "financial" | "fulfillment" = "financial",
) {
  try {
    const updateData: {
      updatedAt: Date;
      status?: string;
      fulfillmentStatus?: string;
      estimatedDeliveryStart?: Date; // Adicionado para tipagem
      estimatedDeliveryEnd?: Date; // Adicionado para tipagem
    } = {
      updatedAt: new Date(),
    };

    // --- LÓGICA DE CRIAÇÃO DO PRAZO PADRÃO (10 a 17 dias) ---
    // Se o status logístico for alterado para 'processing' (Preparando),
    // e ainda não tivermos datas definidas, criamos o prazo padrão.
    if (type === "fulfillment" && newStatus === "processing") {
      // Verifica se já tem datas (opcional, para não sobrescrever se o admin já editou manual)
      const currentOrder = await db.query.order.findFirst({
        where: eq(order.id, orderId),
        columns: { estimatedDeliveryStart: true },
      });

      if (!currentOrder?.estimatedDeliveryStart) {
        const today = new Date();

        const start = new Date(today);
        start.setDate(today.getDate() + 10); // +10 dias

        const end = new Date(today);
        end.setDate(today.getDate() + 17); // +17 dias

        updateData.estimatedDeliveryStart = start;
        updateData.estimatedDeliveryEnd = end;
      }
    }

    if (type === "fulfillment") {
      updateData.fulfillmentStatus = newStatus;
    } else {
      updateData.status = newStatus;
    }

    // 1. Atualizar no Banco de Dados
    await db.update(order).set(updateData).where(eq(order.id, orderId));

    // 2. Lógica de Envio de E-mail (Apenas para logística)
    if (type === "fulfillment") {
      const [orderData] = await db
        .select({
          id: order.id,
          amount: order.amount,
          shippingCost: order.shippingCost,
          currency: order.currency,
          trackingCode: order.trackingCode,
          shippingAddress: order.shippingAddress,
          // Novas colunas de data para usar no email se quiser no futuro
          estimatedDeliveryStart: order.estimatedDeliveryStart,
          estimatedDeliveryEnd: order.estimatedDeliveryEnd,
          // Dados do Pedido
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          // Dados da Conta
          accountName: user.name,
          accountEmail: user.email,
          // Dados do Item
          productName: orderItem.productName,
          productImage: orderItem.image,
          productPrice: orderItem.price,
          productQuantity: orderItem.quantity,
        })
        .from(order)
        .leftJoin(user, eq(order.userId, user.id))
        .leftJoin(orderItem, eq(order.id, orderItem.orderId))
        .where(eq(order.id, orderId))
        .limit(1);

      if (orderData) {
        const targetEmail = orderData.customerEmail || orderData.accountEmail;
        const targetName =
          orderData.customerName || orderData.accountName || "Cliente";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const addr = orderData.shippingAddress as any;
        const addressString = addr
          ? `${addr.street}, ${addr.number} - ${addr.city}/${addr.state} - CEP: ${addr.zipCode}`
          : "Endereço não informado";

        const statusMap: Record<
          string,
          { label: string; description: string; color: string; bgColor: string }
        > = {
          processing: {
            label: "ESG Group - PREPARANDO",
            description: "Seu pedido está sendo preparado com cuidado.",
            color: "#1d4ed8",
            bgColor: "#eff6ff",
          },
          shipped: {
            label: "ESG Group - A CAMINHO",
            description: "Seu pedido foi enviado e está a caminho!",
            color: "#ea580c",
            bgColor: "#fff7ed",
          },
          delivered: {
            label: "ESG Group - ENTREGUE",
            description: "Seu pedido foi entregue. Esperamos que goste!",
            color: "#15803d",
            bgColor: "#f0fdf4",
          },
          returned: {
            label: "ESG Group - DEVOLVIDO",
            description: "O pedido foi marcado como devolvido.",
            color: "#b91c1c",
            bgColor: "#fef2f2",
          },
          idle: {
            label: "ESG Group - AGUARDANDO",
            description: "Aguardando atualização de status.",
            color: "#6b7280",
            bgColor: "#f9fafb",
          },
        };

        const BASE_URL =
          process.env.NEXT_PUBLIC_APP_URL || "https://esggroup.com";
        const LOGO_URL = `${BASE_URL}/images/logo.png`;

        const currentStatus = statusMap[newStatus] || statusMap.idle;

        const shipping = orderData.shippingCost || 0;
        const total = orderData.amount;
        const subtotal = total - shipping;

        // Formatação das datas de entrega para o e-mail (Opcional, mas legal ter)
        let deliveryHtml = "";
        if (
          orderData.estimatedDeliveryStart &&
          orderData.estimatedDeliveryEnd
        ) {
          const startStr =
            orderData.estimatedDeliveryStart.toLocaleDateString("pt-BR");
          const endStr =
            orderData.estimatedDeliveryEnd.toLocaleDateString("pt-BR");
          deliveryHtml = `
              <div style="margin-bottom: 20px; text-align: center; background-color: #f0fdf4; border: 1px dashed #15803d; padding: 10px; border-radius: 6px;">
                <p style="margin:0; font-size: 12px; color: #15803d; font-weight: bold; text-transform: uppercase;">Previsão de Entrega</p>
                <p style="margin:0; font-size: 14px; color: #14532d;">${startStr} a ${endStr}</p>
              </div>
            `;
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Atualização do Pedido</title>
            <style>
              /* Base Styles */
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; color: #333333; -webkit-font-smoothing: antialiased; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
              
              /* Header */
              .header { background: linear-gradient(to right, #ee4d2d, #ff7337); padding: 30px 20px; text-align: center; color: white; }
              .header-title { font-size: 20px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
              .header-subtitle { font-size: 14px; margin-top: 5px; opacity: 0.9; }
              
              /* Content Area */
              .content { padding: 30px 25px; }
              
              /* Greeting */
              .greeting { font-size: 16px; margin-bottom: 20px; color: #333; }
              
              /* Tracking (Conditional) */
              .tracking-section { margin-bottom: 25px; text-align: center; }
              .tracking-code { display: inline-block; background: #f0f0f0; padding: 8px 16px; border-radius: 4px; font-family: monospace; font-weight: bold; letter-spacing: 1px; color: #333; margin-top: 5px; }
              .tracking-title { font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold; }

              /* Product Card (With Top/Bottom Borders) */
              .product-section { border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; margin-bottom: 25px; }
              .section-header { background-color: #fafafa; padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-size: 13px; font-weight: 600; color: #555; }
              
              .product-item { display: flex; padding: 15px; border-bottom: 1px solid #f0f0f0; align-items: flex-start; }
              .product-img { width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid #eee; background-color: #f9f9f9; margin-right: 15px; }
              .product-details { flex: 1; }
              .product-title { font-size: 14px; font-weight: 500; color: #333; margin: 0 0 5px 0; line-height: 1.4; }
              .product-meta { font-size: 12px; color: #888; margin-bottom: 2px; }
              .product-qty { font-size: 12px; color: #888; }
              .product-price { font-size: 14px; font-weight: 600; color: #ee4d2d; text-align: right; min-width: 80px; align-self: center; }
              
              /* Order Info Table */
              .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
              .info-table td { padding: 8px 0; color: #666; }
              .info-table .label { width: 40%; }
              .info-table .value { text-align: right; color: #333; }
              .info-table .total-row td { border-top: 1px dashed #ddd; padding-top: 12px; font-size: 15px; font-weight: 700; color: #ee4d2d; }
              
              /* Address Box */
              .address-box { background-color: #fdfdfd; border: 1px solid #eee; border-radius: 6px; padding: 15px; margin-bottom: 25px; }
              .address-title { font-size: 12px; font-weight: 700; color: #999; margin-bottom: 8px; text-transform: uppercase; }
              .address-text { font-size: 13px; color: #444; line-height: 1.5; margin: 0; }
              
              /* Button */
              .btn-container { text-align: center; margin-top: 30px; }
              .btn { display: inline-block; background-color: #ee4d2d; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 600; font-size: 14px; transition: background-color 0.2s; }
              .btn:hover { background-color: #d73d1f; }
              
              /* Footer */
              .footer { background-color: #fafafa; padding: 20px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; }
              .footer p { margin: 5px 0; }
              .social-links { margin-top: 10px; }
              .social-link { display: inline-block; margin: 0 5px; text-decoration: none; color: #ee4d2d; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${LOGO_URL}" alt="ESG Group" width="100" style="display: block; margin: 0 auto 15px auto; border-radius: 8px;" />
                <div class="header-title">${currentStatus.label}</div>
                <div class="header-subtitle">Pedido #${orderData.id.slice(0, 8).toUpperCase()}</div>
              </div>
              
              <div class="content">
                <p class="greeting">Olá, <strong>${targetName}</strong>!</p>
                <p style="font-size: 14px; color: #555; margin-bottom: 20px;">${currentStatus.description}</p>

                ${deliveryHtml}

                ${
                  orderData.trackingCode
                    ? `
                  <div class="tracking-section">
                    <div class="tracking-title">Código de Rastreio</div>
                    <div class="tracking-code">${orderData.trackingCode}</div>
                  </div>
                `
                    : ""
                }

                <div class="product-section">
                  <div class="section-header">
                    <span>🛍️ Detalhes do Pedido</span>
                  </div>
                  
                  <div class="product-item">
                    ${
                      orderData.productImage
                        ? `<img src="${orderData.productImage}" alt="Produto" class="product-img" />`
                        : '<div class="product-img" style="display:flex;align-items:center;justify-content:center;color:#ccc;font-size:24px;">📦</div>'
                    }
                    
                    <div class="product-details">
                      <div class="product-title">${orderData.productName}</div>
                      <div class="product-meta">Variação: Padrão</div>
                      <div class="product-qty">x${orderData.productQuantity}</div>
                    </div>
                    
                    <div class="product-price">
                      ${formatCurrency(orderData.productPrice || 0, orderData.currency)}
                    </div>
                  </div>
                </div>

                <table class="info-table">
                  <tr>
                    <td class="label">Subtotal</td>
                    <td class="value">${formatCurrency(subtotal, orderData.currency)}</td>
                  </tr>
                  <tr>
                    <td class="label">Frete</td>
                    <td class="value">${
                      shipping === 0
                        ? "Grátis"
                        : formatCurrency(shipping, orderData.currency)
                    }</td>
                  </tr>
                  <tr class="total-row">
                    <td class="total-label">Total Pago</td>
                    <td class="value">${formatCurrency(total, orderData.currency)}</td>
                  </tr>
                </table>

                <div class="address-box">
                  <div class="address-title">📍 Endereço de Entrega</div>
                  <p class="address-text">${addressString}</p>
                </div>

                <div class="btn-container">
                  <a href="https://www.esggroup.shop/minha-conta/compras/${orderData.id}" class="btn">
                    Ver Pedido Completo
                  </a>
                </div>
              </div>

              <div class="footer">
                <p>Este é um e-mail automático, por favor não responda.</p>
                <p>Pedido realizado em ${new Date().toLocaleDateString("pt-BR")}</p>
                <p>© 2022 ESG Group. Todos os direitos reservados.</p>
                <div class="social-links">
                  <a href="#" class="social-link">Instagram</a> • 
                  <a href="#" class="social-link">Facebook</a> • 
                  <a href="#" class="social-link">Suporte</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        if (targetEmail) {
          const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || "ESG Group <contato@esggroup.shop>",
            to: [targetEmail, ADMIN_EMAIL],
            subject: `${currentStatus.label}: Atualização do Pedido #${orderData.id.slice(0, 8).toUpperCase()}`,
            html: emailHtml,
          });

          if (error) {
            console.error("❌ ERRO RESEND:", error);
          } else {
            console.log(
              `✅ E-mail enviado com ID: ${data?.id} para ${targetEmail}`,
            );
          }
        }
      }
    }

    revalidatePath("/admin/pedidos");

    return {
      success: true,
      message: `Status ${type === "fulfillment" ? "logístico" : "financeiro"} atualizado com sucesso!`,
    };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { success: false, message: "Erro ao atualizar status." };
  }
}

// Atualiza o código de rastreio
export async function updateTrackingCode(orderId: string, code: string) {
  try {
    await db
      .update(order)
      .set({
        trackingCode: code,
        updatedAt: new Date(),
      })
      .where(eq(order.id, orderId));

    revalidatePath("/admin/pedidos");
    return { success: true, message: "Rastreio salvo!" };
  } catch (error) {
    console.error("Erro ao salvar rastreio:", error);
    return { success: false, message: "Erro ao salvar rastreio." };
  }
}

// Exclusão em massa
export async function deleteOrders(ids: string[]) {
  try {
    await db.delete(order).where(inArray(order.id, ids));
    revalidatePath("/admin/pedidos");
    return { success: true, message: `${ids.length} pedidos excluídos.` };
  } catch (error) {
    console.error("Erro ao excluir pedidos:", error);
    return { success: false, message: "Erro ao excluir pedidos." };
  }
}

// Busca IDs para seleção global
export async function getAllOrderIds(search?: string) {
  const baseQuery = db
    .select({ id: order.id })
    .from(order)
    .leftJoin(user, eq(order.userId, user.id));

  if (search) {
    baseQuery.where(
      or(
        ilike(order.id, `%${search}%`),
        ilike(order.customerName, `%${search}%`),
        ilike(user.name, `%${search}%`),
        ilike(order.customerEmail, `%${search}%`),
        ilike(user.email, `%${search}%`),
      ),
    );
  }

  const result = await baseQuery;
  return result.map((o) => o.id);
}
