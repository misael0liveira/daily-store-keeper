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

const { configureScannerFocus } = loadTs("../src/lib/scannerCamera.ts");

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
