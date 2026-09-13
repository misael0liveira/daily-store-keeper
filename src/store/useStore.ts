import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Product = {
  barcode: string;
  name: string;
  price: number;
  stock: number;
};

export type CartItem = {
  barcode: string;
  qty: number;
};

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
};

/**
 * "pending" = saved on this device only (there is no server yet).
 * "synced" = already confirmed by a server, once one exists.
 */
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
  /** Device that registered the sale — helps future multi-device sync. */
  deviceId?: string;
  /** Whether the sale was completed with no internet connection. */
  offline?: boolean;
};

export type Settings = {
  storeName: string;
  pixKey: string;
  merchantName: string;
  city: string;
};

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
  storeName: "Mini Mercado",
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
        set((s) => ({
          products: { ...s.products, [product.barcode]: product },
        })),

      deleteProduct: (barcode) =>
        set((s) => {
          const products = { ...s.products };
          delete products[barcode];
          return {
            products,
            cart: s.cart.filter((item) => item.barcode !== barcode),
          };
        }),

      addToCart: (barcode) =>
        set((s) => {
          const existing = s.cart.find((i) => i.barcode === barcode);
          if (existing) {
            return {
              cart: s.cart.map((i) =>
                i.barcode === barcode ? { ...i, qty: i.qty + 1 } : i
              ),
            };
          }
          return { cart: [...s.cart, { barcode, qty: 1 }] };
        }),

      changeQty: (barcode, delta) =>
        set((s) => ({
          cart: s.cart
            .map((i) =>
              i.barcode === barcode ? { ...i, qty: i.qty + delta } : i
            )
            .filter((i) => i.qty > 0),
        })),

      removeFromCart: (barcode) =>
        set((s) => ({ cart: s.cart.filter((i) => i.barcode !== barcode) })),

      checkout: ({ method, paidAmount, change }) => {
        const state = get();
        if (state.cart.length === 0) return null;

        const items: SaleItem[] = state.cart.flatMap((item) => {
          const p = state.products[item.barcode];
          if (!p) return [];
          return [
            {
              barcode: p.barcode,
              name: p.name,
              price: p.price,
              qty: item.qty,
            },
          ];
        });
        const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

        // Guard against double registration (double tap, retry, reconnect):
        // an identical sale registered seconds ago is treated as the same one.
        const fingerprint = `${method}|${total}|${items
          .map((i) => `${i.barcode}x${i.qty}`)
          .join(",")}`;
        const last = state.sales.at(0);
        if (
          last &&
          Date.now() - last.timestamp < 5000 &&
          `${last.method}|${last.total}|${last.items
            .map((i) => `${i.barcode}x${i.qty}`)
            .join(",")}` === fingerprint
        ) {
          set({ cart: [] });
          return last;
        }

        const sale: Sale = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          timestamp: Date.now(),
          items,
          total,
          method,
          syncState: "pending",
          deviceId: getDeviceId(),
          offline:
            typeof navigator !== "undefined" && navigator.onLine === false,
          ...(method === "dinheiro" && paidAmount != null
            ? { paidAmount, change: change ?? 0 }
            : {}),
        };

        const products = { ...state.products };
        for (const item of state.cart) {
          const p = products[item.barcode];
          if (p) {
            products[item.barcode] = {
              ...p,
              stock: Math.max(0, p.stock - item.qty),
            };
          }
        }

        set({ products, cart: [], sales: [sale, ...state.sales] });
        return sale;
      },

      deleteSale: (id) =>
        set((s) => ({ sales: s.sales.filter((sale) => sale.id !== id) })),

      setSettings: (settings) =>
        set((s) => ({ settings: { ...s.settings, ...settings } })),

      setTheme: (theme) => set({ theme }),
      toggleCash: () => set((s) => ({ cashOpen: !s.cashOpen })),
    }),
    {
      name: "pdv-mercado",
      version: 3,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<StoreState>;
        return {
          ...state,
          sales: state.sales ?? [],
          settings: { ...defaultSettings, ...(state.settings ?? {}) },
          cashOpen: state.cashOpen ?? true,
        } as StoreState;
      },
    }
  )
);

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
