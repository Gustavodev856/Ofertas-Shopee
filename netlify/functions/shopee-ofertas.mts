
import type { Config } from "@netlify/functions";

import { getStore } from "@netlify/blobs";

import { getShopeeOffers } from "../../src/app/lib/shopee";

import { sendTelegramPhoto } from "../../src/app/lib/telegram";

function formatPrice(price: string) {
  return Number(price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function createCaption(product: any) {
  const discount =
    Number(product.priceDiscountRate) > 0
      ? `🏷️ <b>${product.priceDiscountRate}% OFF</b>\n`
      : "";

  return `
🔥 <b>OFERTA DO DIA!</b>

🛍️ <b>${product.productName}</b>

💰 <b>${formatPrice(product.price)}</b>

${discount}⭐ ${product.ratingStar}/5
🛒 ${product.sales} vendas

🏪 ${product.shopName}

👉 <a href="${product.offerLink}">COMPRAR AGORA</a>

⚡ Aproveite enquanto estiver disponível!
`.trim();
}

export default async () => {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!chatId) {
      throw new Error("TELEGRAM_CHAT_ID não configurado.");
    }

    console.log("🔎 Buscando ofertas na Shopee...");

    const offers = await getShopeeOffers();

    if (!offers?.nodes?.length) {
      throw new Error("Nenhuma oferta encontrada.");
    }

    const store = getStore("shopee-ofertas");

    const publicados = (await store.get("produtos-publicados", {
      type: "json",
    })) as number[] | null;

    const idsPublicados = publicados ?? [];

    console.log(
      `📦 Produtos já publicados: ${idsPublicados.length}`
    );

    const filtered = offers.nodes.filter((product: any) => {
      const itemId = Number(product.itemId);

      return (
        Number(product.ratingStar) >= 4.5 &&
        Number(product.sales) >= 10 &&
        Number(product.priceDiscountRate) >= 30 &&
        !idsPublicados.includes(itemId)
      );
    });

    if (!filtered.length) {
      console.log("⚠️ Nenhuma oferta nova passou pelos filtros.");

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Nenhuma oferta nova disponível.",
        }),
      };
    }

    // Ordena pelas maiores vendas
    filtered.sort(
      (a: any, b: any) =>
        Number(b.sales) - Number(a.sales)
    );

    // Seleciona a melhor oferta disponível
    const product = filtered[0];

    console.log(
      `🚀 Publicando: ${product.productName}`
    );

    const caption = createCaption(product);

    await sendTelegramPhoto({
      chatId,
      photo: product.imageUrl,
      caption,
    });

    // Salva o produto como publicado
    idsPublicados.push(Number(product.itemId));

    // Mantém somente os últimos 100 produtos
    const historico = idsPublicados.slice(-100);

    await store.setJSON(
      "produtos-publicados",
      historico
    );

    console.log("✅ Oferta publicada com sucesso!");

   return new Response(
  JSON.stringify({
    success: true,
    message: "Oferta publicada no Telegram!",
    product: {
      name: product.productName,
      price: product.price,
      discount: product.priceDiscountRate,
      sales: product.sales,
      rating: product.ratingStar,
      link: product.offerLink,
      itemId: product.itemId,
    },
  }),
  {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  }
);
  } catch (error) {
    console.error("❌ Erro na publicação:", error);

   return new Response(
  JSON.stringify({
    success: false,
    error:
      error instanceof Error
        ? error.message
        : "Erro desconhecido",
  }),
  {
    status: 500,
    headers: {
      "Content-Type": "application/json",
    },
  }
);
  }
};

export const config: Config = {
  schedule: "0 * * * *",
};

