import { useStore, type Product } from "@/store/useStore";
export const csvTemplate =
  "codigo;nome;preco;estoque;custo;categoria;minimo;unidade\n001;Arroz;10,00;20;7,00;Alimentos;5;un\n";
function splitCsv(raw: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const delimiter = raw.split(/\r?\n/)[0]?.includes(";") ? ";" : ",";
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (quoted && raw[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Aspas incompletas no CSV.");
  row.push(cell.replace(/\r$/, ""));
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
export function previewCsv(raw: string): {
  products: Product[];
  created: number;
  updated: number;
  errors: string[];
} {
  if (raw.length > 5 * 1024 * 1024) throw new Error("CSV maior que 5 MB.");
  const rows = splitCsv(raw.replace(/^\uFEFF/, ""));
  const headers = rows.shift()?.map((h) => h.trim().toLowerCase()) ?? [];
  if (!["codigo", "nome", "preco"].every((h) => headers.includes(h)))
    throw new Error("Use as colunas codigo, nome e preco do modelo.");
  const state = useStore.getState();
  const products: Product[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  let created = 0,
    updated = 0;
  for (const [index, row] of rows.entries()) {
    const fields = Object.fromEntries(headers.map((h, i) => [h, row[i]?.trim() ?? ""]));
    const barcode = fields["codigo"] ?? "";
    const old = state.products[barcode];
    const parse = (key: string, fallback?: number) =>
      fields[key] ? Number(fields[key]!.replace(",", ".")) : fallback;
    const price = parse("preco", old?.price);
    const stock = parse("estoque", old?.stock ?? 0);
    const cost = parse("custo", old?.cost);
    const minimumStock = parse("minimo", old?.minimumStock ?? 5);
    const unit = fields["unidade"] || old?.unit || "un";
    const name = fields["nome"] || old?.name || "";
    if (
      !barcode ||
      ["__proto__", "prototype", "constructor"].includes(barcode) ||
      seen.has(barcode) ||
      !name ||
      price === undefined ||
      !Number.isFinite(price) ||
      price <= 0 ||
      stock === undefined ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      !Number.isFinite(minimumStock) ||
      minimumStock! < 0 ||
      (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) ||
      !["un", "kg", "l"].includes(unit) ||
      (unit === "un" && !Number.isInteger(stock))
    ) {
      errors.push(`Linha ${index + 2}: confira código, nome, valores e duplicação.`);
      continue;
    }
    seen.add(barcode);
    products.push({
      ...old,
      barcode,
      name,
      price,
      stock,
      cost,
      minimumStock,
      unit: unit as Product["unit"],
      category: fields["categoria"] || old?.category,
    });
    if (old) updated++;
    else created++;
  }
  if (!rows.length) errors.push("CSV sem produtos.");
  return { products, created, updated, errors };
}
export function exportProductsCsv() {
  const escape = (v: unknown) => {
    let text = String(v ?? "");
    if (/^[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const state = useStore.getState();
  return (
    "\uFEFFcodigo;nome;preco;estoque;custo;categoria;minimo;unidade\n" +
    Object.values(state.products)
      .map((p) =>
        [
          p.barcode,
          p.name,
          p.price,
          p.stock,
          p.cost,
          p.category,
          p.minimumStock ?? 5,
          p.unit ?? "un",
        ]
          .map(escape)
          .join(";"),
      )
      .join("\n")
  );
}
