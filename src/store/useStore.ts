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

type Theme = "light" | "dark";

type StoreState = {
  products: Record<string, Product>;
  cart: CartItem[];
  theme: Theme;
  upsertProduct: (product: Product) => void;
  deleteProduct: (barcode: string) => void;
  addToCart: (barcode: string) => void;
  changeQty: (barcode: string, delta: number) => void;
  removeFromCart: (barcode: string) => void;
  checkout: () => void;
  setTheme: (theme: Theme) => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      products: {},
      cart: [],
      theme: "light",

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

      checkout: () =>
        set((s) => {
          const products = { ...s.products };
          for (const item of s.cart) {
            const p = products[item.barcode];
            if (p) {
              products[item.barcode] = {
                ...p,
                stock: Math.max(0, p.stock - item.qty),
              };
            }
          }
          return { products, cart: [] };
        }),

      setTheme: (theme) => set({ theme }),
    }),
    { name: "pdv-mercado" }
  )
);

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
