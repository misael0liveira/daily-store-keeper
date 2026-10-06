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

const { createPixTxid, buildPixPayload } = loadTs("../src/lib/pix.ts");
const pixParams = {
  key: "123e4567-e12b-12d1-a456-426655440000",
  merchantName: "Fulano de Tal",
  city: "BRASILIA",
};

function readFields(payload) {
  const fields = {};
  for (let offset = 0; offset < payload.length;) {
    const id = payload.slice(offset, offset + 2);
    const length = Number(payload.slice(offset + 2, offset + 4));
    assert.ok(Number.isInteger(length) && length > 0, "Invalid Pix field length");
    fields[id] = payload.slice(offset + 4, offset + 4 + length);
    assert.equal(fields[id].length, length, "Truncated Pix field");
    offset += 4 + length;
  }
  return fields;
}

test("same-value Pix checkouts have distinct valid references and stable payloads", () => {
  const previousNow = Date.now;
  Date.now = () => 1800000000000;
  try {
    const ids = Array.from({ length: 1000 }, createPixTxid);
    assert.equal(new Set(ids).size, ids.length);
    for (const txid of ids) assert.match(txid, /^[A-Za-z0-9]{25}$/);
    const first = buildPixPayload({ ...pixParams, amount: 20, txid: ids[0] });
    const second = buildPixPayload({ ...pixParams, amount: 20, txid: ids[1] });
    assert.notEqual(first, second);
    assert.equal(first, buildPixPayload({ ...pixParams, amount: 20, txid: ids[0] }));
    for (const [payload, txid] of [
      [first, ids[0]],
      [second, ids[1]],
    ]) {
      const fields = readFields(payload);
      assert.equal(fields["54"], "20.00");
      assert.equal(readFields(fields["62"])["05"], txid);
      assert.match(fields["63"], /^[0-9A-F]{4}$/);
    }
  } finally {
    Date.now = previousNow;
  }
});

test("Pix generic preview preserves the BCB reference checksum and rejects invalid txids", () => {
  const reference = buildPixPayload(pixParams);
  assert.ok(reference.endsWith("63041D3D"));
  assert.equal(readFields(readFields(reference)["62"])["05"], "***");
  for (const txid of ["", "sale 1", "sale-1", "a".repeat(26)]) {
    assert.throws(() => buildPixPayload({ ...pixParams, txid }), /identificador Pix/);
  }
});

const { configureScannerFocus, scannerCameraErrorMessage } = loadTs("../src/lib/scannerCamera.ts");

test("scanner enables continuous focus only on supported cameras", async () => {
  const applied = [];
  const scanner = {
    getRunningTrackCapabilities: () => ({ focusMode: ["manual", "continuous"] }),
    applyVideoConstraints: async (constraints) => {
      applied.push(constraints);
    },
  };
  assert.equal(await configureScannerFocus(scanner), true);
  assert.deepEqual(applied, [{ advanced: [{ focusMode: "continuous" }] }]);
});

test("unsupported or rejected focus controls never prevent camera scanning", async () => {
  for (const capabilities of [{}, { focusMode: ["manual"] }]) {
    assert.equal(
      await configureScannerFocus({
        getRunningTrackCapabilities: () => capabilities,
        applyVideoConstraints: async () => {
          assert.fail("Unsupported focus was applied");
        },
      }),
      false,
    );
  }
  assert.equal(
    await configureScannerFocus({
      getRunningTrackCapabilities: () => ({ focusMode: ["continuous"] }),
      applyVideoConstraints: async () => {
        throw new Error("Camera control unavailable");
      },
    }),
    false,
  );
  assert.equal(
    await configureScannerFocus({
      getRunningTrackCapabilities: () => {
        throw new Error("Capabilities unavailable");
      },
      applyVideoConstraints: async () => {
        assert.fail("Capabilities unavailable");
      },
    }),
    false,
  );
});

test("camera permission errors remain recognizable when the reader wraps them as text", () => {
  for (const error of [
    { name: "NotAllowedError", message: "Permission denied" },
    "Error getting userMedia, error = NotAllowedError: Permission denied",
    "PermissionDeniedError",
  ]) {
    assert.match(scannerCameraErrorMessage(error), /Permissão da câmera negada/);
  }
  assert.match(scannerCameraErrorMessage(new Error("Device not found")), /Não foi possível abrir/);
});

function withLocalStore(run) {
  const saved = new Map();
  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;
  const storage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: (key) => saved.delete(key),
  };
  globalThis.localStorage = storage;
  globalThis.window = { localStorage: storage };
  try {
    run(loadTs("../src/store/useStore.ts"), saved, storage);
  } finally {
    globalThis.window = previousWindow;
    globalThis.localStorage = previousStorage;
  }
}

test("dated promotions respect inclusive start, exclusive end, future scheduling and cents", () => {
  const { getProductPricing, saleItemsTotal } = loadTs("../src/store/useStore.ts");
  const product = {
    barcode: "01",
    name: "Arroz",
    price: 19.9,
    stock: 8,
    promotion: { mode: "period", discountPercent: 15, startsAt: 1000, endsAt: 2000 },
  };
  assert.equal(getProductPricing(product, 999).price, 19.9);
  assert.equal(getProductPricing(product, 1000).price, 16.92);
  assert.equal(getProductPricing(product, 1999).active, true);
  assert.equal(getProductPricing(product, 2000).price, 19.9);
  assert.equal(
    saleItemsTotal([
      { price: 0.1, qty: 3 },
      { price: 0.2, qty: 1 },
    ]),
    0.5,
  );
});

test("discounted quote, payment and history agree even if a dated promotion expires during payment", () => {
  withLocalStore(({ useStore, quoteCart, saleItemsTotal }, saved) => {
    const oldNow = Date.now;
    try {
      Date.now = () => 1000;
      const state = () => useStore.getState();
      state().upsertProduct({
        barcode: "01",
        name: "Arroz",
        price: 20,
        stock: 10,
        photoId: "existing-photo",
      });
      state().applyPromotions([
        {
          barcode: "01",
          price: 20,
          promotion: { mode: "period", discountPercent: 25, startsAt: 500, endsAt: 2000 },
        },
      ]);
      state().addToCart("01");
      state().changeQty("01", 1);
      const quote = quoteCart(state().products, state().cart);
      assert.equal(saleItemsTotal(quote), 30);
      Date.now = () => 2500;
      const sale = state().checkout({ method: "pix", pixTxid: "REFERENCE", quote });
      assert.equal(sale.total, 30);
      assert.equal(sale.items[0].originalPrice, 20);
      assert.equal(sale.items[0].discountPercent, 25);
      assert.equal(sale.items[0].price, 15);
      assert.equal(state().products["01"].stock, 8);
      assert.equal(state().products["01"].photoId, "existing-photo");
      assert.equal(JSON.parse(saved.get("pdv-mercado")).state.sales[0].total, 30);
      assert.equal(
        loadTs("../src/store/useStore.ts").useStore.getState().products["01"].photoId,
        "existing-photo",
      );
    } finally {
      Date.now = oldNow;
    }
  });
});

test("stock-limited promotions finish on depletion and do not return after replenishment", () => {
  withLocalStore(({ useStore, getProductPricing }) => {
    const state = () => useStore.getState();
    state().upsertProduct({ barcode: "01", name: "Arroz", price: 20, stock: 1 });
    state().applyPromotions([
      { barcode: "01", price: 20, promotion: { mode: "stock", discountPercent: 10 } },
    ]);
    assert.equal(getProductPricing(state().products["01"]).price, 18);
    state().addToCart("01");
    assert.equal(state().checkout({ method: "dinheiro" }).total, 18);
    assert.equal(state().products["01"].stock, 0);
    assert.equal(state().products["01"].promotion, undefined);
    state().upsertProduct({ ...state().products["01"], stock: 5 });
    assert.equal(getProductPricing(state().products["01"]).price, 20);
  });
});

test("multiple promotions validate atomically, preserve photos, and rollback on storage failure", () => {
  withLocalStore(({ useStore }, saved, storage) => {
    const state = () => useStore.getState();
    for (const barcode of ["01", "02"])
      state().upsertProduct({
        barcode,
        name: barcode,
        price: 20,
        stock: 5,
        photoId: `photo-${barcode}`,
      });
    const first = { barcode: "01", price: 20, promotion: { mode: "stock", discountPercent: 10 } };
    const second = { barcode: "02", price: 20, promotion: { mode: "stock", discountPercent: 101 } };
    assert.throws(() => state().applyPromotions([first, second]), /desconto/);
    assert.equal(state().products["01"].promotion, undefined);
    second.promotion.discountPercent = 20;
    const durableBefore = saved.get("pdv-mercado");
    const originalSet = storage.setItem;
    storage.setItem = () => {
      throw new Error("quota");
    };
    assert.throws(() => state().applyPromotions([first, second]), /quota/);
    assert.equal(state().products["01"].promotion, undefined);
    assert.equal(saved.get("pdv-mercado"), durableBefore);
    storage.setItem = originalSet;
    state().applyPromotions([first, second]);
    assert.equal(state().products["02"].promotion.discountPercent, 20);
    assert.equal(state().products["01"].photoId, "photo-01");
    state().removePromotion("01");
    assert.equal(state().products["01"].promotion, undefined);
  });
});

const { whitenUniformBackground } = loadTs("../src/lib/productPhotos.ts");
test("local white background treatment preserves the central product and enclosed details", () => {
  const pixels = new Uint8ClampedArray(5 * 5 * 4);
  for (let i = 0; i < 25; i++) pixels.set([210, 210, 210, 255], i * 4);
  for (const i of [6, 7, 8, 11, 13, 16, 17, 18]) pixels.set([180, 20, 20, 255], i * 4);
  assert.equal(whitenUniformBackground(pixels, 5, 5), true);
  assert.deepEqual(Array.from(pixels.slice(0, 4)), [255, 255, 255, 255]);
  assert.deepEqual(Array.from(pixels.slice(6 * 4, 7 * 4)), [180, 20, 20, 255]);
  assert.deepEqual(Array.from(pixels.slice(12 * 4, 13 * 4)), [210, 210, 210, 255]);
});
test("varied backgrounds are preserved instead of erasing the product", () => {
  const pixels = new Uint8ClampedArray([
    255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
  ]);
  const original = pixels.slice();
  assert.equal(whitenUniformBackground(pixels, 2, 2), false);
  assert.deepEqual(pixels, original);
});
