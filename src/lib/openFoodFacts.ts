import { Capacitor, CapacitorHttp } from "@capacitor/core";

export type FoodProductLookup = {
  name: string;
  brand?: string;
  packageSize?: string;
};

type OpenFoodFactsProduct = {
  product_name?: unknown;
  product_name_pt?: unknown;
  product_name_en?: unknown;
  brands?: unknown;
  quantity?: unknown;
};

type OpenFoodFactsResponse = {
  status?: unknown;
  product?: OpenFoodFactsProduct;
};

const APP_USER_AGENT = "MercadinhoUniao/1.0 (https://github.com/misael0liveira/daily-store-keeper)";

function cleanField(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function parseProduct(data: unknown): FoodProductLookup | null {
  let payload = data;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload) as unknown;
    } catch {
      throw new Error("Resposta inválida da consulta de produtos.");
    }
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Resposta inválida da consulta de produtos.");
  }

  const response = payload as OpenFoodFactsResponse;
  if (response.status !== 1 || !response.product) return null;

  const name =
    cleanField(response.product.product_name_pt, 160) ??
    cleanField(response.product.product_name, 160) ??
    cleanField(response.product.product_name_en, 160);

  if (!name) return null;

  const brand = cleanField(response.product.brands, 120);
  const packageSize = cleanField(response.product.quantity, 80);

  return {
    name,
    ...(brand ? { brand } : {}),
    ...(packageSize ? { packageSize } : {}),
  };
}

/** Fetches public catalog fields for one barcode; local stock and sales are never sent. */
export async function lookupFoodProductByBarcode(
  barcode: string,
): Promise<FoodProductLookup | null> {
  const code = barcode.trim();
  if (!code) throw new Error("Informe ou escaneie um código de barras.");

  const url = new URL(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`,
  );
  url.searchParams.set("fields", "product_name,product_name_pt,product_name_en,brands,quantity");

  if (!Capacitor.isNativePlatform()) {
    throw new Error("A busca online por código está disponível no APK Android.");
  }

  const response = await CapacitorHttp.get({
    url: url.toString(),
    headers: {
      Accept: "application/json",
      "User-Agent": APP_USER_AGENT,
    },
    connectTimeout: 7000,
    readTimeout: 7000,
    responseType: "json",
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error("O serviço de consulta está indisponível.");
  }

  return parseProduct(response.data);
}
