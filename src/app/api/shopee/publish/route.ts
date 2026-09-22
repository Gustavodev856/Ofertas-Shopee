import { NextResponse } from "next/server";
import { getShopeeOffers } from "@/app/lib/shopee";
import { sendTelegramPhoto } from "@/app/lib/telegram";

function formatPrice(price: string) {
  return Number(price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function createCaption(product: any) {
  const discount =
    product.priceDiscountRate > 0
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

export async function GET() {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!chatId) {
      throw new Error("TELEGRAM_CHAT_ID não configurado.");
    }

    const offers = await getShopeeOffers();

    if (!offers?.nodes?.length) {
      throw new Error("Nenhuma oferta encontrada.");
    }

    // Filtra ofertas mais interessantes
    const filtered = offers.nodes.filter((product: any) => {
      return (
        Number(product.ratingStar) >= 4.5 &&
        Number(product.sales) >= 10 &&
        Number(product.priceDiscountRate) >= 30
      );
    });

    if (!filtered.length) {
      throw new Error("Nenhuma oferta passou pelos filtros.");
    }

    // Ordena pelas maiores vendas
    filtered.sort(
      (a: any, b: any) => Number(b.sales) - Number(a.sales)
    );

    const product = filtered[0];

    const caption = createCaption(product);

    await sendTelegramPhoto({
      chatId,
      photo: product.imageUrl,
      caption,
    });

    return NextResponse.json({
      success: true,
      message: "Oferta publicada no Telegram!",
      product: {
        name: product.productName,
        price: product.price,
        discount: product.priceDiscountRate,
        sales: product.sales,
        rating: product.ratingStar,
        link: product.offerLink,
      },
    });
  } catch (error) {
    console.error("Erro ao publicar:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}