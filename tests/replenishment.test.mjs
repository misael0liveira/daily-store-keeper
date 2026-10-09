import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(path) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const m = { exports: {} };
  new Function("require", "module", "exports", outputText)(require, m, m.exports);
  return m.exports;
}
const now = Date.UTC(2026, 9, 9, 9);
const p = { id: "p", barcode: "123", name: "Arroz", stock: 20, price: 1 };
const settings = { wholesaleCycleDays: 7, stockSafetyDays: 2 };
const sale = (qty = 300, extra = {}) => ({
  id: "s",
  timestamp: now - 1000,
  items: [{ productId: "p", barcode: "123", qty, name: "Arroz", price: 1 }],
  total: qty,
  method: "dinheiro",
  ...extra,
});
function calculate(products = { 123: p }, sales = [sale()], opts = settings) {
  return load("../src/lib/stockReplenishment.ts").calculateReplenishment(
    products,
    sales,
    opts,
    now,
  );
}
test("F20-H1 fórmula300/30, limite inclusivo, compra70, saldo21 fora", () => {
  const m = calculate().get("123");
  assert.equal(m.dailyAverage, 10);
  assert.equal(m.minimum, 20);
  assert.equal(m.target, 90);
  assert.equal(m.purchase, 70);
  assert(m.low);
  assert(!calculate({ 123: { ...p, stock: 21 } }).get("123").low);
});
test("F20-E1 somente janela720h inclusive, sem futuro/cancelamento", () => {
  const sales = [
    sale(30, { timestamp: now - 30 * 86400000 }),
    sale(300, { timestamp: now - 30 * 86400000 - 1 }),
    sale(300, { timestamp: now + 1 }),
    sale(300, { status: "cancelled" }),
    sale(30, { timestamp: now }),
  ];
  assert.equal(calculate(undefined, sales).get("123").sold30, 60);
});
test("F20-E2 devolução uma vez e compra fracionada arredondada acima", () => {
  const s = sale();
  s.items[0].returnedQty = 60;
  assert.equal(calculate(undefined, [s]).get("123").sold30, 240);
  assert.equal(calculate({ 123: { ...p, stock: 0 } }, [sale(1)]).get("123").purchase, 1);
  assert.equal(
    calculate({ 123: { ...p, stock: 0, unit: "kg" } }, [sale(0.01)]).get("123").purchase,
    0.003,
  );
  const exact = calculate({ 123: { ...p, stock: 0 } }, [sale(10)], {
    wholesaleCycleDays: 1,
    stockSafetyDays: 2,
  }).get("123");
  assert.equal(exact.purchase, 1);
});
test("F20-E3 zero giro, exclusão serviços/combos/arquivados", () => {
  assert.equal(calculate(undefined, []).get("123").minimum, 0);
  assert(!calculate(undefined, []).get("123").low);
  const m = calculate({ 123: { ...p, stock: 0 } }, []).get("123");
  assert(m.low);
  assert.equal(m.purchase, 0);
  for (const extra of [
    { active: false },
    { stockControlled: false },
    { components: [{ productId: "x", qty: 1 }] },
  ])
    assert.equal(calculate({ 123: { ...p, ...extra } }).size, 0);
});
test("F20-E4 ID prevalece ao mudar/reutilizar código e legado semID", () => {
  assert.equal(calculate({ 789: { ...p, barcode: "789" } }).get("789").sold30, 300);
  assert.equal(calculate({ 123: { ...p, id: "new" } }).get("123").sold30, 0);
  const s = sale();
  delete s.items[0].productId;
  assert.equal(calculate(undefined, [s]).get("123").sold30, 300);
});
test("F20-E5 combo usa snapshot e consumo líquido do componente", () => {
  const s = sale(10);
  s.items = [
    {
      productId: "kit",
      barcode: "kit",
      qty: 10,
      returnedQty: 2,
      price: 2,
      name: "Kit",
      components: [{ productId: "p", qty: 2 }],
    },
  ];
  assert.equal(calculate(undefined, [s]).get("123").sold30, 16);
});
test("F20-E6 migração8→9 e restauração preservam dados e defaults", () => {
  const saved = new Map([
    [
      "pdv-mercado",
      JSON.stringify({
        version: 8,
        state: {
          products: { 123: p },
          cart: [],
          sales: [sale()],
          settings: { storeName: "Loja", pixKey: "", merchantName: "", city: "" },
          revision: 0,
        },
      }),
    ],
  ]);
  globalThis.localStorage = {
    getItem: (k) => saved.get(k) ?? null,
    setItem: (k, v) => saved.set(k, v),
    removeItem: (k) => saved.delete(k),
  };
  globalThis.window = { localStorage };
  const { useStore } = load("../src/store/useStore.ts");
  let s = () => useStore.getState();
  assert.equal(s().settings.wholesaleCycleDays, 7);
  assert.equal(s().settings.stockSafetyDays, 2);
  assert.equal(s().sales.length, 1);
  assert.equal(s().products["123"].stock, 20);
  s().setSettings({ wholesaleCycleDays: 4, stockSafetyDays: 0 });
  assert.equal(s().settings.wholesaleCycleDays, 4);
  for (const value of [-1, 0, 1.5, 366, NaN, Infinity])
    assert.throws(() => s().setSettings({ wholesaleCycleDays: value }));
  for (const value of [-1, 1.5, 366, NaN, Infinity])
    assert.throws(() => s().setSettings({ stockSafetyDays: value }));
  s().restoreData({ settings: { storeName: "Antigo", pixKey: "", merchantName: "", city: "" } });
  assert.equal(s().settings.wholesaleCycleDays, 7);
  assert.equal(s().settings.stockSafetyDays, 2);
});
test("F20-P1 10mil vendas/2mil produtos, sem mutação, <200ms", () => {
  const products = Object.fromEntries(
    Array.from({ length: 2000 }, (_, i) => [String(i), { ...p, id: "p" + i, barcode: String(i) }]),
  );
  const sales = Array.from({ length: 10000 }, (_, i) => ({
    ...sale(),
    items: [{ ...sale().items[0], productId: "p" + (i % 2000), barcode: String(i % 2000) }],
  }));
  const { calculateReplenishment } = load("../src/lib/stockReplenishment.ts");
  const start = performance.now();
  const result = calculateReplenishment(products, sales, settings, now);
  const ms = performance.now() - start;
  assert.equal(result.size, 2000);
  assert.equal(result.get("0").sold30, 1500);
  assert.equal(products["0"].stock, 20);
  assert(ms < 200, `${ms}ms`);
  console.log(`Reposição10k/2k: ${ms.toFixed(2)}ms em Node ${process.version}/${process.platform}`);
});
