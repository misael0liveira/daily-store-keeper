import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
function store(seed) {
  const saved = new Map(seed ? [["pdv-mercado", JSON.stringify(seed)]] : []);
  globalThis.localStorage = {
    getItem: (k) => saved.get(k) ?? null,
    setItem: (k, v) => saved.set(k, v),
    removeItem: (k) => saved.delete(k),
  };
  globalThis.window = { localStorage };
  const source = readFileSync(new URL("../src/store/useStore.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const m = { exports: {} };
  new Function("require", "module", "exports", outputText)(require, m, m.exports);
  return { ...m.exports, saved };
}
function debts(useStore) {
  useStore.setState({
    customers: [{ id: "c", name: "Joana", creditEnabled: true, creditLimit: 200 }],
    receivables: [
      {
        id: "d1",
        saleId: "s1",
        customerId: "c",
        timestamp: 1,
        dueAt: "2026-10-01",
        original: 80,
        balance: 80,
        receipts: [],
      },
      {
        id: "d2",
        saleId: "s2",
        customerId: "c",
        timestamp: 2,
        dueAt: "2026-10-15",
        original: 50,
        balance: 50,
        receipts: [],
      },
    ],
  });
}
test("F17-H1 cadastro CPF e código estável, busca normalizada", () => {
  const { useStore, customerMatches } = store();
  let s = () => useStore.getState();
  s().upsertCustomer({
    id: "c",
    name: "Joána Silva",
    contact: "(12) 99999-0001",
    cpf: "529.982.247-25",
    creditEnabled: true,
  });
  let c = s().customers[0];
  assert.equal(c.cpf, "52998224725");
  assert.match(c.code, /^U-/);
  const code = c.code;
  assert(customerMatches(c, "joana"));
  assert(customerMatches(c, "12999990001"));
  assert(customerMatches(c, "529.982.247-25"));
  s().upsertCustomer({ ...c, name: "Joana Oliveira" });
  assert.equal(s().customers[0].code, code);
  assert.throws(() => s().upsertCustomer({ id: "x", name: "Outro", cpf: c.cpf }), /CPF/i);
  assert.throws(() => s().upsertCustomer({ id: "x", name: "Outro", cpf: "11111111111" }), /CPF/i);
});
test("F17-E1 migração e restauração preservam cliente antigo e relações", () => {
  const { useStore } = store({
    version: 7,
    state: {
      customers: [{ id: "c", name: "Antigo" }],
      receivables: [
        { id: "d", saleId: "s", customerId: "c", original: 80, balance: 50, receipts: [] },
      ],
      products: {},
      cart: [],
      sales: [],
    },
  });
  assert.equal(useStore.getState().customers[0].id, "c");
  assert.equal(useStore.getState().customers[0].creditEnabled, true);
  assert(useStore.getState().customers[0].code);
  const { useStore: other } = store();
  other.getState().restoreData({ customers: [{ id: "old", name: "Restaurado" }] });
  assert(other.getState().customers[0].code);
  assert.equal(other.getState().customers[0].creditEnabled, true);
});
test("F18-H1 compra100 entrada50 saldo80 resulta130 e estoque uma vez", () => {
  const { useStore } = store();
  let s = () => useStore.getState();
  debts(useStore);
  useStore.setState({ receivables: s().receivables.slice(0, 1) });
  s().upsertProduct({ barcode: "01", name: "Compra", price: 100, stock: 3 });
  s().addToCart("01");
  s().selectCustomer("c");
  const sale = s().checkout({
    method: "dinheiro",
    payments: [{ id: "p", method: "dinheiro", amount: 50, source: "manual", confirmedAt: 1 }],
    creditDueAt: "2026-10-15",
  });
  assert(sale);
  assert.equal(
    s().receivables.reduce((n, d) => n + d.balance, 0),
    130,
  );
  assert.equal(s().products["01"].stock, 2);
  assert.equal(s().sales.length, 1);
  assert.equal(s().checkout({ method: "dinheiro" }), null);
});
test("F18-N1 limite/habilitação/data impedem gravação sem perder carrinho", () => {
  const { useStore } = store();
  let s = () => useStore.getState();
  s().upsertCustomer({ id: "c", name: "Cliente", creditEnabled: true, creditLimit: 40 });
  s().upsertProduct({ barcode: "01", name: "Compra", price: 100, stock: 2 });
  s().addToCart("01");
  s().selectCustomer("c");
  assert.throws(
    () => s().checkout({ method: "dinheiro", payments: [], creditDueAt: "2026-10-15" }),
    /limite/i,
  );
  assert.equal(s().products["01"].stock, 2);
  s().upsertCustomer({ ...s().customers[0], creditLimit: 200, creditEnabled: false });
  assert.throws(
    () => s().checkout({ method: "dinheiro", payments: [], creditDueAt: "2026-10-15" }),
    /habilitado/i,
  );
  s().upsertCustomer({ ...s().customers[0], creditEnabled: true });
  assert.throws(
    () => s().checkout({ method: "dinheiro", payments: [], creditDueAt: "2026-02-31" }),
    /vencimento/i,
  );
});
test("F19-H1 receber grupo atomicamente sem nova venda/estoque, idempotente", () => {
  const { useStore } = store();
  debts(useStore);
  let s = () => useStore.getState();
  s().collectCustomerDebt("c", 100, "pix", "receipt");
  s().collectCustomerDebt("c", 100, "pix", "receipt");
  assert.deepEqual(
    s().receivables.map((d) => d.balance),
    [0, 30],
  );
  assert.equal(s().cashMovements.length, 1);
  assert.equal(s().cashMovements[0].amount, 100);
  assert.equal(s().sales.length, 0);
  assert.equal(s().receivables[0].original, 80);
});
test("F19-N1 excesso/permissão/dívida de outro cliente recusados", () => {
  const { useStore } = store();
  debts(useStore);
  let s = () => useStore.getState();
  assert.throws(() => s().collectCustomerDebt("c", 131, "dinheiro", "r"), /saldo/i);
  assert.deepEqual(
    s().receivables.map((d) => d.balance),
    [80, 50],
  );
  assert.throws(
    () => s().collectCustomerDebt("other", 10, "dinheiro", "r", "d1"),
    /cliente|dívida/i,
  );
  useStore.setState({ cashOpen: false });
  assert.throws(() => s().collectCustomerDebt("c", 10, "dinheiro", "r"), /caixa/i);
});
test("F19-E1 falha storage não deixa abatimento parcial", () => {
  const { useStore } = store();
  debts(useStore);
  localStorage.setItem = () => {
    throw Error("quota");
  };
  assert.throws(() => useStore.getState().collectCustomerDebt("c", 100, "dinheiro", "r"), /quota/);
  assert.deepEqual(
    useStore.getState().receivables.map((d) => d.balance),
    [80, 50],
  );
  assert.equal(useStore.getState().cashMovements.length, 0);
});
