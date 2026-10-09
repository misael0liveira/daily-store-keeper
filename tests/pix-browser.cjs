const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const assert = require("node:assert/strict");

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    await context.addInitScript(() => {
      localStorage.setItem(
        "pdv-mercado",
        JSON.stringify({
          version: 6,
          state: {
            products: { 123: { barcode: "123", name: "Arroz", price: 20, stock: 10 } },
            cart: [{ barcode: "123", qty: 1 }],
            sales: [],
            settings: {
              storeName: "Mercadinho União",
              pixKey: "teste@example.com",
              merchantName: "Loja Teste",
              city: "SAO PAULO",
            },
            theme: "light",
            cashOpen: true,
          },
        }),
      );
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (value) => {
            window.copiedPix = value;
          },
        },
      });
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Caixa", exact: true }).click();
    await page.getByRole("button", { name: "Pagamento" }).click();
    if (await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).count())
      await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Pagamento" });
    await sheet.getByRole("button", { name: "Pix", exact: true }).click();
    const qr = sheet.getByRole("img", { name: "QR Code do pagamento Pix" });
    await qr.waitFor();
    const firstQr = await qr.getAttribute("src");
    await sheet.getByRole("button", { name: "Copiar código Pix" }).click();
    const first = await page.evaluate(() => window.copiedPix);
    const txid = (payload) => {
      const match = payload.match(/62290525([A-Za-z0-9]{25})6304[0-9A-F]{4}$/);
      assert.ok(match, "Missing valid transaction reference");
      return match[1];
    };
    const firstTxid = txid(first);
    await sheet.getByRole("button", { name: "Dinheiro", exact: true }).click();
    await sheet.getByRole("button", { name: "Pix", exact: true }).click();
    await qr.waitFor();
    await sheet.getByRole("button", { name: "Copiar código Pix" }).click();
    assert.equal(
      await page.evaluate(() => window.copiedPix),
      first,
      "Reference changed within checkout",
    );
    await context.setOffline(true);
    await sheet.getByRole("button", { name: "Confirmar manualmente" }).click();
    await sheet.getByRole("button", { name: "Confirmar pagamento" }).click();
    await sheet.waitFor({ state: "hidden" });
    const search = page.getByRole("textbox", { name: "Digitar código ou nome do produto" });
    await search.fill("123");
    await search.press("Enter");
    await page.getByRole("button", { name: "Pagamento" }).click();
    if (await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).count())
      await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).click();
    await sheet.getByRole("button", { name: "Pix", exact: true }).click();
    await qr.waitFor();
    const secondQr = await qr.getAttribute("src");
    await sheet.getByRole("button", { name: "Copiar código Pix" }).click();
    const second = await page.evaluate(() => window.copiedPix);
    const secondTxid = txid(second);
    assert.notEqual(second, first, "Same-value Pix reused the first code");
    assert.notEqual(secondQr, firstQr, "QR image reused the first code");
    assert.notEqual(secondTxid, firstTxid);
    await sheet.getByRole("button", { name: "Confirmar manualmente" }).click();
    await sheet.getByRole("button", { name: "Confirmar pagamento" }).click();
    await sheet.waitFor({ state: "hidden" });
    const persisted = await page.evaluate(
      () => JSON.parse(localStorage.getItem("pdv-mercado")).state,
    );
    assert.equal(persisted.sales.length, 2);
    assert.equal(persisted.sales[0].pixTxid, secondTxid);
    assert.equal(persisted.sales[1].pixTxid, firstTxid);
    assert.equal(persisted.sales[0].total, 20);
    assert.equal(persisted.sales[1].total, 20);
    assert.equal(persisted.products["123"].stock, 8);
    console.log(
      "Pix verified: two same-value sales, distinct QR/copy codes, stable checkout, offline and persisted references.",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
