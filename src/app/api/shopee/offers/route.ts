import { NextResponse } from "next/server";
import { getShopeeOffers } from "@/app/lib/shopee";

export async function GET() {
  try {
    const offers = await getShopeeOffers();

    return NextResponse.json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error("Erro Shopee:", error);

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