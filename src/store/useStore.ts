import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDeviceId } from "@/lib/sync";

export type Product = { barcode: string; name: string; price: number; stock: number };
export type CartItem = { barcode: string; qty: number };
export type PaymentMethod = "dinheiro" | "debito" | "credito" | "pix";
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
  pix: "Pix",
};
export type SaleItem = { barcode: string; name: string; price: number; qty: number };
export type SyncState = "pending" | "synced";
export type Sale = {
  id: string;
  timestamp: number;
  items: SaleItem[];
  total: number;
  method: PaymentMethod;
  paidAmount?: number;
  change?: number;
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
  deleteProduct: (barcode: string) => void;
  addToCart: (barcode: string) => void;
  changeQty: (barcode: string, delta: number) => void;
  removeFromCart: (barcode: string) => void;
  checkout: (payload: {
    method: PaymentMethod;
    paidAmount?: number;
    change?: number;
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
    (set, get) => ({
      products: {},
      cart: [],
      sales: [],
      settings: defaultSettings,
      theme: "light",
      cashOpen: true,
      upsertProduct: (product) =>
        set((s) => ({ products: { ...s.products, [product.barcode]: product } })),
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
      checkout: ({ method, paidAmount, change }) => {
        const state = get();
        if (state.cart.length === 0) return null;
        const items: SaleItem[] = state.cart.flatMap((item) => {
          const p = state.products[item.barcode];
          return p ? [{ barcode: p.barcode, name: p.name, price: p.price, qty: item.qty }] : [];
        });
        const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
        const fingerprint = `${method}|${total}|${items.map((i) => `${i.barcode}x${i.qty}`).join(",")}`;
        const last = state.sales.at(0);
        if (
          last &&
          Date.now() - last.timestamp < 5000 &&
          `${last.method}|${last.total}|${last.items.map((i) => `${i.barcode}x${i.qty}`).join(",")}` ===
            fingerprint
        ) {
          set({ cart: [] });
          return last;
        }
        const sale: Sale = {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          timestamp: Date.now(),
          items,
          total,
          method,
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
          if (p) products[item.barcode] = { ...p, stock: Math.max(0, p.stock - item.qty) };
        }
        set({ products, cart: [], sales: [sale, ...state.sales] });
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
    }),
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
