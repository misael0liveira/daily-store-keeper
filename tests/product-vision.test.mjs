import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/lib/productVisionResult.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } });
const { parseProductVisionResult: parse } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('accepts package text and preserves Portuguese/decimal units', () => {
  assert.deepEqual(parse('```json\n{"name":"Café torrado", "brand":"União", "packageSize":"0,5 kg"}\n```'), { name:'Café torrado', brand:'União', packageSize:'0,5 kg' });
});
test('does not fill unreadable fields or accept unrelated stock/price output', () => {
  assert.deepEqual(parse('{"name":"Arroz", "brand":null,"packageSize":"ilegível", "price":20,"stock":100}'), {name:'Arroz',brand:null,packageSize:null});
});
test('rejects prose, truncated JSON and responses without product information', () => {
  for (const value of ['Isso parece comida', '{"name":"Arroz"', '[]', 'null', '{"name":null,"brand":"unknown","packageSize":"3% VD"}']) {
    assert.throws(() => parse(value));
  }
});
test('does not coerce arrays or objects into names', () => {
  assert.throws(() => parse('{"name":{"x":"inventado"},"brand":["marca"],"packageSize":500}'));
});
test('keeps multipack size and discards nutritional portion prose', () => {
  assert.equal(parse('{"name":"Leite", "packageSize":"6 x 200 ml"}').packageSize, '6 x 200 ml');
  assert.equal(parse('{"name":"Leite", "packageSize":"porção 30 g"}').packageSize, null);
});
