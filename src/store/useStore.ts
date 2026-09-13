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

export type Sale = {
  id: string;
  timestamp: number;
  items: SaleItem[];
  total: number;
  method: PaymentMethod;
  paidAmount?: number;
  change?: number;
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

        const sale: Sale = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
          items,
          total,
          method,
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
