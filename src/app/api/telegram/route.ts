import { NextResponse } from "next/server";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET() {
  try {
    if (!TOKEN) {
      return NextResponse.json(
        {
          ok: false,
          erro: "TELEGRAM_BOT_TOKEN não foi encontrado",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TOKEN}/getUpdates`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log(
      "UPDATES DO TELEGRAM:",
      JSON.stringify(data, null, 2)
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("ERRO TELEGRAM:", error);

    return NextResponse.json(
      {
        ok: false,
        erro: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!TOKEN) {
      return NextResponse.json(
        {
          erro: "TELEGRAM_BOT_TOKEN não foi encontrado",
        },
        { status: 500 }
      );
    }

    const update = await request.json();

    console.log(
      "UPDATE RECEBIDO:",
      JSON.stringify(update, null, 2)
    );

    const mensagem = update?.message?.text;
    const chatId = update?.message?.chat?.id;

    if (!mensagem || !chatId) {
      return NextResponse.json({
        ok: true,
        ignorado: true,
      });
    }

    const resposta = `
✅ LINK RECEBIDO!

🔗 ${mensagem}

⏳ Vou processar essa oferta...
    `.trim();

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: resposta,
        }),
      }
    );

    const data = await telegramResponse.json();

    console.log(
      "RESPOSTA DO TELEGRAM:",
      JSON.stringify(data, null, 2)
    );

    if (!data.ok) {
      return NextResponse.json(
        {
          erro: "Telegram recusou o envio",
          detalhes: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sucesso: true,
      mensagem: "Oferta recebida e resposta enviada!",
    });
  } catch (error) {
    console.error("ERRO:", error);

    return NextResponse.json(
      {
        ok: false,
        erro: String(error),
      },
      { status: 500 }
    );
  }
}