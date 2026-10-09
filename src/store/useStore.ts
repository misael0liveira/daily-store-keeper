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
  startsAt?: number | undefined;
  endsAt?: number | undefined;
};
export type Product = {
  id?: string | undefined;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  brand?: string | undefined;
  packageSize?: string | undefined;
  photoId?: string | undefined;
  promotion?: Promotion | undefined;
  category?: string | undefined;
  cost?: number | undefined;
  unit?: "un" | "kg" | "l" | undefined;
  minimumStock?: number | undefined;
  supplierId?: string | undefined;
  active?: boolean | undefined;
  stockControlled?: boolean | undefined;
  components?: { productId: string; qty: number }[] | undefined;
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
  productId?: string | undefined;
  barcode: string;
  name: string;
  price: number;
  qty: number;
  originalPrice?: number | undefined;
  discountPercent?: number | undefined;
  cost?: number | undefined;
  unit?: Product["unit"] | undefined;
  components?: { productId: string; qty: number; cost?: number | undefined }[] | undefined;
  returnedQty?: number | undefined;
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
        productId: product.id,
        cost: product.components?.length
          ? product.components.reduce<number | undefined>((sum, c) => {
              const child = Object.values(products).find((p) => p.id === c.productId);
              return sum === undefined || child?.cost === undefined
                ? undefined
                : sum + child.cost * c.qty;
            }, 0)
          : product.cost,
        unit: product.unit ?? "un",
        components: product.components?.map((c) => ({
          ...c,
          cost: Object.values(products).find((p) => p.id === c.productId)?.cost,
        })),
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
  paidAmount?: number | undefined;
  change?: number | undefined;
  pixTxid?: string | undefined;
  syncState?: SyncState | undefined;
  deviceId?: string | undefined;
  offline?: boolean | undefined;
  status?: "completed" | "cancelled" | undefined;
  payments?: Payment[] | undefined;
  refundedAmount?: number | undefined;
  sessionId?: string | undefined;
  operatorId?: string | undefined;
  customerId?: string | undefined;
  cancelReason?: string | undefined;
};
export type Payment = {
  id: string;
  method: PaymentMethod;
  amount: number;
  paidAmount?: number | undefined;
  change?: number | undefined;
  source: "manual" | "notification";
  reference?: string | undefined;
  bank?: string | undefined;
  confirmedAt: number;
};
export type StockMovement = {
  id: string;
  productId: string;
  barcode: string;
  name: string;
  type: "initial" | "adjustment" | "receiving" | "sale" | "return" | "loss";
  delta: number;
  before: number;
  after: number;
  timestamp: number;
  reason: string;
  documentId?: string | undefined;
  operatorId?: string | undefined;
};
export type Supplier = {
  id: string;
  name: string;
  contact?: string | undefined;
  active?: boolean | undefined;
};
export type Receiving = {
  id: string;
  timestamp: number;
  supplierId: string;
  reference: string;
  operatorId?: string | undefined;
  items: {
    productId: string;
    name: string;
    packs: number;
    unitsPerPack: number;
    qty: number;
    cost: number;
    total: number;
    lotId?: string | undefined;
  }[];
  total: number;
};
export type Lot = {
  id: string;
  productId: string;
  name: string;
  expiresAt?: string | undefined;
  receivedAt: number;
  available: number;
  supplierId?: string | undefined;
};
export type CashSession = {
  id: string;
  openedAt: number;
  closedAt?: number | undefined;
  opening: number;
  counted?: number | undefined;
  expected?: number | undefined;
  difference?: number | undefined;
  note?: string | undefined;
  operatorId?: string | undefined;
};
export type CashMovement = {
  id: string;
  sessionId: string;
  timestamp: number;
  type: "supply" | "withdrawal" | "expense" | "refund" | "debt";
  amount: number;
  method: PaymentMethod;
  reason: string;
  documentId?: string | undefined;
  operatorId?: string | undefined;
};
export type Expense = {
  id: string;
  timestamp: number;
  category: string;
  description: string;
  amount: number;
  method: PaymentMethod;
  supplierId?: string | undefined;
  operatorId?: string | undefined;
};
export type SaleReturn = {
  id: string;
  saleId: string;
  timestamp: number;
  reason: string;
  restock: boolean;
  amount: number;
  debtReduction: number;
  refundMethod: PaymentMethod;
  items: {
    productId?: string | undefined;
    barcode: string;
    name: string;
    qty: number;
    price: number;
    cost?: number | undefined;
  }[];
  operatorId?: string | undefined;
};
export type Draft = {
  id: string;
  name: string;
  timestamp: number;
  cart: CartItem[];
  customerId?: string | undefined;
};
export type Customer = {
  id: string;
  name: string;
  contact?: string | undefined;
  active?: boolean | undefined;
  code?: string | undefined;
  cpf?: string | undefined;
  creditEnabled?: boolean | undefined;
  creditLimit?: number | undefined;
  dueDay?: number | undefined;
};
export function validCpf(raw: string) {
  const cpf = raw.replace(/\D/g, "");
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
  for (let n = 9; n < 11; n++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(cpf[i]) * (n + 1 - i);
    const check = (sum * 10) % 11;
    if ((check === 10 ? 0 : check) !== Number(cpf[n])) return false;
  }
  return true;
}
export function normalizeCustomers(customers: Customer[]) {
  const used = new Set(customers.map((c) => c.code).filter(Boolean));
  let next = 1;
  return customers.map((c) => {
    while (used.has(`U-${String(next).padStart(4, "0")}`)) next++;
    const code = c.code || `U-${String(next++).padStart(4, "0")}`;
    used.add(code);
    return { ...c, code, creditEnabled: c.creditEnabled ?? true };
  });
}
export function customerMatches(c: Customer, query: string) {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const q = normalize(query.trim());
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return [c.name, c.code ?? "", c.contact ?? "", c.cpf ?? ""].some(
    (v) =>
      normalize(v).includes(q) ||
      (digits.length > 0 && !/[a-z]/i.test(q) && v.replace(/\D/g, "").includes(digits)),
  );
}
export function customerBalance(state: Pick<ManagementData, "receivables">, customerId: string) {
  return money(
    state.receivables.filter((d) => d.customerId === customerId).reduce((n, d) => n + d.balance, 0),
  );
}
export function validLocalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const d = new Date(year!, month! - 1, day!);
  return (
    year! >= 2000 && d.getFullYear() === year && d.getMonth() === month! - 1 && d.getDate() === day
  );
}
export function suggestedDueDate(day?: number) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
  if (day) {
    const targetMonth = now.getDate() < day ? now.getMonth() : now.getMonth() + 1;
    date.setTime(
      new Date(
        now.getFullYear(),
        targetMonth,
        Math.min(day, new Date(now.getFullYear(), targetMonth + 1, 0).getDate()),
      ).getTime(),
    );
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export type Receivable = {
  id: string;
  saleId: string;
  customerId: string;
  timestamp: number;
  dueAt: string;
  original: number;
  balance: number;
  receipts: {
    id: string;
    timestamp: number;
    amount: number;
    method: PaymentMethod;
    reference?: string | undefined;
    source?: "manual" | "notification" | undefined;
    bank?: string | undefined;
  }[];
};
export type Staff = {
  id: string;
  name: string;
  role: "owner" | "manager" | "cashier";
  verifier: string;
  salt: string;
  active: boolean;
};
export type Permission = "sell" | "inventory" | "returns" | "cash" | "manage" | "costs" | "backup";
export type ManagementData = {
  revision: number;
  movements: StockMovement[];
  suppliers: Supplier[];
  receivings: Receiving[];
  lots: Lot[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  expenses: Expense[];
  returns: SaleReturn[];
  drafts: Draft[];
  customers: Customer[];
  receivables: Receivable[];
  staff: Staff[];
  currentCustomerId?: string | undefined;
  pendingPayments: Payment[];
  pendingQuote?: SaleItem[] | undefined;
  pendingPixTxid?: string | undefined;
};
const id = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const quantity = (n: number) => Math.round(n * 1000) / 1000;
export const productId = (p: Product) => p.id ?? `product-${p.barcode}`;
export const saleNet = (s: Sale) =>
  s.status === "cancelled" ? 0 : money(s.total - (s.refundedAmount ?? 0));
export const salePayments = (s: Sale): Payment[] =>
  s.payments ?? [
    {
      id: s.id,
      method: s.method,
      amount: s.total,
      paidAmount: s.paidAmount,
      change: s.change,
      source: "manual",
      confirmedAt: s.timestamp,
    },
  ];
export const saleMethodLabel = (s: Sale) =>
  [...new Set(salePayments(s).map((p) => PAYMENT_LABELS[p.method]))].join(" + ") || "Fiado";
export const defaultManagement = (): ManagementData => ({
  revision: 0,
  movements: [],
  suppliers: [],
  receivings: [],
  lots: [],
  cashSessions: [],
  cashMovements: [],
  expenses: [],
  returns: [],
  drafts: [],
  customers: [],
  receivables: [],
  staff: [],
  pendingPayments: [],
});
let authenticatedOperator: string | undefined;
export function operator() {
  return authenticatedOperator;
}
export function canOperate(state: Pick<ManagementData, "staff">, permission: Permission) {
  const active = state.staff.filter((s) => s.active);
  if (!active.length) return true;
  const user = active.find((s) => s.id === authenticatedOperator);
  return Boolean(
    user &&
    (user.role === "owner" ||
      (user.role === "manager" && !["manage", "backup"].includes(permission)) ||
      (user.role === "cashier" && permission === "sell")),
  );
}
export function cashExpected(
  state: Pick<StoreState, "cashSessions" | "cashMovements" | "sales" | "pendingPayments">,
  session: CashSession,
) {
  return money(
    session.opening +
      (session.closedAt
        ? 0
        : state.pendingPayments
            .filter((p) => p.method === "dinheiro")
            .reduce((n, p) => n + p.amount, 0)) +
      state.sales
        .filter((s) => s.sessionId === session.id)
        .reduce(
          (sum, s) =>
            sum +
            salePayments(s)
              .filter((p) => p.method === "dinheiro")
              .reduce((n, p) => n + p.amount, 0),
          0,
        ) +
      state.cashMovements
        .filter((m) => m.sessionId === session.id && m.method === "dinheiro")
        .reduce((sum, m) => sum + (["supply", "debt"].includes(m.type) ? m.amount : -m.amount), 0),
  );
}
function retireLots(lots: Lot[], p: Product, delta: number) {
  const result = lots.map((l) => ({ ...l }));
  let remaining = Math.max(0, -delta);
  for (const lot of result
    .filter((l) => l.productId === productId(p) && l.available > 0)
    .sort((a, b) => (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999"))) {
    const used = Math.min(remaining, lot.available);
    lot.available = quantity(lot.available - used);
    remaining = quantity(remaining - used);
    if (!remaining) break;
  }
  return result;
}
function assertAmount(value: number, name = "Valor", zero = false) {
  if (!Number.isFinite(value) || value < 0 || (!zero && value === 0))
    throw new Error(`${name} inválido.`);
}
function assertQty(value: number, p: Product) {
  assertAmount(value, "Quantidade");
  if (
    Math.abs(value - quantity(value)) > 1e-7 ||
    ((p.unit ?? "un") === "un" && !Number.isInteger(value))
  )
    throw new Error(`Confira a quantidade de ${p.name}.`);
}
async function pinVerifier(pin: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 150000, hash: "SHA-256" },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (n) => n.toString(16).padStart(2, "0")).join("");
}
export type Settings = {
  storeName: string;
  pixKey: string;
  merchantName: string;
  city: string;
  wholesaleCycleDays?: number | undefined;
  stockSafetyDays?: number | undefined;
};
type Theme = "light" | "dark";
export type StoreState = ManagementData & {
  products: Record<string, Product>;
  cart: CartItem[];
  sales: Sale[];
  settings: Settings;
  theme: Theme;
  cashOpen: boolean;
  upsertProduct: (product: Product, reason?: string) => void;
  importProducts: (products: Product[]) => void;
  restoreData: (data: Partial<StoreState>) => void;
  adjustStock: (barcode: string, delta: number, reason: string, loss?: boolean) => void;
  upsertSupplier: (supplier: Supplier) => void;
  receive: (payload: {
    id: string;
    supplierId: string;
    reference: string;
    items: {
      barcode: string;
      packs: number;
      unitsPerPack: number;
      packCost: number;
      lotName?: string | undefined;
      expiresAt?: string | undefined;
    }[];
  }) => Receiving;
  openCash: (opening: number, note?: string) => void;
  closeCash: (counted: number, note?: string) => void;
  recordCash: (type: "supply" | "withdrawal", amount: number, reason: string) => void;
  addExpense: (expense: Omit<Expense, "id" | "timestamp"> & { id?: string | undefined }) => void;
  returnSale: (payload: {
    id: string;
    saleId: string;
    items: { barcode: string; qty: number }[];
    reason: string;
    restock: boolean;
    refundMethod: PaymentMethod;
    cancel?: boolean | undefined;
  }) => void;
  suspendCart: (name: string) => void;
  resumeCart: (id: string) => void;
  discardDraft: (id: string) => void;
  upsertCustomer: (customer: Customer) => void;
  selectCustomer: (id?: string) => void;
  collectDebt: (id: string, amount: number, method: PaymentMethod, receiptId: string) => void;
  collectCustomerDebt: (
    customerId: string,
    amount: number,
    method: PaymentMethod,
    receiptId: string,
    debtId?: string,
    details?: {
      reference?: string | undefined;
      source?: "manual" | "notification" | undefined;
      bank?: string | undefined;
    },
  ) => void;
  saveStaff: (staff: Omit<Staff, "salt" | "verifier">, pin: string) => Promise<void>;
  unlockStaff: (id: string, pin: string) => Promise<void>;
  lockStaff: () => void;
  preparePayment: (quote: SaleItem[], pixTxid: string) => void;
  addPayment: (payment: Payment, quote: SaleItem[]) => void;
  clearPendingPayment: (reason: string) => void;
  applyPromotions: (updates: { barcode: string; price: number; promotion: Promotion }[]) => void;
  removePromotion: (barcode: string) => void;
  deleteProduct: (barcode: string) => void;
  addToCart: (barcode: string) => void;
  changeQty: (barcode: string, delta: number) => void;
  removeFromCart: (barcode: string) => void;
  checkout: (payload: {
    method: PaymentMethod;
    paidAmount?: number | undefined;
    change?: number | undefined;
    pixTxid?: string | undefined;
    quote?: SaleItem[] | undefined;
    payments?: Payment[] | undefined;
    customerId?: string | undefined;
    creditDueAt?: string | undefined;
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
  wholesaleCycleDays: 7,
  stockSafetyDays: 2,
};
export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const commit = (changes: Partial<StoreState>) => {
        const previous = get();
        if (typeof localStorage !== "undefined") {
          const durable = localStorage.getItem("pdv-mercado");
          if (durable && (JSON.parse(durable).state.revision ?? 0) !== previous.revision) {
            void useStore.persist.rehydrate();
            throw new Error(
              "Os dados mudaram em outra aba. Confira a atualização e tente novamente.",
            );
          }
        }
        try {
          set({ ...changes, revision: previous.revision + 1 });
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
      const authorize = (permission: Permission) => {
        if (!canOperate(get(), permission))
          throw new Error("Identifique um operador autorizado em Gestão → Equipe.");
      };
      const unlockedCart = () => {
        if (get().pendingPayments.length)
          throw new Error(
            "Há pagamento recebido neste carrinho. Conclua a venda ou registre a devolução antes de alterá-lo.",
          );
      };
      const movement = (
        p: Product,
        delta: number,
        type: StockMovement["type"],
        reason: string,
        documentId?: string,
      ): StockMovement => ({
        id: id(),
        productId: productId(p),
        barcode: p.barcode,
        name: p.name,
        delta: quantity(delta),
        before: p.stock,
        after: quantity(p.stock + delta),
        type,
        reason,
        documentId,
        timestamp: Date.now(),
        operatorId: operator(),
      });
      const session = () => get().cashSessions.find((s) => !s.closedAt);
      const requiredSession = () => {
        const s = session();
        if (!get().cashOpen || !s) throw new Error("Abra o caixa em Gestão → Caixa e despesas.");
        return s;
      };
      const normalizeProduct = (p: Product, previous?: Product): Product => {
        if (!p.barcode.trim() || !p.name.trim())
          throw new Error("Informe código e nome do produto.");
        if (["__proto__", "constructor", "prototype"].includes(p.barcode.trim()))
          throw new Error("Código de produto inválido.");
        if (p.unit && !["un", "kg", "l"].includes(p.unit)) throw new Error("Unidade inválida.");
        assertAmount(p.price, "Preço");
        assertAmount(p.stock, "Estoque", true);
        if ((p.unit ?? "un") === "un" && !Number.isInteger(p.stock))
          throw new Error("Estoque em unidades deve ser inteiro.");
        if (p.stock > 0) assertQty(p.stock, p);
        if (p.cost !== undefined) assertAmount(p.cost, "Custo", true);
        if (p.minimumStock !== undefined) assertAmount(p.minimumStock, "Estoque mínimo", true);
        if (
          p.components?.some(
            (c) =>
              c.productId === productId(p) ||
              !Number.isFinite(c.qty) ||
              c.qty <= 0 ||
              !Object.values(get().products).some(
                (child) =>
                  productId(child) === c.productId &&
                  !child.components?.length &&
                  child.stockControlled !== false,
              ),
          )
        )
          throw new Error(
            "Confira os componentes do combo. Use produtos controlados, sem outros combos.",
          );
        for (const component of p.components ?? []) {
          const child = Object.values(get().products).find(
            (child) => productId(child) === component.productId,
          )!;
          assertQty(component.qty, child);
        }
        return {
          ...previous,
          ...p,
          barcode: p.barcode.trim(),
          name: p.name.trim(),
          id: previous?.id ?? p.id ?? id(),
          price: money(p.price),
          stock: quantity(p.stock),
          ...(p.promotion?.mode === "stock" && p.stock <= 0 ? { promotion: undefined } : {}),
        };
      };
      return {
        ...defaultManagement(),
        products: {},
        cart: [],
        sales: [],
        settings: defaultSettings,
        theme: "light",
        cashOpen: true,
        cashSessions: [
          {
            id: "initial",
            openedAt: Date.now(),
            opening: 0,
            note: "Sessão inicial: fundo de troco não informado.",
          },
        ],
        upsertProduct: (product, reason = "Ajuste no cadastro") => {
          authorize("inventory");
          unlockedCart();
          const state = get();
          const previous =
            Object.values(state.products).find((p) => p.id && p.id === product.id) ??
            state.products[product.barcode];
          if (
            state.products[product.barcode] &&
            previous &&
            productId(state.products[product.barcode]!) !== productId(previous)
          )
            throw new Error("Código já pertence a outro produto.");
          if (
            previous &&
            previous.unit !== product.unit &&
            previous.stock > 0 &&
            (previous.unit ?? "un") !== (product.unit ?? "un")
          )
            throw new Error("Zere ou converta o estoque antes de mudar a unidade.");
          const p = normalizeProduct(product, previous);
          const products = { ...state.products };
          if (previous && previous.barcode !== p.barcode) delete products[previous.barcode];
          products[p.barcode] = p;
          const delta = quantity(p.stock - (previous?.stock ?? 0));
          const moves = delta
            ? [
                movement(
                  previous ?? { ...p, stock: 0 },
                  delta,
                  previous ? "adjustment" : "initial",
                  reason,
                ),
                ...state.movements,
              ]
            : state.movements;
          commit({
            products,
            movements: moves,
            lots: previous && delta < 0 ? retireLots(state.lots, previous, delta) : state.lots,
            cart: state.cart.map((c) =>
              previous && c.barcode === previous.barcode ? { ...c, barcode: p.barcode } : c,
            ),
            drafts: state.drafts.map((d) => ({
              ...d,
              cart: d.cart.map((c) =>
                previous && c.barcode === previous.barcode ? { ...c, barcode: p.barcode } : c,
              ),
            })),
          });
        },
        importProducts: (incoming) => {
          authorize("inventory");
          unlockedCart();
          const state = get();
          const products = { ...state.products };
          const movements = [...state.movements];
          const seen = new Set<string>();
          let lots = state.lots;
          for (const raw of incoming) {
            if (seen.has(raw.barcode)) throw new Error(`Código duplicado: ${raw.barcode}`);
            seen.add(raw.barcode);
            const old = products[raw.barcode];
            const p = normalizeProduct(raw, old);
            products[p.barcode] = p;
            const delta = quantity(p.stock - (old?.stock ?? 0));
            if (old && delta < 0) lots = retireLots(lots, old, delta);
            if (delta)
              movements.unshift(
                movement(
                  old ?? { ...p, stock: 0 },
                  delta,
                  old ? "adjustment" : "initial",
                  "Importação CSV",
                ),
              );
          }
          commit({ products, movements, lots });
        },
        restoreData: (data) => {
          authorize("backup");
          unlockedCart();
          const { staff: _staff, ...portable } = data;
          void _staff;
          commit({
            ...portable,
            ...(portable.settings
              ? { settings: { ...defaultSettings, ...portable.settings } }
              : {}),
            ...(portable.customers ? { customers: normalizeCustomers(portable.customers) } : {}),
            staff: get().staff,
          });
        },
        adjustStock: (barcode, delta, reason, loss = false) => {
          authorize("inventory");
          const state = get();
          const p = state.products[barcode];
          if (!p || p.active === false || p.components?.length || p.stockControlled === false)
            throw new Error("Selecione um produto com estoque.");
          if (!reason.trim()) throw new Error("Informe o motivo.");
          assertQty(Math.abs(delta), p);
          if (p.stock + delta < 0) throw new Error("Quantidade maior que o estoque disponível.");
          commit({
            products: {
              ...state.products,
              [barcode]: {
                ...p,
                stock: quantity(p.stock + delta),
                ...(p.promotion?.mode === "stock" && p.stock + delta <= 0
                  ? { promotion: undefined }
                  : {}),
              },
            },
            lots: delta < 0 ? retireLots(state.lots, p, delta) : state.lots,
            movements: [
              movement(p, delta, loss ? "loss" : "adjustment", reason.trim()),
              ...state.movements,
            ],
          });
        },
        upsertSupplier: (supplier) => {
          authorize("inventory");
          if (!supplier.name.trim()) throw new Error("Informe o fornecedor.");
          const s = { ...supplier, id: supplier.id || id(), name: supplier.name.trim() };
          commit({ suppliers: [s, ...get().suppliers.filter((x) => x.id !== s.id)] });
        },
        receive: (payload) => {
          authorize("inventory");
          const state = get();
          const existing = state.receivings.find((r) => r.id === payload.id);
          if (existing) return existing;
          if (!state.suppliers.some((s) => s.id === payload.supplierId && s.active !== false))
            throw new Error("Selecione o fornecedor.");
          if (!payload.items.length) throw new Error("Adicione os produtos recebidos.");
          const products = { ...state.products };
          const movements = [...state.movements];
          const lots = [...state.lots];
          const items: Receiving["items"] = [];
          for (const line of payload.items) {
            const p = products[line.barcode];
            if (!p || p.active === false || p.stockControlled === false || p.components?.length)
              throw new Error("Produto indisponível para recebimento.");
            assertAmount(line.packs, "Embalagens");
            assertAmount(line.unitsPerPack, "Unidades por embalagem");
            assertAmount(line.packCost, "Custo", true);
            const qty = quantity(line.packs * line.unitsPerPack);
            assertQty(qty, p);
            const unitCost = line.packCost / line.unitsPerPack;
            const stock = quantity(p.stock + qty);
            const cost =
              p.cost === undefined ? unitCost : (p.stock * p.cost + qty * unitCost) / stock;
            const lotId = line.lotName?.trim() ? id() : undefined;
            if (line.expiresAt && !/^\d{4}-\d{2}-\d{2}$/.test(line.expiresAt))
              throw new Error("Confira a validade.");
            if (lotId)
              lots.push({
                id: lotId,
                productId: productId(p),
                name: line.lotName!.trim(),
                expiresAt: line.expiresAt,
                receivedAt: Date.now(),
                available: qty,
                supplierId: payload.supplierId,
              });
            items.push({
              productId: productId(p),
              name: p.name,
              packs: line.packs,
              unitsPerPack: line.unitsPerPack,
              qty,
              cost: unitCost,
              total: money(line.packs * line.packCost),
              lotId,
            });
            movements.unshift(
              movement(
                p,
                qty,
                "receiving",
                payload.reference || "Entrada de mercadoria",
                payload.id,
              ),
            );
            products[p.barcode] = {
              ...p,
              stock,
              cost: Math.round(cost * 10000) / 10000,
              supplierId: payload.supplierId,
            };
          }
          const receiving: Receiving = {
            id: payload.id,
            timestamp: Date.now(),
            supplierId: payload.supplierId,
            reference: payload.reference,
            operatorId: operator(),
            items,
            total: money(items.reduce((n, i) => n + i.total, 0)),
          };
          commit({ products, movements, lots, receivings: [receiving, ...state.receivings] });
          return receiving;
        },
        openCash: (opening, note) => {
          authorize("cash");
          assertAmount(opening, "Fundo inicial", true);
          if (session()) throw new Error("Já existe um caixa aberto.");
          commit({
            cashOpen: true,
            cashSessions: [
              {
                id: id(),
                openedAt: Date.now(),
                opening: money(opening),
                note,
                operatorId: operator(),
              },
              ...get().cashSessions,
            ],
          });
        },
        closeCash: (counted, note) => {
          authorize("cash");
          assertAmount(counted, "Valor contado", true);
          if (get().pendingPayments.length)
            throw new Error("Conclua o pagamento pendente antes de fechar o caixa.");
          const s = requiredSession();
          const expected = cashExpected(get(), s);
          commit({
            cashOpen: false,
            cashSessions: get().cashSessions.map((x) =>
              x.id === s.id
                ? {
                    ...x,
                    closedAt: Date.now(),
                    counted: money(counted),
                    expected,
                    difference: money(counted - expected),
                    note: note || x.note,
                  }
                : x,
            ),
          });
        },
        recordCash: (type, amount, reason) => {
          authorize("cash");
          assertAmount(amount);
          if (!reason.trim()) throw new Error("Informe o motivo.");
          const s = requiredSession();
          if (type === "withdrawal" && amount > cashExpected(get(), s))
            throw new Error("Sangria maior que o dinheiro esperado.");
          commit({
            cashMovements: [
              {
                id: id(),
                sessionId: s.id,
                timestamp: Date.now(),
                type,
                amount: money(amount),
                method: "dinheiro",
                reason: reason.trim(),
                operatorId: operator(),
              },
              ...get().cashMovements,
            ],
          });
        },
        addExpense: (expense) => {
          authorize("cash");
          const state = get();
          const expenseId = expense.id || id();
          if (state.expenses.some((e) => e.id === expenseId)) return;
          assertAmount(expense.amount);
          if (!expense.description.trim() || !expense.category.trim())
            throw new Error("Informe categoria e descrição.");
          const s = expense.method === "dinheiro" ? requiredSession() : session();
          const e: Expense = {
            ...expense,
            id: expenseId,
            timestamp: Date.now(),
            amount: money(expense.amount),
            operatorId: operator(),
          };
          commit({
            expenses: [e, ...state.expenses],
            cashMovements: s
              ? [
                  {
                    id: id(),
                    sessionId: s.id,
                    timestamp: e.timestamp,
                    type: "expense",
                    amount: e.amount,
                    method: e.method,
                    reason: e.description,
                    documentId: e.id,
                    operatorId: operator(),
                  },
                  ...state.cashMovements,
                ]
              : state.cashMovements,
          });
        },
        returnSale: (payload) => {
          authorize("returns");
          const state = get();
          if (state.returns.some((r) => r.id === payload.id)) return;
          const sale = state.sales.find((s) => s.id === payload.saleId);
          if (!sale) throw new Error("Venda não encontrada.");
          if (sale.status === "cancelled") return;
          if (!payload.reason.trim() || !payload.items.length)
            throw new Error("Informe itens e motivo da devolução.");
          const products = { ...state.products };
          const movements = [...state.movements];
          const updates = new Map<string, number>();
          const returned: SaleReturn["items"] = [];
          for (const entry of payload.items) {
            const sold = sale.items.find((i) => i.barcode === entry.barcode);
            if (!sold) throw new Error("Item não pertence à venda.");
            const already = updates.get(entry.barcode) ?? sold.returnedQty ?? 0;
            if (
              !Number.isFinite(entry.qty) ||
              entry.qty <= 0 ||
              entry.qty + already > sold.qty + 1e-7
            )
              throw new Error("Quantidade maior que o saldo vendido.");
            const p =
              Object.values(products).find((p) => productId(p) === sold.productId) ??
              products[sold.barcode];
            assertQty(
              entry.qty,
              p ?? {
                barcode: sold.barcode,
                name: sold.name,
                price: sold.price,
                stock: 0,
                unit: sold.unit,
              },
            );
            updates.set(sold.barcode, quantity(already + entry.qty));
            returned.push({
              productId: sold.productId,
              barcode: sold.barcode,
              name: sold.name,
              qty: entry.qty,
              price: sold.price,
              cost: sold.cost,
            });
            if (payload.restock) {
              const parts = sold.components?.length
                ? sold.components
                : [{ productId: sold.productId ?? (p ? productId(p) : ""), qty: 1 }];
              for (const part of parts) {
                const target = Object.values(products).find((p) => productId(p) === part.productId);
                if (!target) throw new Error("Produto de estoque não encontrado para devolução.");
                if (target.stockControlled === false) continue;
                const delta = quantity(entry.qty * part.qty);
                movements.unshift(movement(target, delta, "return", payload.reason, payload.id));
                products[target.barcode] = { ...target, stock: quantity(target.stock + delta) };
              }
            }
          }
          const previouslyReturned = saleItemsTotal(
            sale.items.map((i) => ({ ...i, qty: i.returnedQty ?? 0 })),
          );
          const nowReturned = saleItemsTotal(
            sale.items.map((i) => ({ ...i, qty: updates.get(i.barcode) ?? i.returnedQty ?? 0 })),
          );
          const amount = money(nowReturned - previouslyReturned);
          const debt = state.receivables.find((d) => d.saleId === sale.id);
          const debtReduction = Math.min(debt?.balance ?? 0, amount);
          const refund = money(amount - debtReduction);
          const cashSession =
            refund > 0 && payload.refundMethod === "dinheiro" ? requiredSession() : session();
          const r: SaleReturn = {
            id: payload.id,
            saleId: sale.id,
            timestamp: Date.now(),
            reason: payload.reason.trim(),
            restock: payload.restock,
            amount,
            debtReduction,
            refundMethod: payload.refundMethod,
            items: returned,
            operatorId: operator(),
          };
          const items = sale.items.map((i) => ({
            ...i,
            returnedQty: updates.get(i.barcode) ?? i.returnedQty,
          }));
          if (payload.cancel && items.some((i) => (i.returnedQty ?? 0) < i.qty))
            throw new Error("Cancelamento deve incluir todos os itens restantes.");
          commit({
            products,
            movements,
            returns: [r, ...state.returns],
            sales: state.sales.map((s) =>
              s.id === sale.id
                ? {
                    ...s,
                    items,
                    status: payload.cancel ? "cancelled" : s.status,
                    refundedAmount: money((s.refundedAmount ?? 0) + amount),
                    cancelReason: payload.cancel ? payload.reason : s.cancelReason,
                  }
                : s,
            ),
            receivables: state.receivables.map((d) =>
              d.id === debt?.id ? { ...d, balance: money(d.balance - debtReduction) } : d,
            ),
            cashMovements:
              cashSession && refund > 0
                ? [
                    {
                      id: id(),
                      sessionId: cashSession.id,
                      timestamp: r.timestamp,
                      type: "refund",
                      amount: refund,
                      method: payload.refundMethod,
                      reason: payload.reason,
                      documentId: r.id,
                      operatorId: operator(),
                    },
                    ...state.cashMovements,
                  ]
                : state.cashMovements,
          });
        },
        suspendCart: (name) => {
          authorize("sell");
          unlockedCart();
          if (!get().cart.length) throw new Error("Carrinho vazio.");
          commit({
            drafts: [
              {
                id: id(),
                name: name.trim() || "Atendimento",
                timestamp: Date.now(),
                cart: get().cart,
                customerId: get().currentCustomerId,
              },
              ...get().drafts,
            ],
            cart: [],
            currentCustomerId: undefined,
            pendingQuote: undefined,
            pendingPixTxid: undefined,
          });
        },
        resumeCart: (draftId) => {
          authorize("sell");
          unlockedCart();
          if (get().cart.length) throw new Error("Guarde ou esvazie o carrinho atual primeiro.");
          const draft = get().drafts.find((d) => d.id === draftId);
          if (!draft) throw new Error("Atendimento não encontrado.");
          if (
            draft.cart.some(
              (c) => !get().products[c.barcode] || get().products[c.barcode]?.active === false,
            )
          )
            throw new Error("Um produto foi arquivado. Confira o atendimento antes de retomá-lo.");
          commit({
            cart: draft.cart,
            currentCustomerId: draft.customerId,
            drafts: get().drafts.filter((d) => d.id !== draftId),
            pendingQuote: undefined,
            pendingPixTxid: undefined,
          });
        },
        discardDraft: (draftId) => {
          authorize("sell");
          commit({ drafts: get().drafts.filter((d) => d.id !== draftId) });
        },
        upsertCustomer: (customer) => {
          authorize("sell");
          const state = get();
          const previous = state.customers.find((c) => c.id === customer.id);
          if (!customer.name.trim()) throw new Error("Informe o nome do cliente.");
          const cpf = customer.cpf?.replace(/\D/g, "") || undefined;
          if (
            cpf &&
            (!validCpf(cpf) ||
              state.customers.some(
                (c) => c.id !== customer.id && c.cpf?.replace(/\D/g, "") === cpf,
              ))
          )
            throw new Error("CPF inválido ou já cadastrado.");
          if (customer.creditLimit !== undefined)
            assertAmount(customer.creditLimit, "Limite", true);
          if (
            customer.dueDay !== undefined &&
            (!Number.isInteger(customer.dueDay) || customer.dueDay < 1 || customer.dueDay > 31)
          )
            throw new Error("Dia de vencimento deve estar entre 1 e 31.");
          const enabled =
            customer.creditEnabled ?? (previous ? (previous.creditEnabled ?? true) : false);
          if (
            enabled !== (previous ? (previous.creditEnabled ?? true) : false) ||
            customer.creditLimit !== previous?.creditLimit ||
            customer.dueDay !== previous?.dueDay
          )
            authorize("manage");
          let n = 1;
          while (state.customers.some((c) => c.code === `U-${String(n).padStart(4, "0")}`)) n++;
          const c = {
            ...previous,
            ...customer,
            id: previous?.id ?? customer.id ?? id(),
            name: customer.name.trim(),
            cpf,
            code: previous?.code ?? `U-${String(n).padStart(4, "0")}`,
            creditEnabled: enabled,
            ...(customer.creditLimit !== undefined
              ? { creditLimit: money(customer.creditLimit) }
              : {}),
          };
          commit({ customers: [c, ...state.customers.filter((x) => x.id !== c.id)] });
        },
        selectCustomer: (customerId) => {
          authorize("sell");
          unlockedCart();
          if (customerId && !get().customers.some((c) => c.id === customerId && c.active !== false))
            throw new Error("Cliente indisponível.");
          commit({ currentCustomerId: customerId });
        },
        collectDebt: (debtId, amount, method, receiptId) => {
          const debt = get().receivables.find((d) => d.id === debtId);
          if (!debt) throw new Error("Dívida não encontrada.");
          get().collectCustomerDebt(debt.customerId, amount, method, receiptId, debtId);
        },
        collectCustomerDebt: (customerId, amount, method, receiptId, debtId, details = {}) => {
          authorize("cash");
          const state = get();
          if (state.receivables.some((d) => d.receipts.some((r) => r.id === receiptId))) return;
          if (!receiptId || !(method in PAYMENT_LABELS)) throw new Error("Pagamento inválido.");
          if (!state.customers.some((c) => c.id === customerId))
            throw new Error("Cliente não encontrado.");
          assertAmount(amount);
          if (money(amount) <= 0) throw new Error("Informe um valor maior que zero.");
          const debts = state.receivables
            .filter(
              (d) => d.customerId === customerId && d.balance > 0 && (!debtId || d.id === debtId),
            )
            .sort(
              (a, b) =>
                a.dueAt.localeCompare(b.dueAt) ||
                a.timestamp - b.timestamp ||
                a.id.localeCompare(b.id),
            );
          const available = money(debts.reduce((n, d) => n + d.balance, 0));
          if (money(amount) > available) throw new Error("Valor maior que o saldo da dívida.");
          const session = requiredSession();
          const timestamp = Date.now();
          let remaining = money(amount);
          const updates = new Map<string, Receivable>();
          for (const debt of debts) {
            const part = money(Math.min(debt.balance, remaining));
            if (part <= 0) continue;
            updates.set(debt.id, {
              ...debt,
              balance: money(debt.balance - part),
              receipts: [
                { id: receiptId, timestamp, amount: part, method, ...details },
                ...debt.receipts,
              ],
            });
            remaining = money(remaining - part);
          }
          commit({
            receivables: state.receivables.map((d) => updates.get(d.id) ?? d),
            cashMovements: [
              {
                id: id(),
                sessionId: session.id,
                timestamp,
                type: "debt",
                amount: money(amount),
                method,
                reason: "Recebimento de fiado",
                documentId: receiptId,
                operatorId: operator(),
              },
              ...state.cashMovements,
            ],
          });
        },
        saveStaff: async (raw, pin) => {
          authorize("manage");
          if (!raw.name.trim() || !/^\d{4,12}$/.test(pin))
            throw new Error("Informe nome e PIN de 4 a 12 dígitos.");
          if (!get().staff.length && raw.role !== "owner")
            throw new Error("O primeiro operador deve ser proprietário.");
          const salt = id();
          const verifier = await pinVerifier(pin, salt);
          authorize("manage");
          const member = { ...raw, id: raw.id || id(), name: raw.name.trim(), salt, verifier };
          const staff = [member, ...get().staff.filter((s) => s.id !== member.id)];
          if (!staff.some((s) => s.active && s.role === "owner"))
            throw new Error("Mantenha um proprietário ativo.");
          const first = !get().staff.length;
          commit({ staff });
          if (first) authenticatedOperator = member.id;
        },
        unlockStaff: async (memberId, pin) => {
          const member = get().staff.find((s) => s.id === memberId && s.active);
          if (!member || (await pinVerifier(pin, member.salt)) !== member.verifier)
            throw new Error("Operador ou PIN incorreto.");
          authenticatedOperator = member.id;
          commit({});
        },
        lockStaff: () => {
          authenticatedOperator = undefined;
          commit({});
        },
        preparePayment: (quote, pixTxid) => {
          authorize("sell");
          requiredSession();
          if (get().pendingPayments.length) return;
          commit({ pendingQuote: quote, pendingPixTxid: pixTxid });
        },
        addPayment: (payment, quote) => {
          authorize("sell");
          requiredSession();
          const state = get();
          if (state.pendingPayments.some((p) => p.id === payment.id)) return;
          assertAmount(payment.amount);
          const total = saleItemsTotal(quote);
          if (
            payment.amount > money(total - state.pendingPayments.reduce((n, p) => n + p.amount, 0))
          )
            throw new Error("Parcela maior que o saldo restante.");
          if (
            quote.length !== state.cart.length ||
            quote.some(
              (i, n) => i.barcode !== state.cart[n]?.barcode || i.qty !== state.cart[n]?.qty,
            )
          )
            throw new Error("O carrinho mudou.");
          commit({
            pendingPayments: [
              ...state.pendingPayments,
              { ...payment, amount: money(payment.amount) },
            ],
            pendingQuote: quote,
          });
        },
        clearPendingPayment: (reason) => {
          authorize("returns");
          if (!reason.trim()) throw new Error("Informe o motivo da devolução dos pagamentos.");
          const state = get();
          const s = requiredSession();
          const cashMovements = state.pendingPayments.map((p) => ({
            id: id(),
            sessionId: s.id,
            timestamp: Date.now(),
            type: "refund" as const,
            amount: p.amount,
            method: p.method,
            reason,
            documentId: p.id,
            operatorId: operator(),
          }));
          // Partial payments were not counted in sales: record receipt and refund together for an auditable zero net drawer change.
          const receipts = state.pendingPayments.map((p) => ({
            id: id(),
            sessionId: s.id,
            timestamp: Date.now(),
            type: "debt" as const,
            amount: p.amount,
            method: p.method,
            reason: "Pagamento de carrinho devolvido",
            documentId: p.id,
            operatorId: operator(),
          }));
          commit({
            pendingPayments: [],
            pendingQuote: undefined,
            pendingPixTxid: undefined,
            cashMovements: [...cashMovements, ...receipts, ...state.cashMovements],
          });
        },
        applyPromotions: (updates) => {
          authorize("inventory");
          unlockedCart();
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
          authorize("inventory");
          const product = get().products[barcode];
          if (!product) return;
          commit({
            products: { ...get().products, [barcode]: { ...product, promotion: undefined } },
          });
        },
        deleteProduct: (barcode) => {
          authorize("inventory");
          unlockedCart();
          const s = get();
          const p = s.products[barcode];
          if (!p) return;
          commit({
            products: { ...s.products, [barcode]: { ...p, active: false } },
            cart: s.cart.filter((c) => c.barcode !== barcode),
          });
        },
        addToCart: (barcode) => {
          authorize("sell");
          unlockedCart();
          const s = get();
          const p = s.products[barcode];
          if (!p || p.active === false) throw new Error("Produto indisponível.");
          const existing = s.cart.find((i) => i.barcode === barcode);
          commit(
            existing
              ? { cart: s.cart.map((i) => (i.barcode === barcode ? { ...i, qty: i.qty + 1 } : i)) }
              : { cart: [...s.cart, { barcode, qty: 1 }] },
          );
        },
        changeQty: (barcode, delta) => {
          authorize("sell");
          unlockedCart();
          const s = get();
          const p = s.products[barcode];
          if (!p || !Number.isFinite(delta)) throw new Error("Quantidade inválida.");
          const next = quantity((s.cart.find((c) => c.barcode === barcode)?.qty ?? 0) + delta);
          if (next > 0) assertQty(next, p);
          commit({
            cart: s.cart
              .map((i) => (i.barcode === barcode ? { ...i, qty: next } : i))
              .filter((i) => i.qty > 0),
          });
        },
        removeFromCart: (barcode) => {
          authorize("sell");
          unlockedCart();
          commit({ cart: get().cart.filter((i) => i.barcode !== barcode) });
        },
        checkout: ({
          method,
          paidAmount,
          change,
          pixTxid,
          quote,
          payments: explicitPayments,
          customerId,
          creditDueAt,
        }) => {
          authorize("sell");
          const activeSession = requiredSession();
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
          const payments =
            explicitPayments ??
            (state.pendingPayments.length
              ? state.pendingPayments
              : [
                  {
                    id: id(),
                    method,
                    amount: total,
                    paidAmount: method === "dinheiro" ? (paidAmount ?? total) : undefined,
                    change:
                      method === "dinheiro"
                        ? (change ?? money((paidAmount ?? total) - total))
                        : undefined,
                    source: "manual" as const,
                    reference: method === "pix" ? pixTxid : undefined,
                    confirmedAt: Date.now(),
                  },
                ]);
          if (
            new Set(payments.map((p) => p.id)).size !== payments.length ||
            payments.some(
              (p) =>
                !Number.isFinite(p.amount) ||
                p.amount < 0 ||
                !(p.method in PAYMENT_LABELS) ||
                (p.method === "dinheiro" &&
                  p.paidAmount !== undefined &&
                  money(p.paidAmount - p.amount) < 0),
            )
          )
            throw new Error("Confira os pagamentos.");
          const paidTotal = money(payments.reduce((n, p) => n + p.amount, 0));
          const remaining = money(total - paidTotal);
          const selectedCustomer = customerId ?? state.currentCustomerId;
          if (remaining < 0) throw new Error("Pagamentos maiores que o total.");
          if (
            remaining > 0 &&
            (!creditDueAt ||
              !validLocalDate(creditDueAt) ||
              !state.customers.some((c) => c.id === selectedCustomer && c.active !== false))
          )
            throw new Error("Pagamento incompleto. Para fiado, selecione cliente e vencimento.");
          if (remaining > 0) {
            const customer = state.customers.find((c) => c.id === selectedCustomer)!;
            if (customer.creditEnabled === false)
              throw new Error("Fiado não habilitado para este cliente.");
            if (
              customer.creditLimit !== undefined &&
              money(customerBalance(state, customer.id) + remaining) > customer.creditLimit
            )
              throw new Error("O saldo ultrapassa o limite de fiado do cliente.");
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
            payments,
            status: "completed",
            sessionId: activeSession.id,
            operatorId: operator(),
            customerId: selectedCustomer,
            ...(method === "pix" && pixTxid ? { pixTxid } : {}),
            syncState: "pending",
            deviceId: getDeviceId(),
            offline: typeof navigator !== "undefined" && navigator.onLine === false,
            ...(method === "dinheiro" && paidAmount != null
              ? { paidAmount, change: change ?? 0 }
              : {}),
          };
          const products = { ...state.products };
          const movements = [...state.movements];
          const lots = state.lots.map((l) => ({ ...l }));
          const today = new Date().toLocaleDateString("sv-SE");
          for (const item of items) {
            const parent = products[item.barcode];
            if (!parent || parent.active === false) throw new Error("Produto arquivado.");
            assertQty(item.qty, parent);
            const parts = item.components?.length
              ? item.components
              : [{ productId: productId(parent), qty: 1 }];
            for (const part of parts) {
              const p = Object.values(products).find((p) => productId(p) === part.productId);
              if (!p) throw new Error("Componente não encontrado.");
              if (p.stockControlled === false) continue;
              const soldQty = quantity(item.qty * part.qty);
              const expired = lots
                .filter((l) => l.productId === productId(p) && l.expiresAt && l.expiresAt < today)
                .reduce((n, l) => n + l.available, 0);
              if (soldQty > quantity(p.stock - expired))
                throw new Error(
                  `Estoque disponível insuficiente para ${p.name}. Confira quantidades e lotes vencidos.`,
                );
              const stock = quantity(p.stock - soldQty);
              products[p.barcode] = {
                ...p,
                stock,
                ...(p.promotion?.mode === "stock" && stock === 0 ? { promotion: undefined } : {}),
              };
              movements.unshift(movement(p, -soldQty, "sale", "Venda", sale.id));
              let consuming = soldQty;
              for (const lot of lots
                .filter(
                  (l) =>
                    l.productId === productId(p) &&
                    l.available > 0 &&
                    (!l.expiresAt || l.expiresAt >= today),
                )
                .sort((a, b) => (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999"))) {
                const used = Math.min(consuming, lot.available);
                lot.available = quantity(lot.available - used);
                consuming = quantity(consuming - used);
                if (consuming <= 0) break;
              }
            }
          }
          const receivables =
            remaining > 0
              ? [
                  {
                    id: id(),
                    saleId: sale.id,
                    customerId: selectedCustomer!,
                    timestamp: sale.timestamp,
                    dueAt: creditDueAt!,
                    original: remaining,
                    balance: remaining,
                    receipts: [],
                  },
                  ...state.receivables,
                ]
              : state.receivables;
          commit({
            products,
            movements,
            lots,
            receivables,
            cart: [],
            sales: [sale, ...state.sales],
            pendingPayments: [],
            pendingQuote: undefined,
            pendingPixTxid: undefined,
            currentCustomerId: undefined,
          });
          return sale;
        },
        deleteSale: (saleId) => {
          const sale = get().sales.find((s) => s.id === saleId);
          if (!sale || sale.status === "cancelled") return;
          const items = sale.items
            .map((i) => ({ barcode: i.barcode, qty: quantity(i.qty - (i.returnedQty ?? 0)) }))
            .filter((i) => i.qty > 0);
          if (!items.length) {
            authorize("returns");
            commit({
              sales: get().sales.map((s) => (s.id === saleId ? { ...s, status: "cancelled" } : s)),
            });
            return;
          }
          get().returnSale({
            id: id(),
            saleId,
            items,
            reason: "Cancelamento da venda",
            restock: true,
            refundMethod: sale.method,
            cancel: true,
          });
        },
        markSalesSynced: (ids) =>
          commit({
            sales: get().sales.map((sale) =>
              ids.includes(sale.id) ? { ...sale, syncState: "synced" } : sale,
            ),
          }),
        setSettings: (settings) => {
          authorize("manage");
          for (const [value, minimum, name] of [
            [settings.wholesaleCycleDays, 1, "Ciclo do atacado"],
            [settings.stockSafetyDays, 0, "Margem de segurança"],
          ] as const) {
            if (value !== undefined && (!Number.isInteger(value) || value < minimum || value > 365))
              throw new Error(`${name}: informe dias inteiros entre ${minimum} e 365.`);
          }
          commit({ settings: { ...get().settings, ...settings } });
        },
        setTheme: (theme) => commit({ theme }),
        toggleCash: () => {
          if (get().cashOpen) get().closeCash(cashExpected(get(), requiredSession()));
          else get().openCash(0);
        },
      };
    },
    {
      name: "pdv-mercado",
      version: 9,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<StoreState>;
        const previousSettings = state.settings ?? defaultSettings;
        if (
          typeof localStorage !== "undefined" &&
          !localStorage.getItem("pdv-before-management-v6")
        ) {
          const raw = localStorage.getItem("pdv-mercado");
          if (raw) localStorage.setItem("pdv-before-management-v6", raw);
        }
        const products = Object.fromEntries(
          Object.entries(state.products ?? {}).map(([code, p]) => [
            code,
            {
              ...p,
              id: productId(p),
              unit: p.unit ?? "un",
              minimumStock: p.minimumStock ?? 5,
              active: p.active ?? true,
            },
          ]),
        );
        const baseline: StockMovement[] = Object.values(products)
          .filter((p) => p.stock !== 0)
          .map((p) => ({
            id: `initial-${productId(p)}`,
            productId: productId(p),
            barcode: p.barcode,
            name: p.name,
            type: "initial",
            delta: p.stock,
            before: 0,
            after: p.stock,
            timestamp: Date.now(),
            reason: "Saldo preservado da versão anterior",
          }));
        return {
          ...defaultManagement(),
          ...state,
          products,
          customers: normalizeCustomers(state.customers ?? []),
          movements: state.movements ?? baseline,
          cashSessions:
            state.cashSessions ??
            (state.cashOpen === false
              ? []
              : [
                  {
                    id: "migrated",
                    openedAt: Date.now(),
                    opening: 0,
                    note: "Fundo não informado na versão anterior. Confira este turno.",
                  },
                ]),
          cart: state.cart ?? [],
          sales: (state.sales ?? []).map((sale) => ({
            ...sale,
            syncState: sale.syncState ?? "pending",
            items: sale.items.map((i) => ({
              ...i,
              productId: i.productId ?? products[i.barcode]?.id,
            })),
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
