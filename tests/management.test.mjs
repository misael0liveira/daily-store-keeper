import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function store() {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (k) => saved.get(k) ?? null,
    setItem: (k, v) => saved.set(k, v),
    removeItem: (k) => saved.delete(k),
  };
  globalThis.window = { localStorage: globalThis.localStorage };
  const source = readFileSync(new URL("../src/store/useStore.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(require, module, module.exports);
  return { ...module.exports, saved };
}
test("F06-N1: excess inventory cannot be sold or silently clamped", () => {
  const { useStore } = store();
  useStore.getState().upsertProduct({ barcode: "001", name: "Arroz", price: 10, stock: 2 });
  useStore.setState({ cart: [{ barcode: "001", qty: 3 }] });
  assert.throws(() => useStore.getState().checkout({ method: "dinheiro" }), /estoque/i);
  assert.equal(useStore.getState().products["001"].stock, 2);
  assert.equal(useStore.getState().sales.length, 0);
});
test("F07-H1: cancellation retains sale and restores stock once", () => {
  const { useStore } = store();
  useStore.getState().upsertProduct({ barcode: "001", name: "Arroz", price: 10, stock: 2 });
  useStore.getState().addToCart("001");
  const sale = useStore.getState().checkout({ method: "dinheiro" });
  useStore.getState().deleteSale(sale.id);
  assert.equal(useStore.getState().sales.length, 1);
  assert.equal(useStore.getState().sales[0].status, "cancelled");
  assert.equal(useStore.getState().products["001"].stock, 2);
  useStore.getState().deleteSale(sale.id);
  assert.equal(useStore.getState().products["001"].stock, 2);
});
test("F08-N1: closed drawer cannot finalize a sale", () => {
  const { useStore } = store();
  useStore.getState().upsertProduct({ barcode: "001", name: "Arroz", price: 10, stock: 2 });
  useStore.getState().addToCart("001");
  useStore.setState({ cashOpen: false });
  assert.throws(() => useStore.getState().checkout({ method: "dinheiro" }), /caixa/i);
  assert.equal(useStore.getState().sales.length, 0);
});
test("F09-H1: receiving packages records conversion, weighted cost, movements and deduplicates", () => {
  const { useStore } = store();
  const state = () => useStore.getState();
  state().upsertProduct({ barcode: "01", name: "Óleo", price: 10, stock: 12, cost: 2 });
  state().upsertSupplier({ id: "s1", name: "Fornecedor" });
  const payload = {
    id: "r1",
    supplierId: "s1",
    reference: "Nota 01",
    items: [
      {
        barcode: "01",
        packs: 2,
        unitsPerPack: 12,
        packCost: 48,
        lotName: "L1",
        expiresAt: "2099-01-01",
      },
    ],
  };
  state().receive(payload);
  state().receive(payload);
  assert.equal(state().products["01"].stock, 36);
  assert.equal(state().products["01"].cost, 3.3333);
  assert.equal(state().receivings.length, 1);
  assert.equal(state().lots[0].available, 24);
  assert.equal(state().movements.filter((m) => m.type === "receiving").length, 1);
});
test("F09-N1: invalid line rolls back complete receiving", () => {
  const { useStore } = store();
  const state = () => useStore.getState();
  state().upsertProduct({ barcode: "01", name: "Óleo", price: 10, stock: 2 });
  state().upsertSupplier({ id: "s1", name: "Fornecedor" });
  assert.throws(() =>
    state().receive({
      id: "r1",
      supplierId: "s1",
      reference: "",
      items: [
        { barcode: "01", packs: 1, unitsPerPack: 12, packCost: 36 },
        { barcode: "missing", packs: 1, unitsPerPack: 1, packCost: 1 },
      ],
    }),
  );
  assert.equal(state().products["01"].stock, 2);
  assert.equal(state().receivings.length, 0);
});
test("F10-H1: split payment snapshots survive reload and drawer counts only cash", () => {
  const { useStore, quoteCart, cashExpected } = store();
  const state = () => useStore.getState();
  state().upsertProduct({ barcode: "01", name: "Arroz", price: 100, stock: 2, cost: 60 });
  state().addToCart("01");
  const quote = quoteCart(state().products, state().cart);
  state().preparePayment(quote, "tx1");
  const cash = {
    id: "cash",
    method: "dinheiro",
    amount: 30,
    paidAmount: 50,
    change: 20,
    source: "manual",
    confirmedAt: Date.now(),
  };
  state().addPayment(cash, quote);
  state().addPayment(cash, quote);
  assert.equal(state().pendingPayments.length, 1);
  assert.equal(cashExpected(state(), state().cashSessions[0]), 30);
  assert.throws(() => state().changeQty("01", 1), /pagamento/i);
  assert.throws(() => state().checkout({ method: "dinheiro", quote }), /incompleto/i);
  assert.equal(state().sales.length, 0);
  state().addPayment(
    { id: "pix", method: "pix", amount: 70, source: "notification", confirmedAt: Date.now() },
    quote,
  );
  const sale = state().checkout({ method: "dinheiro", quote });
  assert.equal(sale.payments.length, 2);
  assert.equal(sale.items[0].cost, 60);
  assert.equal(cashExpected(state(), state().cashSessions[0]), 30);
  assert.equal(state().pendingPayments.length, 0);
});
test("F07-E1: partial return preserves original cost, restores exact units and prevents excess", () => {
  const { useStore, saleNet } = store();
  const state = () => useStore.getState();
  state().upsertProduct({ barcode: "01", name: "Arroz", price: 10, cost: 7, stock: 10 });
  state().addToCart("01");
  state().changeQty("01", 4);
  const sale = state().checkout({ method: "dinheiro" });
  state().upsertProduct({ ...state().products["01"], cost: 8 });
  const payload = {
    id: "return",
    saleId: sale.id,
    items: [{ barcode: "01", qty: 2 }],
    reason: "Cliente devolveu",
    restock: true,
    refundMethod: "dinheiro",
  };
  state().returnSale(payload);
  state().returnSale(payload);
  assert.equal(state().products["01"].stock, 7);
  assert.equal(saleNet(state().sales[0]), 30);
  assert.equal(state().returns[0].items[0].cost, 7);
  assert.equal(state().returns.length, 1);
  assert.throws(
    () => state().returnSale({ ...payload, id: "excess", items: [{ barcode: "01", qty: 4 }] }),
    /saldo vendido/i,
  );
  state().deleteSale(sale.id);
  assert.equal(state().products["01"].stock, 10);
  assert.equal(state().sales[0].status, "cancelled");
});
test("F08-H1: cash session closes with difference and keeps Pix expenses outside drawer", () => {
  const { useStore, cashExpected } = store();
  const state = () => useStore.getState();
  state().closeCash(0);
  state().openCash(100);
  state().recordCash("supply", 50, "Troco");
  state().recordCash("withdrawal", 20, "Banco");
  state().addExpense({ category: "Energia", description: "Conta", amount: 80, method: "pix" });
  state().addExpense({
    category: "Limpeza",
    description: "Material",
    amount: 10,
    method: "dinheiro",
  });
  assert.equal(cashExpected(state(), state().cashSessions[0]), 120);
  state().closeCash(115);
  assert.equal(state().cashSessions[0].difference, -5);
  assert.equal(state().cashOpen, false);
  assert.throws(() => state().recordCash("supply", 10, "Troco"), /caixa/i);
});
test("F11-H1: credit collections reduce debt without duplicating sales", () => {
  const { useStore, quoteCart, cashExpected } = store();
  const state = () => useStore.getState();
  state().upsertProduct({ barcode: "01", name: "Arroz", price: 100, stock: 2 });
  state().addToCart("01");
  state().upsertCustomer({ id: "c1", name: "Cliente", creditEnabled: true });
  state().selectCustomer("c1");
  const quote = quoteCart(state().products, state().cart);
  const sale = state().checkout({
    method: "dinheiro",
    quote,
    payments: [],
    creditDueAt: "2099-01-01",
  });
  assert.equal(sale.total, 100);
  const debt = state().receivables[0];
  state().collectDebt(debt.id, 40, "dinheiro", "receipt1");
  state().collectDebt(debt.id, 40, "dinheiro", "receipt1");
  assert.equal(state().receivables[0].balance, 60);
  assert.equal(state().sales.length, 1);
  assert.equal(cashExpected(state(), state().cashSessions[0]), 40);
  state().returnSale({
    id: "r",
    saleId: sale.id,
    items: [{ barcode: "01", qty: 1 }],
    reason: "Devolução",
    restock: true,
    refundMethod: "dinheiro",
    cancel: true,
  });
  assert.equal(state().receivables[0].balance, 0);
  assert.equal(state().returns[0].debtReduction, 60);
  assert.equal(cashExpected(state(), state().cashSessions[0]), 0);
});
test("F12-H1: stable identity preserves drafts and archive preserves history", () => {
  const { useStore } = store();
  const state = () => useStore.getState();
  state().upsertProduct({ barcode: "001", name: "Arroz", price: 10, stock: 5, photoId: "photo" });
  state().addToCart("001");
  state().suspendCart("Cliente 1");
  const pid = state().products["001"].id;
  state().upsertProduct({ ...state().products["001"], barcode: "002" });
  assert.equal(state().products["002"].id, pid);
  assert.equal(state().products["001"], undefined);
  state().resumeCart(state().drafts[0].id);
  assert.equal(state().cart[0].barcode, "002");
  state().checkout({ method: "dinheiro" });
  state().deleteProduct("002");
  assert.equal(state().products["002"].active, false);
  assert.equal(state().products["002"].photoId, "photo");
  assert.equal(state().sales.length, 1);
});
test("F13-H1: fractional sales and kits consume components once; expired lots block", () => {
  const { useStore, quoteCart } = store();
  const state = () => useStore.getState();
  state().upsertProduct({
    barcode: "kg",
    name: "Banana",
    price: 20,
    stock: 2,
    unit: "kg",
    cost: 10,
  });
  state().addToCart("kg");
  state().changeQty("kg", -0.65);
  const weighted = state().checkout({ method: "dinheiro" });
  assert.equal(weighted.total, 7);
  assert.equal(state().products.kg.stock, 1.65);
  state().upsertProduct({ barcode: "oil", name: "Óleo", price: 10, stock: 5, cost: 5 });
  state().upsertProduct({
    barcode: "kit",
    name: "Combo",
    price: 15,
    stock: 0,
    components: [{ productId: state().products.oil.id, qty: 2 }],
  });
  state().addToCart("kit");
  const kit = state().checkout({
    method: "dinheiro",
    quote: quoteCart(state().products, state().cart),
  });
  assert.equal(state().products.oil.stock, 3);
  assert.equal(kit.items[0].cost, 10);
  assert.equal(state().movements.filter((m) => m.documentId === kit.id).length, 1);
  state().upsertSupplier({ id: "s", name: "Fornecedor" });
  state().receive({
    id: "r",
    supplierId: "s",
    reference: "",
    items: [
      {
        barcode: "oil",
        packs: 1,
        unitsPerPack: 2,
        packCost: 10,
        lotName: "Vencido",
        expiresAt: "2000-01-01",
      },
    ],
  });
  state().addToCart("oil");
  state().changeQty("oil", 3);
  assert.throws(() => state().checkout({ method: "dinheiro" }), /vencidos/i);
  assert.equal(state().products.oil.stock, 5);
  state().adjustStock("oil", -2, "Descarte vencido", true);
  assert.equal(state().lots[0].available, 0);
});
test("F06-E1: external revision prevents overwriting another tab", () => {
  const { useStore, saved } = store();
  const state = () => useStore.getState();
  state().upsertProduct({ barcode: "001", name: "Arroz", price: 10, stock: 5 });
  const durable = JSON.parse(saved.get("pdv-mercado"));
  durable.state.revision++;
  durable.state.products["001"].stock = 8;
  saved.set("pdv-mercado", JSON.stringify(durable));
  assert.throws(
    () => state().upsertProduct({ ...state().products["001"], stock: 6 }),
    /outra aba/i,
  );
  assert.equal(JSON.parse(saved.get("pdv-mercado")).state.products["001"].stock, 8);
});
test("F06-E2: failed durable write rolls back complete receiving and inventory", () => {
  const { useStore } = store();
  const state = () => useStore.getState();
  state().upsertProduct({ barcode: "001", name: "Arroz", price: 10, stock: 5 });
  state().upsertSupplier({ id: "s", name: "Fornecedor" });
  const previous = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = () => {
    throw new Error("Quota");
  };
  assert.throws(
    () =>
      state().receive({
        id: "r",
        supplierId: "s",
        reference: "",
        items: [{ barcode: "001", packs: 1, unitsPerPack: 12, packCost: 60 }],
      }),
    /Quota/,
  );
  assert.equal(state().products["001"].stock, 5);
  assert.equal(state().receivings.length, 0);
  globalThis.localStorage.setItem = previous;
});

test("F07-E2: fractional returns use cumulative rounding and never over-refund", () => {
  const { useStore } = store();
  const state = () => useStore.getState();
  state().upsertProduct({ barcode: "kg", name: "Teste", price: 1, stock: 1, unit: "kg" });
  state().addToCart("kg");
  state().changeQty("kg", -0.985);
  const sale = state().checkout({ method: "dinheiro" });
  assert.equal(sale.total, 0.02);
  for (let n = 0; n < 3; n++)
    state().returnSale({
      id: `r${n}`,
      saleId: sale.id,
      items: [{ barcode: "kg", qty: 0.005 }],
      reason: "Devolução",
      restock: true,
      refundMethod: "dinheiro",
      refundVerified: true,
    });
  assert.equal(state().sales[0].refundedAmount, 0.02);
  assert.equal(state().products.kg.stock, 1);
  assert.equal(
    state().returns.reduce((total, r) => total + r.amount, 0),
    0.02,
  );
});
test("F10-E2: a full promotional discount still completes and consumes stock", () => {
  const { useStore } = store();
  const state = () => useStore.getState();
  state().upsertProduct({
    barcode: "free",
    name: "Brinde",
    price: 10,
    stock: 2,
    promotion: { mode: "stock", discountPercent: 100 },
  });
  state().addToCart("free");
  const sale = state().checkout({ method: "dinheiro" });
  assert.equal(sale.total, 0);
  assert.equal(state().products.free.stock, 1);
});
test("F11-N2: reserved codes and fractional unit components are rejected", () => {
  const { useStore } = store();
  const state = () => useStore.getState();
  assert.throws(
    () => state().upsertProduct({ barcode: "__proto__", name: "A", price: 1, stock: 1 }),
    /inválido/i,
  );
  state().upsertProduct({ barcode: "un", name: "A", price: 1, stock: 1 });
  assert.throws(
    () =>
      state().upsertProduct({
        barcode: "kit",
        name: "Combo",
        price: 2,
        stock: 0,
        components: [{ productId: state().products.un.id, qty: 0.5 }],
      }),
    /quantidade/i,
  );
});
