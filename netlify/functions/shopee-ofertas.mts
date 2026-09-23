import { getStore } from "@netlify/blobs";

import { getShopeeOffers } from "../../src/app/lib/shopee";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

type PublishedProduct = {
  itemId: number;
  name: string;
  offerLink: string;
  publishedAt: string;
};

type TelegramResponse = {
  ok: boolean;
  description?: string;
};

function formatPrice(price: string) {
  return Number(price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

async function sendTelegramPhoto(
  chatId: string,
  photo: string,
  caption: string
) {
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

  const result = (await response.json()) as TelegramResponse;

  if (!response.ok || !result.ok) {
    throw new Error(
      result.description || "Erro ao enviar imagem para o Telegram"
    );
  }

  return result;
}

async function sendTelegramMessage(
  chatId: string,
  text: string
) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });

  const result = (await response.json()) as TelegramResponse;

  if (!response.ok || !result.ok) {
    throw new Error(
      result.description || "Erro ao enviar mensagem para o Telegram"
    );
  }

  return result;
}

function createTextFallback(product: any) {
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

function productAlreadyPublished(
  product: any,
  history: PublishedProduct[]
) {
  const itemId = Number(product.itemId);

  const normalizedName = normalizeText(
    String(product.productName || "")
  );

  const offerLink = String(
    product.offerLink || ""
  ).trim();

  return history.some((item) => {
    const sameItemId =
      Number(item.itemId) === itemId;

    const sameLink =
      Boolean(offerLink) &&
      item.offerLink === offerLink;

    const sameName =
      Boolean(normalizedName) &&
      normalizeText(item.name) === normalizedName;

    return sameItemId || sameLink || sameName;
  });
}

export default async function handler() {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!chatId) {
      throw new Error(
        "TELEGRAM_CHAT_ID não configurado."
      );
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error(
        "TELEGRAM_BOT_TOKEN não configurado."
      );
    }

    console.log(
      "🔎 Buscando ofertas na Shopee..."
    );

    const offers = await getShopeeOffers();

    if (!offers?.nodes?.length) {
      throw new Error(
        "Nenhuma oferta encontrada na Shopee."
      );
    }

    console.log(
      `📦 Ofertas encontradas na Shopee: ${offers.nodes.length}`
    );

    const store = getStore("shopee-ofertas");

    const savedHistory =
      await store.get("produtos-publicados", {
        type: "json",
      });

    let history: PublishedProduct[] = [];

    /*
     * Compatibilidade com histórico antigo.
     *
     * Antes salvávamos apenas:
     * [123, 456, 789]
     *
     * Agora salvamos objetos completos.
     */

    if (Array.isArray(savedHistory)) {
      history = savedHistory
        .map((item: any) => {
          if (
            typeof item === "number" ||
            typeof item === "string"
          ) {
            return {
              itemId: Number(item),
              name: "",
              offerLink: "",
              publishedAt: "",
            };
          }

          return {
            itemId: Number(
              item?.itemId || 0
            ),
            name: String(
              item?.name || ""
            ),
            offerLink: String(
              item?.offerLink || ""
            ),
            publishedAt: String(
              item?.publishedAt || ""
            ),
          };
        })
        .filter(
          (item) => item.itemId > 0
        );
    }

    console.log(
      `📦 Produtos já publicados: ${history.length}`
    );

    /*
     * NÃO existem mais filtros de:
     *
     * ⭐ avaliação mínima
     * 🛒 vendas mínimas
     * 🏷️ desconto mínimo
     *
     * Agora o bot aceita qualquer produto retornado
     * pela Shopee, desde que ainda não tenha sido publicado.
     */

    const filtered = offers.nodes.filter(
      (product: any) => {
        const alreadyPublished =
          productAlreadyPublished(
            product,
            history
          );

        return !alreadyPublished;
      }
    );

    console.log(
      `🆕 Produtos novos disponíveis: ${filtered.length}`
    );

    if (!filtered.length) {
      console.log(
        "⚠️ Nenhuma oferta nova disponível."
      );

      return new Response(
        JSON.stringify({
          success: true,
          message:
            "Nenhuma oferta nova disponível.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    /*
     * Pega apenas UMA oferta nova por execução.
     *
     * Como o cron roda a cada 10 minutos,
     * a ideia é publicar aproximadamente
     * uma oferta a cada 10 minutos.
     */

    const product = filtered[0];

    console.log(
      `🚀 Publicando: ${product.productName}`
    );

    console.log(
      `⭐ Avaliação: ${product.ratingStar}`
    );

    console.log(
      `🛒 Vendas: ${product.sales}`
    );

    console.log(
      `🏷️ Desconto: ${product.priceDiscountRate}%`
    );

    const caption =
      createCaption(product);

    let publishedSuccessfully = false;
    let usedImage = false;

    /*
     * Primeiro tenta publicar com imagem.
     */

    try {
      await sendTelegramPhoto(
        chatId,
        product.imageUrl,
        caption
      );

      publishedSuccessfully = true;
      usedImage = true;

      console.log(
        "🖼️ Oferta publicada com imagem!"
      );
    } catch (imageError) {
      console.error(
        "⚠️ Não foi possível enviar a imagem:",
        imageError
      );

      /*
       * Se a imagem da Shopee não funcionar,
       * envia a mesma oferta como texto.
       */

      console.log(
        "🔄 Tentando publicar a oferta como texto..."
      );

      try {
        const fallback =
          createTextFallback(product);

        await sendTelegramMessage(
          chatId,
          fallback
        );

        publishedSuccessfully = true;

        console.log(
          "📝 Oferta publicada como texto!"
        );
      } catch (textError) {
        console.error(
          "❌ Falha também no envio como texto:",
          textError
        );

        throw textError;
      }
    }

    /*
     * Só registra no histórico se o Telegram
     * confirmou a publicação.
     */

    if (publishedSuccessfully) {
      const newHistoryItem: PublishedProduct = {
        itemId: Number(
          product.itemId
        ),
        name: String(
          product.productName
        ),
        offerLink: String(
          product.offerLink || ""
        ),
        publishedAt:
          new Date().toISOString(),
      };

      const updatedHistory = [
        ...history,
        newHistoryItem,
      ];

      /*
       * Mantém somente os últimos 100 produtos.
       */

      const limitedHistory =
        updatedHistory.slice(-100);

      await store.setJSON(
        "produtos-publicados",
        limitedHistory
      );

      console.log(
        `💾 Histórico atualizado: ${limitedHistory.length} produtos`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Oferta publicada no Telegram!",
        usedImage,
        product: {
          name: product.productName,
          price: product.price,
          discount:
            product.priceDiscountRate,
          sales: product.sales,
          rating: product.ratingStar,
          link: product.offerLink,
          itemId: product.itemId,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "❌ Erro na publicação:",
      error
    );

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
          "Content-Type":
            "application/json",
        },
      }
    );
  }
}

/*
 * Executa a função a cada 10 minutos.
 */

export const config = {
  schedule: "*/10 * * * *",
};

