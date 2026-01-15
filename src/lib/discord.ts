const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1461368457265152098/lnpj5aBB5fpz8XhHEOvr6-B9w7G8C4wdDZTNMj2bpa7HnnAejkKfDYfaI8cYDcA1UI-K";

export async function sendReviewToDiscord(
  userName: string,
  productName: string,
  rating: number,
  comment: string,
) {
  if (!DISCORD_WEBHOOK_URL) return;

  // Cria uma string visual de estrelas (Ex: ⭐⭐⭐⭐⭐)
  const stars = "⭐".repeat(rating);

  // Formata a mensagem bonita (Embed)
  const embed = {
    title: "Avaliação de Compra Recebida! 💬",
    description: `**Obrigado pelo seu feedback, ${userName}! 💖**`,
    color: 13631488,
    fields: [
      {
        name: "Produto",
        value: productName,
        inline: true,
      },
      {
        name: "Nota",
        value: `${rating}/5  ${stars}`,
        inline: true,
      },
      {
        name: "Usuário",
        value: userName,
        inline: false,
      },
      {
        name: "Feedback",
        value: comment || `(comentário vazio)`,
        inline: false,
      },
    ],
    footer: {
      text: "SubMind • Sistema de Avaliação",
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [embed], // Envia como um card bonito
      }),
    });
  } catch (error) {
    console.error("Erro ao enviar webhook para o Discord:", error);
  }
}
