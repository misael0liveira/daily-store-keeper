import { create } from "zustand";
import { persist } from "zustand/middleware";

function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  const key = "pdv-device-id";
  const id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored) return stored;
    window.localStorage.setItem(key, id);
  } catch {
    // Storage can be unavailable in hardened browser modes; sales still remain usable in memory.
  }
  return id;
}

export type Promotion = {
  discountPercent: number;
  mode: "period" | "stock";
  startsAt?: number;
  endsAt?: number;
};
export type Product = {
  barcode: string;
  name: string;
  price: number;
  stock: number;
  brand?: string | undefined;
  packageSize?: string | undefined;
  photoId?: string | undefined;
  promotion?: Promotion | undefined;
};
export function getProductPricing(product: Product, now = Date.now()) {
  const promotion = product.promotion;
  const active = Boolean(
    promotion &&
    Number.isFinite(promotion.discountPercent) &&
    promotion.discountPercent > 0 &&
    promotion.discountPercent <= 100 &&
    (promotion.mode === "stock"
      ? product.stock > 0
      : promotion.mode === "period" &&
        Number.isFinite(promotion.startsAt) &&
        Number.isFinite(promotion.endsAt) &&
        now >= promotion.startsAt! &&
        now < promotion.endsAt!),
  );
  const discountPercent = active ? promotion!.discountPercent : 0;
  const originalPrice = Math.round((product.price + Number.EPSILON) * 100) / 100;
  const price =
    Math.round((originalPrice * (1 - discountPercent / 100) + Number.EPSILON) * 100) / 100;
  return { originalPrice, price, discountPercent, active };
}
export type CartItem = { barcode: string; qty: number };
export type PaymentMethod = "dinheiro" | "debito" | "credito" | "pix";
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
  pix: "Pix",
};
export type SaleItem = {
  barcode: string;
  name: string;
  price: number;
  qty: number;
  originalPrice?: number;
  discountPercent?: number;
};
export function quoteCart(
  products: Record<string, Product>,
  cart: CartItem[],
  now = Date.now(),
): SaleItem[] {
  return cart.flatMap((item) => {
    const product = products[item.barcode];
    if (!product) return [];
    const pricing = getProductPricing(product, now);
    return [
      {
        barcode: product.barcode,
        name: product.name,
        qty: item.qty,
        price: pricing.price,
        ...(pricing.active
          ? { originalPrice: pricing.originalPrice, discountPercent: pricing.discountPercent }
          : {}),
      },
    ];
  });
}
export const saleItemsTotal = (items: SaleItem[]) =>
  Math.round(items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.qty, 0)) / 100;
export type SyncState = "pending" | "synced";
export type Sale = {
  id: string;
  timestamp: number;
  items: SaleItem[];
  total: number;
  method: PaymentMethod;
  paidAmount?: number;
  change?: number;
  pixTxid?: string;
  syncState?: SyncState;
  deviceId?: string;
  offline?: boolean;
};
export type Settings = { storeName: string; pixKey: string; merchantName: string; city: string };
type Theme = "light" | "dark";
type StoreState = {
  products: Record<string, Product>;
  cart: CartItem[];
  sales: Sale[];
  settings: Settings;
  theme: Theme;
  cashOpen: boolean;
  upsertProduct: (product: Product) => void;
  applyPromotions: (updates: { barcode: string; price: number; promotion: Promotion }[]) => void;
  removePromotion: (barcode: string) => void;
  deleteProduct: (barcode: string) => void;
  addToCart: (barcode: string) => void;
  changeQty: (barcode: string, delta: number) => void;
  removeFromCart: (barcode: string) => void;
  checkout: (payload: {
    method: PaymentMethod;
    paidAmount?: number;
    change?: number;
    pixTxid?: string;
    quote?: SaleItem[];
  }) => Sale | null;
  deleteSale: (id: string) => void;
  markSalesSynced: (ids: string[]) => void;
  setSettings: (settings: Partial<Settings>) => void;
  setTheme: (theme: Theme) => void;
  toggleCash: () => void;
};
const defaultSettings: Settings = {
  storeName: "Mercadinho União",
  pixKey: "",
  merchantName: "",
  city: "",
};
export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const commit = (changes: Partial<StoreState>) => {
        const previous = get();
        try {
          set(changes);
        } catch (error) {
          // Persist middleware updates memory first. Restore it too if durable storage failed.
          try {
            set(previous);
          } catch {
            /* The prior durable state remains unchanged. */
          }
          throw error;
        }
      };
      return {
        products: {},
        cart: [],
        sales: [],
        settings: defaultSettings,
        theme: "light",
        cashOpen: true,
        upsertProduct: (product) =>
          commit({
            products: {
              ...get().products,
              [product.barcode]: {
                ...product,
                ...(product.promotion?.mode === "stock" && product.stock <= 0
                  ? { promotion: undefined }
                  : {}),
              },
            },
          }),
        applyPromotions: (updates) => {
          const state = get();
          const products = { ...state.products };
          if (!updates.length) throw new Error("Selecione um produto.");
          for (const { barcode, price, promotion } of updates) {
            const product = products[barcode];
            if (!product)
              throw new Error("Um dos produtos foi removido. Faça a seleção novamente.");
            if (!Number.isFinite(price) || price <= 0)
              throw new Error(`Confira o preço de ${product.name}.`);
            if (
              !Number.isFinite(promotion.discountPercent) ||
              promotion.discountPercent <= 0 ||
              promotion.discountPercent > 100
            )
              throw new Error(
                `O desconto de ${product.name} deve ser maior que 0% e no máximo 100%.`,
              );
            if (
              promotion.mode === "stock"
                ? product.stock <= 0
                : promotion.mode !== "period" ||
                  !Number.isFinite(promotion.startsAt) ||
                  !Number.isFinite(promotion.endsAt) ||
                  promotion.startsAt! >= promotion.endsAt! ||
                  promotion.endsAt! <= Date.now()
            )
              throw new Error(`Confira a duração da promoção de ${product.name}.`);
            products[barcode] = { ...product, price: Math.round(price * 100) / 100, promotion };
          }
          commit({ products });
        },
        removePromotion: (barcode) => {
          const product = get().products[barcode];
          if (!product) return;
          commit({
            products: { ...get().products, [barcode]: { ...product, promotion: undefined } },
          });
        },
        deleteProduct: (barcode) =>
          set((s) => {
            const products = { ...s.products };
            delete products[barcode];
            return { products, cart: s.cart.filter((item) => item.barcode !== barcode) };
          }),
        addToCart: (barcode) =>
          set((s) => {
            const existing = s.cart.find((i) => i.barcode === barcode);
            return existing
              ? { cart: s.cart.map((i) => (i.barcode === barcode ? { ...i, qty: i.qty + 1 } : i)) }
              : { cart: [...s.cart, { barcode, qty: 1 }] };
          }),
        changeQty: (barcode, delta) =>
          set((s) => ({
            cart: s.cart
              .map((i) => (i.barcode === barcode ? { ...i, qty: i.qty + delta } : i))
              .filter((i) => i.qty > 0),
          })),
        removeFromCart: (barcode) =>
          set((s) => ({ cart: s.cart.filter((i) => i.barcode !== barcode) })),
        checkout: ({ method, paidAmount, change, pixTxid, quote }) => {
          const state = get();
          if (state.cart.length === 0) return null;
          const items: SaleItem[] = quote ?? quoteCart(state.products, state.cart);
          // A payment keeps its quoted prices if the promotion ends while the customer pays.
          if (
            items.length !== state.cart.length ||
            items.some(
              (item, index) =>
                item.barcode !== state.cart[index]?.barcode ||
                item.qty !== state.cart[index]?.qty ||
                !state.products[item.barcode] ||
                !Number.isFinite(item.price) ||
                item.price < 0,
            )
          )
            return null;
          const total = saleItemsTotal(items);
          const sale: Sale = {
            id:
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            timestamp: Date.now(),
            items,
            total,
            method,
            ...(method === "pix" && pixTxid ? { pixTxid } : {}),
            syncState: "pending",
            deviceId: getDeviceId(),
            offline: typeof navigator !== "undefined" && navigator.onLine === false,
            ...(method === "dinheiro" && paidAmount != null
              ? { paidAmount, change: change ?? 0 }
              : {}),
          };
          const products = { ...state.products };
          for (const item of state.cart) {
            const p = products[item.barcode];
            if (p) {
              const stock = Math.max(0, p.stock - item.qty);
              products[item.barcode] = {
                ...p,
                stock,
                ...(p.promotion?.mode === "stock" && stock === 0 ? { promotion: undefined } : {}),
              };
            }
          }
          commit({ products, cart: [], sales: [sale, ...state.sales] });
          return sale;
        },
        deleteSale: (id) => set((s) => ({ sales: s.sales.filter((sale) => sale.id !== id) })),
        markSalesSynced: (ids) =>
          set((s) => ({
            sales: s.sales.map((sale) =>
              ids.includes(sale.id) ? { ...sale, syncState: "synced" } : sale,
            ),
          })),
        setSettings: (settings) => set((s) => ({ settings: { ...s.settings, ...settings } })),
        setTheme: (theme) => set({ theme }),
        toggleCash: () => set((s) => ({ cashOpen: !s.cashOpen })),
      };
    },
    {
      name: "pdv-mercado",
      version: 6,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<StoreState>;
        const previousSettings = state.settings ?? defaultSettings;
        return {
          ...state,
          products: state.products ?? {},
          cart: state.cart ?? [],
          sales: (state.sales ?? []).map((sale) => ({
            ...sale,
            syncState: sale.syncState ?? "pending",
          })),
          settings: {
            ...defaultSettings,
            ...previousSettings,
            storeName:
              !previousSettings.storeName || previousSettings.storeName === "Mini Mercado"
                ? defaultSettings.storeName
                : previousSettings.storeName,
          },
          cashOpen: state.cashOpen ?? true,
        } as StoreState;
      },
    },
  ),
);
export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
