import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const { outputText } = ts.transpileModule(readFileSync("src/lib/cash-keypad.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const module = { exports: {} };
new Function("module", "exports", outputText)(module, module.exports);
const { editCashAmount: edit, cashAmount: amount } = module.exports;
test("cash accepts exact tender without typing and computes fractional change", () => {
  assert.equal(amount("", 4.24), 4.24);
  let raw = "";
  for (const key of ["5", ",", "0", "0"]) raw = edit(raw, key);
  assert.equal(amount(raw, 4.24), 5);
  assert.equal(Math.round((amount(raw, 4.24) - 4.24) * 100), 76);
});
test("keypad preserves cents, rejects extra decimals, and supports correction", () => {
  let raw = "";
  for (const key of [",", "5", "0", "0", ",", "-", "e"]) raw = edit(raw, key);
  assert.equal(raw, "0,50");
  raw = edit(raw, "backspace");
  assert.equal(edit(raw, "9"), "0,59");
  assert.equal(edit(raw, "clear"), "");
  assert.equal(edit("0", "5"), "5");
  assert.equal(edit("1234567", "8"), "1234567");
  assert.equal(amount("3,", 4.24), 3);
});
