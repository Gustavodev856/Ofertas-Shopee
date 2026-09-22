const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

type SendPhotoParams = {
  chatId: string;
  photo: string;
  caption: string;
};

export async function sendTelegramPhoto({
  chatId,
  photo,
  caption,
}: SendPhotoParams) {
  const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo,
      caption,
      parse_mode: "HTML",
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result.description || "Erro ao enviar mensagem para o Telegram"
    );
  }

  return result;
}