const assert = require("node:assert/strict");
const { scan, seed, watchErrors } = require("./palette-support.cjs");
async function seedReplenishment(context, theme) {
  await seed(context, theme);
  await context.addInitScript(() => {
    if (localStorage.getItem("replenishment-seeded")) return;
    localStorage.setItem("replenishment-seeded", "yes");
    const saved = JSON.parse(localStorage.getItem("pdv-mercado"));
    saved.version = 8;
    saved.state.products = {
      123: { id: "rice", barcode: "123", name: "Arroz São João", price: 1, stock: 20 },
      456: { id: "beans", barcode: "456", name: "Feijão", price: 1, stock: 21 },
      789: { id: "zero", barcode: "789", name: "Produto sem vendas", price: 1, stock: 0 },
      svc: {
        id: "svc",
        barcode: "svc",
        name: "Serviço",
        price: 1,
        stock: 0,
        stockControlled: false,
      },
    };
    saved.state.sales = [
      {
        id: "s1",
        timestamp: Date.now() - 86400000,
        total: 600,
        method: "dinheiro",
        items: [
          { productId: "rice", barcode: "123", name: "Arroz São João", qty: 300, price: 1 },
          { productId: "beans", barcode: "456", name: "Feijão", qty: 300, price: 1 },
        ],
      },
    ];
    localStorage.setItem("pdv-mercado", JSON.stringify(saved));
  });
}
const read = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
async function geometry(page, label) {
  await page.goto("http://127.0.0.1:4173/vender", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Selecionar cliente", exact: true });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Selecionar cliente", exact: true });
  const close = sheet.getByRole("button", { name: "Fechar", exact: true });
  const box = await close.evaluate((el) => {
    const b = el.getBoundingClientRect(),
      s = el.querySelector("svg").getBoundingClientRect();
    return {
      width: b.width,
      height: b.height,
      radius: parseFloat(getComputedStyle(el).borderRadius),
      dx: Math.abs(b.x + b.width / 2 - s.x - s.width / 2),
      dy: Math.abs(b.y + b.height / 2 - s.y - s.height / 2),
    };
  });
  assert.equal(box.width, 44);
  assert.equal(box.height, 44);
  assert(box.radius >= 22);
  assert(box.dx <= 1 && box.dy <= 1, JSON.stringify(box));
  await scan(page, `${label} selecionar cliente`);
  await page.screenshot({
    path: `navigation-screenshots/replenishment-${label}-cliente.png`,
    fullPage: true,
  });
  const before = await read(page);
  await close.click();
  await sheet.waitFor({ state: "hidden" });
  assert(await trigger.evaluate((el) => el === document.activeElement));
  const after = await read(page);
  assert.deepEqual(after.cart, before.cart);
  assert.equal(after.currentCustomerId, before.currentCustomerId);
  await trigger.click();
  await page.keyboard.press("Escape");
  await sheet.waitFor({ state: "hidden" });
  return 3;
}
async function stock(page, context, label, full) {
  let cases = 0;
  await page.goto("http://127.0.0.1:4173/estoque", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Estoque baixo", exact: true }).click();
  await page.getByText("Sugestão de compra: 70 unidades", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: /Feijão.*R\$/ }).count(), 0);
  await page.getByText(/Sem vendas nos últimos 30 dias; confira/).waitFor();
  await scan(page, `${label} baixo`);
  cases += 3;
  await page.getByRole("textbox", { name: "Buscar no estoque" }).fill("São João");
  await page.getByRole("button", { name: "Exportar lista", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Exportar lista de compras" });
  const text = await dialog.getByLabel("Texto da lista de compras").inputValue();
  assert(text.includes("Arroz São João"));
  assert(!text.includes("Feijão"));
  assert(!text.includes("Produto sem vendas"));
  assert(text.includes("Comprar: 70 unidades"));
  cases++;
  if (full) {
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.copiedList = text;
          },
        },
      }),
    );
    await dialog.getByRole("button", { name: "Copiar lista", exact: true }).click();
    await page.getByText("Lista copiada", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.copiedList), text);
    cases++;
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw Error("Denied");
          },
        },
      }),
    );
    await dialog.getByRole("button", { name: "Copiar lista", exact: true }).click();
    await page
      .getByText("Selecione o texto e copie pelo menu do aparelho.", { exact: true })
      .waitFor();
    assert.equal(await dialog.getByLabel("Texto da lista de compras").inputValue(), text);
    cases++;
    const downloadPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Baixar PDF", exact: true }).click();
    const download = await downloadPromise;
    await download.saveAs("navigation-screenshots/replenishment-list.pdf");
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    assert.equal(Buffer.concat(chunks).subarray(0, 5).toString(), "%PDF-");
    cases++;
  }
  await scan(page, `${label} exportar`);
  await page.screenshot({
    path: `navigation-screenshots/replenishment-${label}-exportar.png`,
    fullPage: true,
  });
  cases++;
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Limpar busca", exact: true }).click();
  await page.getByText("Configurar reposição", { exact: true }).click();
  await page.getByLabel("Ciclo de ida ao atacado (dias)", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Salvar dias de reposição", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Ciclo do atacado: informe dias inteiros" })
    .waitFor();
  assert.equal((await read(page)).settings.wholesaleCycleDays, 7);
  assert.equal(
    await page
      .getByLabel("Ciclo de ida ao atacado (dias)", { exact: true })
      .getAttribute("aria-invalid"),
    "true",
  );
  cases++;
  await page.getByLabel("Ciclo de ida ao atacado (dias)", { exact: true }).fill("4");
  await page.getByRole("button", { name: "Salvar dias de reposição", exact: true }).click();
  await page.getByText("Sugestão de compra: 40 unidades", { exact: true }).waitFor();
  assert.equal((await read(page)).settings.wholesaleCycleDays, 4);
  cases++;
  await scan(page, `${label} configuração`);
  await page.getByRole("textbox", { name: "Buscar no estoque" }).fill("inexistente");
  assert(await page.getByRole("button", { name: "Exportar lista", exact: true }).isDisabled());
  cases++;
  await page.getByRole("button", { name: "Limpar busca", exact: true }).click();
  await context.setOffline(true);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Estoque baixo", exact: true }).click();
  await page.getByText("Sugestão de compra: 40 unidades", { exact: true }).waitFor();
  assert.equal((await read(page)).settings.wholesaleCycleDays, 4);
  await scan(page, `${label} offline`);
  cases++;
  await page.screenshot({
    path: `navigation-screenshots/replenishment-${label}-estoque.png`,
    fullPage: true,
  });
  await context.setOffline(false);
  return cases;
}
async function backup(page) {
  await page.goto("http://127.0.0.1:4173/gestao?sec=dados", { waitUntil: "networkidle" });
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar backup com fotos", exact: true }).click();
  const download = await promise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  const saved = JSON.parse(Buffer.concat(chunks));
  assert.equal(saved.payload.data.settings.wholesaleCycleDays, 4);
  assert.equal(saved.payload.data.settings.stockSafetyDays, 2);
  const input = page.getByLabel("Escolher backup para conferir (até 50 MB)", { exact: false });
  async function restore(saved) {
    await page.getByRole("alertdialog").waitFor({ state: "hidden" });
    await input.setInputFiles({
      name: "reposicao.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(saved)),
    });
    await page.getByRole("heading", { name: "Prévia da restauração", exact: true }).waitFor();
    await page.getByRole("button", { name: "Restaurar backup", exact: true }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Restaurar backup", exact: true })
      .click();
    await page.getByRole("alertdialog").waitFor({ state: "hidden" });
    await page
      .getByRole("heading", { name: "Prévia da restauração", exact: true })
      .waitFor({ state: "hidden" });
  }
  await restore(saved);
  assert.equal((await read(page)).settings.wholesaleCycleDays, 4);
  delete saved.payload.data.settings.wholesaleCycleDays;
  delete saved.payload.data.settings.stockSafetyDays;
  saved.checksum = await page.evaluate(
    async (payload) =>
      Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload))),
        ),
        (n) => n.toString(16).padStart(2, "0"),
      ).join(""),
    saved.payload,
  );
  await restore(saved);
  const state = await read(page);
  assert.equal(state.settings.wholesaleCycleDays, 7);
  assert.equal(state.settings.stockSafetyDays, 2);
  assert.equal(state.products["123"].stock, 20);
  assert.equal(state.sales.length, 1);
  return 3;
}
module.exports = { seedReplenishment, stock, geometry, backup, watchErrors };
