import { z } from "zod";
import { readProductPhoto, saveProductPhoto, deleteProductPhoto } from "@/lib/productPhotos";
import {
  canOperate,
  useStore,
  validCpf,
  normalizeCustomers,
  type Product,
  type StoreState,
} from "@/store/useStore";

const number = z.number().finite();
const positive = number.nonnegative();
const text = z.string().max(2000);
const identifier = z.string().min(1).max(250);
const method = z.enum(["dinheiro", "pix", "debito", "credito"]);
const optionalId = identifier.optional();
const product = z.object({
  id: optionalId,
  barcode: identifier,
  name: text.min(1),
  price: positive,
  stock: positive,
  brand: text.optional(),
  packageSize: text.optional(),
  photoId: optionalId,
  promotion: z
    .object({
      discountPercent: number.min(0).max(100),
      mode: z.enum(["stock", "period"]),
      startsAt: number.optional(),
      endsAt: number.optional(),
    })
    .optional(),
  category: text.optional(),
  cost: positive.optional(),
  unit: z.enum(["un", "kg", "l"]).optional(),
  minimumStock: positive.optional(),
  supplierId: optionalId,
  active: z.boolean().optional(),
  stockControlled: z.boolean().optional(),
  components: z.array(z.object({ productId: identifier, qty: number.positive() })).optional(),
});
const component = z.object({
  productId: identifier,
  qty: number.positive(),
  cost: positive.optional(),
});
const item = z.object({
  productId: optionalId,
  barcode: identifier,
  name: text,
  price: positive,
  qty: number.positive(),
  originalPrice: positive.optional(),
  discountPercent: number.min(0).max(100).optional(),
  cost: positive.optional(),
  unit: z.enum(["un", "kg", "l"]).optional(),
  components: z.array(component).optional(),
  returnedQty: positive.optional(),
});
const payment = z.object({
  id: identifier,
  method,
  amount: positive,
  paidAmount: positive.optional(),
  change: positive.optional(),
  source: z.enum(["manual", "notification"]),
  reference: text.optional(),
  bank: text.optional(),
  confirmedAt: number,
});
const sale = z.object({
  id: identifier,
  timestamp: number,
  items: z.array(item),
  total: positive,
  method,
  paidAmount: positive.optional(),
  change: positive.optional(),
  pixTxid: text.optional(),
  syncState: z.enum(["pending", "synced"]).optional(),
  deviceId: text.optional(),
  offline: z.boolean().optional(),
  status: z.enum(["completed", "cancelled"]).optional(),
  payments: z.array(payment).optional(),
  refundedAmount: positive.optional(),
  sessionId: optionalId,
  operatorId: optionalId,
  customerId: optionalId,
  cancelReason: text.optional(),
});
const person = z.object({
  id: identifier,
  name: text.min(1),
  contact: text.optional(),
  active: z.boolean().optional(),
});
const cart = z.array(z.object({ barcode: identifier, qty: number.positive() }));
const schema = z
  .object({
    products: z.record(product),
    cart,
    sales: z.array(sale),
    settings: z.object({ storeName: text, pixKey: text, merchantName: text, city: text }),
    theme: z.enum(["light", "dark"]),
    cashOpen: z.boolean(),
    movements: z.array(
      z.object({
        id: identifier,
        productId: identifier,
        barcode: identifier,
        name: text,
        type: z.enum(["initial", "adjustment", "receiving", "sale", "return", "loss"]),
        delta: number,
        before: positive,
        after: positive,
        timestamp: number,
        reason: text,
        documentId: optionalId,
        operatorId: optionalId,
      }),
    ),
    suppliers: z.array(person),
    receivings: z.array(
      z.object({
        id: identifier,
        timestamp: number,
        supplierId: identifier,
        reference: text,
        operatorId: optionalId,
        total: positive,
        items: z.array(
          z.object({
            productId: identifier,
            name: text,
            packs: number.positive(),
            unitsPerPack: number.positive(),
            qty: number.positive(),
            cost: positive,
            total: positive,
            lotId: optionalId,
          }),
        ),
      }),
    ),
    lots: z.array(
      z.object({
        id: identifier,
        productId: identifier,
        name: text,
        expiresAt: text.optional(),
        receivedAt: number,
        available: positive,
        supplierId: optionalId,
      }),
    ),
    cashSessions: z.array(
      z.object({
        id: identifier,
        openedAt: number,
        closedAt: number.optional(),
        opening: positive,
        counted: positive.optional(),
        expected: number.optional(),
        difference: number.optional(),
        note: text.optional(),
        operatorId: optionalId,
      }),
    ),
    cashMovements: z.array(
      z.object({
        id: identifier,
        sessionId: identifier,
        timestamp: number,
        type: z.enum(["supply", "withdrawal", "expense", "refund", "debt"]),
        amount: positive,
        method,
        reason: text,
        documentId: optionalId,
        operatorId: optionalId,
      }),
    ),
    expenses: z.array(
      z.object({
        id: identifier,
        timestamp: number,
        category: text,
        description: text,
        amount: positive,
        method,
        supplierId: optionalId,
        operatorId: optionalId,
      }),
    ),
    returns: z.array(
      z.object({
        id: identifier,
        saleId: identifier,
        timestamp: number,
        reason: text,
        restock: z.boolean(),
        amount: positive,
        debtReduction: positive,
        refundMethod: method,
        operatorId: optionalId,
        items: z.array(
          z.object({
            productId: optionalId,
            barcode: identifier,
            name: text,
            qty: number.positive(),
            price: positive,
            cost: positive.optional(),
          }),
        ),
      }),
    ),
    drafts: z.array(
      z.object({ id: identifier, name: text, timestamp: number, cart, customerId: optionalId }),
    ),
    customers: z.array(
      person.extend({
        code: identifier.optional(),
        cpf: z.string().optional(),
        creditEnabled: z.boolean().optional(),
        creditLimit: positive.optional(),
        dueDay: z.number().int().min(1).max(31).optional(),
      }),
    ),
    receivables: z.array(
      z.object({
        id: identifier,
        saleId: identifier,
        customerId: identifier,
        timestamp: number,
        dueAt: text,
        original: positive,
        balance: positive,
        receipts: z.array(
          z.object({
            id: identifier,
            timestamp: number,
            amount: positive,
            method,
            reference: text.optional(),
            source: z.enum(["manual", "notification"]).optional(),
            bank: text.optional(),
          }),
        ),
      }),
    ),
    pendingPayments: z.array(payment),
    pendingQuote: z.array(item).optional(),
    pendingPixTxid: text.optional(),
    currentCustomerId: optionalId,
  })
  .strict();
export type PortableData = z.infer<typeof schema>;
export type BackupPreview = {
  createdAt: string;
  data: PortableData;
  photos: Record<string, string>;
};
const keys = Object.keys(schema.shape) as (keyof PortableData)[];
export function portableData(state: StoreState) {
  return Object.fromEntries(keys.map((key) => [key, state[key]])) as PortableData;
}
export function downloadFile(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function checksum(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (n) => n.toString(16).padStart(2, "0")).join("");
}
function photoData(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler uma foto."));
    reader.readAsDataURL(blob);
  });
}
export async function createBackup() {
  const state = useStore.getState();
  if (!canOperate(state, "backup"))
    throw new Error("Identifique o proprietário para exportar o backup.");
  const photos: Record<string, string> = {};
  for (const photoId of new Set(
    Object.values(state.products)
      .map((p) => p.photoId)
      .filter((x): x is string => Boolean(x)),
  )) {
    const blob = await readProductPhoto(photoId);
    if (!blob)
      throw new Error("Uma foto está ausente. Confira os produtos antes de criar o backup.");
    photos[photoId] = await photoData(blob);
  }
  const payload = { createdAt: new Date().toISOString(), data: portableData(state), photos };
  const raw = JSON.stringify(payload);
  return new Blob(
    [
      JSON.stringify({
        format: "mercadinho-uniao",
        version: 1,
        checksum: await checksum(raw),
        payload,
      }),
    ],
    { type: "application/json" },
  );
}
export async function previewBackup(file: File): Promise<BackupPreview> {
  if (file.size > 50 * 1024 * 1024) throw new Error("Escolha um backup de até 50 MB.");
  let value;
  try {
    value = JSON.parse(await file.text());
  } catch {
    throw new Error("Arquivo inválido ou incompleto.");
  }
  if (
    value?.format !== "mercadinho-uniao" ||
    value.version !== 1 ||
    !value.payload ||
    typeof value.checksum !== "string" ||
    (await checksum(JSON.stringify(value.payload))) !== value.checksum
  )
    throw new Error("Backup incompatível ou com integridade inválida.");
  const parsed = schema.safeParse(value.payload.data);
  if (!parsed.success) throw new Error("Os dados do backup são inválidos. Nada foi substituído.");
  const data = parsed.data;
  const photos = value.payload.photos;
  if (!photos || typeof photos !== "object" || Array.isArray(photos))
    throw new Error("Fotos inválidas no backup.");
  for (const [code, p] of Object.entries(data.products)) {
    if (code !== p.barcode || ["__proto__", "prototype", "constructor"].includes(code))
      throw new Error("Código de produto inválido.");
    if (
      p.photoId &&
      (typeof photos[p.photoId] !== "string" ||
        !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photos[p.photoId]))
    )
      throw new Error("Foto ausente ou inválida no backup.");
  }
  if (
    data.cart.some((c) => !data.products[c.barcode]) ||
    data.cashSessions.filter((s) => !s.closedAt).length > 1
  )
    throw new Error("Relações inválidas no backup.");
  for (const s of data.sales) {
    if (s.items.some((i) => (i.returnedQty ?? 0) > i.qty) || (s.refundedAmount ?? 0) > s.total)
      throw new Error("Venda inválida no backup.");
  }
  for (const list of [
    Object.values(data.products),
    data.sales,
    data.suppliers,
    data.receivings,
    data.lots,
    data.cashSessions,
    data.cashMovements,
    data.expenses,
    data.returns,
    data.drafts,
    data.customers,
    data.receivables,
  ]) {
    const ids = list.map((v) => v.id).filter(Boolean);
    if (new Set(ids).size !== ids.length) throw new Error("Identificadores duplicados no backup.");
  }
  const codes = data.customers.map((c) => c.code).filter(Boolean);
  const cpfs = data.customers.map((c) => c.cpf).filter(Boolean);
  if (
    new Set(codes).size !== codes.length ||
    new Set(cpfs).size !== cpfs.length ||
    cpfs.some((cpf) => !validCpf(cpf!)) ||
    data.receivables.some(
      (d) =>
        !data.customers.some((c) => c.id === d.customerId) ||
        !data.sales.some((s) => s.id === d.saleId) ||
        d.balance > d.original,
    )
  )
    throw new Error("Clientes ou dívidas inválidos no backup.");
  data.customers = normalizeCustomers(data.customers);
  return { createdAt: String(value.payload.createdAt), data, photos };
}
export async function restoreBackup(preview: BackupPreview) {
  if (!canOperate(useStore.getState(), "backup"))
    throw new Error("Identifique o proprietário para restaurar.");
  const safety = await createBackup();
  const safetyId = await saveProductPhoto(safety);
  const oldSafety = localStorage.getItem("pdv-before-restore");
  try {
    localStorage.setItem("pdv-before-restore", safetyId);
  } catch (error) {
    await deleteProductPhoto(safetyId);
    throw error;
  }
  if (oldSafety?.startsWith("photo-")) void deleteProductPhoto(oldSafety).catch(() => undefined);
  const staged: string[] = [];
  const mapping = new Map<string, string>();
  try {
    for (const p of Object.values(preview.data.products)) {
      if (!p.photoId || mapping.has(p.photoId)) continue;
      const response = await fetch(preview.photos[p.photoId]!);
      const blob = await response.blob();
      const photoId = await saveProductPhoto(blob);
      staged.push(photoId);
      mapping.set(p.photoId, photoId);
    }
    const products = Object.fromEntries(
      Object.entries(preview.data.products).map(([code, p]) => [
        code,
        { ...p, ...(p.photoId ? { photoId: mapping.get(p.photoId) } : {}) },
      ]),
    ) as Record<string, Product>;
    useStore.getState().restoreData({ ...preview.data, products });
  } catch (error) {
    await Promise.all(staged.map((photoId) => deleteProductPhoto(photoId).catch(() => undefined)));
    throw error;
  }
}
