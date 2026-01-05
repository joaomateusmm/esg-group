import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    console.log("Iniciando teste de email (Modo HTML Puro)...");

    // Construímos o HTML manualmente para não depender de renderizadores do React
    // Isso evita o erro do "react-dom/server" e o erro "render$1"
    const htmlContent = `
      <div style="font-family: sans-serif; color: #333;">
        <h1>Teste de Integração Resend 🚀</h1>
        <p>Olá, <strong>João Mateus</strong>!</p>
        <p>Se você está vendo este e-mail, sua configuração de API Key e envio está 100% correta.</p>
        
        <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Teste de Links de Produto:</strong></p>
            <ul>
                <li><a href="https://google.com">Produto Teste 1</a></li>
                <li><a href="https://youtube.com">Produto Teste 2</a></li>
            </ul>
        </div>

        <p>Enviado via Next.js App Router.</p>
      </div>
    `;

    const data = await resend.emails.send({
      from: "SubMind Teste <onboarding@resend.dev>",
      to: ["joaomateusmb@gmail.com"],
      subject: "Teste Definitivo - HTML Puro 📧",
      html: htmlContent, // Enviamos direto o HTML
    });

    console.log("Resposta da Resend:", data);

    if (data.error) {
      return NextResponse.json({ erro: data.error }, { status: 400 });
    }

    return NextResponse.json({ sucesso: true, id: data.data?.id });
  } catch (error) {
    console.error("Erro no teste:", error);
    return NextResponse.json({ erro: "Falha interna" }, { status: 500 });
  }
}
