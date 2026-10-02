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

const { productImageSearchUrl, prepareProductPhoto } = loadTs("../src/lib/productPhotos.ts");
test("image search uses barcode and package text without a catalogue API", () => {
  const url = new URL(
    productImageSearchUrl({
      barcode: " 789123 ",
      name: "Açúcar & café",
      brand: "União",
      packageSize: "1 kg",
    }),
  );
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.searchParams.get("tbm"), "isch");
  assert.equal(url.searchParams.get("q"), "789123 Açúcar & café União 1 kg");
});
test("empty identifiers do not create a meaningless search", () => {
  assert.equal(productImageSearchUrl({ barcode: " ", name: "", brand: "", packageSize: "" }), null);
});
test("unsupported photos and large files fail before decoding", async () => {
  await assert.rejects(
    prepareProductPhoto(new Blob(["abc"], { type: "image/svg+xml" })),
    /JPG, PNG ou WebP/,
  );
  await assert.rejects(
    prepareProductPhoto(new Blob([new Uint8Array(13 * 1024 * 1024)], { type: "image/png" })),
    /12 MB/,
  );
});
