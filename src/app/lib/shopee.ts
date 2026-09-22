import crypto from "crypto";

const SHOPEE_API_URL =
  "https://open-api.affiliate.shopee.com.br/graphql";

type ShopeeProduct = {
  productName: string;
  itemId: number;
  commissionRate: string;
  commission: string;
  price: string;
  sales: number;
  imageUrl: string;
  shopName: string;
  productLink: string;
  offerLink: string;
  periodStartTime: number;
  periodEndTime: number;
  priceMin: string;
  priceMax: string;
  productCatIds: number[];
  ratingStar: string;
  priceDiscountRate: number;
  shopId: number;
  shopType: number[];
  sellerCommissionRate: string;
  shopeeCommissionRate: string;
};

type ShopeeResponse = {
  data?: {
    productOfferV2?: {
      nodes: ShopeeProduct[];
      pageInfo: {
        page: number;
        limit: number;
        hasNextPage: boolean;
        scrollId: string | null;
      };
    };
  };
  errors?: Array<{
    message: string;
  }>;
};

const query = `
query {
  productOfferV2 {
    nodes {
      productName
      itemId
      commissionRate
      commission
      price
      sales
      imageUrl
      shopName
      productLink
      offerLink
      periodStartTime
      periodEndTime
      priceMin
      priceMax
      productCatIds
      ratingStar
      priceDiscountRate
      shopId
      shopType
      sellerCommissionRate
      shopeeCommissionRate
    }
    pageInfo {
      page
      limit
      hasNextPage
      scrollId
    }
  }
}
`;

export async function getShopeeOffers() {
  const appId = process.env.SHOPEE_APP_ID;
  const secret = process.env.SHOPEE_APP_SECRET;

  if (!appId || !secret) {
    throw new Error(
      "SHOPEE_APP_ID ou SHOPEE_APP_SECRET não configurado."
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);

  const body = JSON.stringify({
    query,
  });

  const signature = crypto
    .createHash("sha256")
    .update(`${appId}${timestamp}${body}${secret}`)
    .digest("hex");

  const response = await fetch(SHOPEE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `SHA256 Credential=${appId},Timestamp=${timestamp},Signature=${signature}`,
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Shopee API retornou ${response.status}: ${errorText}`
    );
  }

  const result: ShopeeResponse = await response.json();

  if (result.errors?.length) {
    throw new Error(
      result.errors.map((error) => error.message).join(", ")
    );
  }

  return result.data?.productOfferV2;
}