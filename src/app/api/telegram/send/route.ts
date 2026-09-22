import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Token do Telegram não configurado" },
      { status: 500 }
    );
  }

  const ofertasResponse = await fetch(
    "http://localhost:3000/api/ofertas",
    {
      cache: "no-store",
    }
  );

  const ofertas = await ofertasResponse.json();

  if (!ofertas.length) {
    return NextResponse.json(
      { error: "Nenhuma oferta encontrada" },
      { status: 404 }
    );
  }

  const resultados = [];

  for (const oferta of ofertas) {
    const mensagem = `
🔥 OFERTA DO DIA 🔥

🛒 ${oferta.nome}

💰 De: R$ ${oferta.precoAntigo.toFixed(2)}
🔥 Por: R$ ${oferta.precoAtual.toFixed(2)}

📉 ${oferta.desconto}% OFF

👇 COMPRE AGORA:
${oferta.link}

⚠️ Preço sujeito a alteração.
`;

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: "-1004301137698",
          text: mensagem,
        }),
      }
    );

    const data = await response.json();

    resultados.push({
      oferta: oferta.nome,
      telegram: data.ok,
    });
  }

  return NextResponse.json({
    sucesso: true,
    ofertasEnviadas: resultados,
  });
}



// import { NextResponse } from "next/server";

// export async function GET() {
//   const token = process.env.TELEGRAM_BOT_TOKEN;

//   if (!token) {
//     return NextResponse.json(
//       { error: "Token do Telegram não configurado" },
//       { status: 500 }
//     );
//   }

//   const oferta = {
//     nome: "Fone Bluetooth",
//     precoAntigo: 199.9,
//     precoAtual: 79.9,
//     desconto: 60,
//     link: "https://exemplo.com/produto",
//   };

//   const mensagem = `
// 🔥 OFERTA ENCONTRADA!

// 🛒 ${oferta.nome}

// 💰 De: R$ ${oferta.precoAntigo.toFixed(2)}
// 🔥 Por: R$ ${oferta.precoAtual.toFixed(2)}

// 📉 ${oferta.desconto}% OFF

// 👇 COMPRE AGORA:
// ${oferta.link}

// ⚠️ Preço sujeito a alteração.
// `;

//   const response = await fetch(
//     `https://api.telegram.org/bot${token}/sendMessage`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         chat_id: "-1004301137698",
//         text: mensagem,
//       }),
//     }
//   );

//   const data = await response.json();

//   return NextResponse.json(data);
// }

// import { NextResponse } from "next/server";

// export async function GET() {
//   const token = process.env.TELEGRAM_BOT_TOKEN;

//   if (!token) {
//     return NextResponse.json(
//       { error: "Token do Telegram não configurado" },
//       { status: 500 }
//     );
//   }

//   const chatId = "-1004301137698";

//   const mensagem = `
// 🔥 OFERTA DO DIA 🔥

// 🎧 Fone Bluetooth

// 💰 De R$ 199,90
// 🔥 Por apenas R$ 99,90

// 🛒 COMPRE AGORA:
// https://exemplo.com

// ⚡ Aproveite enquanto durar o estoque!
//   `;

//   const response = await fetch(
//     `https://api.telegram.org/bot${token}/sendMessage`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         chat_id: chatId,
//         text: mensagem,
//       }),
//     }
//   );

//   const data = await response.json();

//   return NextResponse.json(data);
// }