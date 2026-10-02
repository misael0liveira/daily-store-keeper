import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadTs(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(require, module, module.exports);
  return module.exports;
}

test("two identical offline purchases are persisted and each reduces stock", () => {
  const saved = new Map();
  const oldWindow = globalThis.window;
  const oldStorage = globalThis.localStorage;
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const oldNow = Date.now;
  try {
    globalThis.localStorage = {
      getItem: (key) => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
      removeItem: (key) => saved.delete(key),
    };
    globalThis.window = { localStorage: globalThis.localStorage };
    Object.defineProperty(globalThis, "navigator", {
      value: { onLine: false },
      configurable: true,
    });
    Date.now = () => 1800000000000;
    const { useStore } = loadTs("../src/store/useStore.ts");
    useStore.getState().upsertProduct({ barcode: "123", name: "Arroz", price: 20, stock: 10 });
    useStore.getState().addToCart("123");
    const first = useStore.getState().checkout({ method: "dinheiro", paidAmount: 20 });
    assert.equal(useStore.getState().checkout({ method: "dinheiro" }), null);
    useStore.getState().addToCart("123");
    const second = useStore.getState().checkout({ method: "dinheiro", paidAmount: 20 });
    assert.notEqual(first.id, second.id);
    assert.equal(first.offline, true);
    assert.equal(second.offline, true);
    assert.equal(useStore.getState().sales.length, 2);
    assert.equal(useStore.getState().products["123"].stock, 8);
    const persisted = JSON.parse(saved.get("pdv-mercado")).state;
    assert.equal(persisted.sales.length, 2);
    assert.equal(persisted.products["123"].stock, 8);
    assert.deepEqual(persisted.cart, []);
  } finally {
    Date.now = oldNow;
    globalThis.window = oldWindow;
    globalThis.localStorage = oldStorage;
    if (oldNavigator) Object.defineProperty(globalThis, "navigator", oldNavigator);
    else delete globalThis.navigator;
  }
});

const { closeScannerAfterStart } = loadTs("../src/lib/scannerLifecycle.ts");

test("closing during camera acquisition waits and then releases the camera", async () => {
  let finishStart;
  const starting = new Promise((resolve) => {
    finishStart = resolve;
  });
  const events = [];
  const scanner = {
    isScanning: false,
    async stop() {
      events.push("stop");
      this.isScanning = false;
    },
    clear() {
      events.push("clear");
    },
  };
  const closing = closeScannerAfterStart(scanner, starting, () => events.push("tracks"));
  await Promise.resolve();
  assert.deepEqual(events, []);
  scanner.isScanning = true;
  finishStart();
  await closing;
  assert.deepEqual(events, ["stop", "tracks", "clear"]);
});

test("a failed start still releases partial camera resources", async () => {
  const events = [];
  await closeScannerAfterStart(
    {
      isScanning: false,
      async stop() {
        events.push("stop");
      },
      clear() {
        events.push("clear");
      },
    },
    Promise.reject(new Error("permission denied")),
    () => events.push("tracks"),
  );
  assert.deepEqual(events, ["tracks", "clear"]);
});

test("a stop failure still releases video tracks and tolerates removed DOM", async () => {
  let tracksReleased = false;
  await closeScannerAfterStart(
    {
      isScanning: true,
      async stop() {
        throw new Error("removed DOM");
      },
      clear() {
        throw new Error("removed DOM");
      },
    },
    Promise.resolve(),
    () => {
      tracksReleased = true;
    },
  );
  assert.equal(tracksReleased, true);
});

test("Android detection works with an https WebView and remains false for web/SSR", () => {
  const previous = globalThis.window;
  try {
    const { isNativeApp } = loadTs("../src/lib/platform.ts");
    globalThis.window = {
      location: { protocol: "https:" },
      Capacitor: { isNativePlatform: () => true },
    };
    assert.equal(isNativeApp(), true);
    globalThis.window = { location: { protocol: "https:" } };
    assert.equal(isNativeApp(), false);
    delete globalThis.window;
    assert.equal(isNativeApp(), false);
  } finally {
    globalThis.window = previous;
  }
});
