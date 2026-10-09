import type { Product, Sale, Settings } from "@/store/useStore";

export type Replenishment = {
  product: Product;
  sold30: number;
  dailyAverage: number;
  minimum: number;
  target: number;
  purchase: number;
  low: boolean;
};

export function calculateReplenishment(
  products: Record<string, Product>,
  sales: Sale[],
  settings: Pick<Settings, "wholesaleCycleDays" | "stockSafetyDays">,
  now = Date.now(),
) {
  const byId = new Map(Object.values(products).map((p) => [p.id ?? `product-${p.barcode}`, p]));
  const sold = new Map<Product, number>();
  const add = (p: Product | undefined, qty: number) => {
    if (p && Number.isFinite(qty) && qty > 0) sold.set(p, (sold.get(p) ?? 0) + qty);
  };
  const start = now - 30 * 86400000;
  for (const sale of sales) {
    if (
      !Number.isFinite(sale.timestamp) ||
      sale.timestamp < start ||
      sale.timestamp > now ||
      sale.status === "cancelled"
    )
      continue;
    for (const item of sale.items) {
      const qty = Math.max(0, item.qty - (item.returnedQty ?? 0));
      if (item.components?.length) {
        for (const component of item.components)
          add(byId.get(component.productId), qty * component.qty);
      } else {
        // Um código reaproveitado não herda vendas de outra identidade.
        add(item.productId ? byId.get(item.productId) : products[item.barcode], qty);
      }
    }
  }
  const cycle = settings.wholesaleCycleDays ?? 7;
  const safety = settings.stockSafetyDays ?? 2;
  const result = new Map<string, Replenishment>();
  for (const p of Object.values(products)) {
    if (p.active === false || p.stockControlled === false || p.components?.length) continue;
    const sold30 = sold.get(p) ?? 0;
    const dailyAverage = sold30 / 30;
    const minimum = dailyAverage * safety;
    const target = dailyAverage * (cycle + safety);
    const precision = !p.unit || p.unit === "un" ? 1 : 1000;
    const purchase = Math.max(0, Math.ceil((target - p.stock) * precision - 1e-9) / precision);
    result.set(p.barcode, {
      product: p,
      sold30,
      dailyAverage,
      minimum,
      target,
      purchase,
      low: p.stock <= minimum + 1e-9,
    });
  }
  return result;
}

export const formatStockQuantity = (qty: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(qty);
export const purchaseLabel = (r: Replenishment) =>
  `${formatStockQuantity(r.purchase)} ${!r.product.unit || r.product.unit === "un" ? (r.purchase === 1 ? "unidade" : "unidades") : r.product.unit}`;
