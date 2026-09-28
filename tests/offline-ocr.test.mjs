import assert from "node:assert/strict";
import test from "node:test";
import { suggestProductFieldsFromText } from "../src/lib/offlineOcr.ts";

test("prefers the package weight over nutrition serving sizes", () => {
  assert.deepEqual(
    suggestProductFieldsFromText("BISCOITO INTEGRAL\nPorção 30 g\nPeso líquido 300 g"),
    { name: "BISCOITO INTEGRAL", packageSize: "300 g" },
  );
});

test("does not treat a nutrition serving size as package size", () => {
  assert.deepEqual(
    suggestProductFieldsFromText("INFORMAÇÃO NUTRICIONAL\nPorção 30 g\nValor energético 120 kcal"),
    {},
  );
});

test("normalizes decimal commas and common unit spellings", () => {
  assert.deepEqual(suggestProductFieldsFromText("LEITE INTEGRAL\nConteúdo 1,5 LT"), {
    name: "LEITE INTEGRAL",
    packageSize: "1.5 l",
  });
});
