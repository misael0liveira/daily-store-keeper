const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const assert = require("node:assert/strict");
const { mkdirSync } = require("node:fs");
const { fiadoSeed, scan, watchErrors } = require("../e2e/fiados.spec.cjs");
(async () => {
  mkdirSync("navigation-screenshots", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let count = 0;
  try {
    for (const [width, height, theme] of [
      [320, 568, "light"],
      [390, 844, "light"],
      [430, 800, "dark"],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: "reduce",
      });
      await fiadoSeed(context, theme);
      await context.addInitScript(() => {
        if (localStorage.getItem("figma-seeded")) return;
        localStorage.setItem("figma-seeded", "1");
        const raw = JSON.parse(localStorage.getItem("pdv-mercado"));
        raw.state.products = {
          123: { barcode: "123", name: "Arroz branco", price: 9.9, stock: 24 },
          456: { barcode: "456", name: "Feijão carioca", price: 15.5, stock: 18 },
          789: { barcode: "789", name: "Leite integral", price: 7.5, stock: 12 },
        };
        raw.state.cart = [
          { barcode: "123", qty: 2 },
          { barcode: "456", qty: 1 },
          { barcode: "789", qty: 1 },
        ];
        raw.state.customers[0].name = "Misael Oliveira";
        raw.state.customers[0].creditLimit = 300;
        raw.state.currentCustomerId = "c1";
        raw.state.receivables[0].balance = 63.2;
        raw.state.receivables[0].original = 63.2;
        localStorage.setItem("pdv-mercado", JSON.stringify(raw));
      });
      const page = await context.newPage();
      const errors = watchErrors(page);
      await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
      const nav = page.getByRole("navigation", { name: "Navegação principal" });
      await nav.waitFor();
      await nav.getByRole("link", { name: "Caixa", exact: true }).click();
      assert.equal(
        await page.locator(".pdv-scanner-card").count(),
        0,
        "scanner must wait for explicit expansion",
      );
      const qty = page.getByRole("button", { name: "Aumentar Arroz branco", exact: true });
      const target = await qty.boundingBox();
      assert.ok(target.width >= 44 && target.height >= 44);
      const before = await page.evaluate(
        () => JSON.parse(localStorage.getItem("pdv-mercado")).state,
      );
      assert.equal(
        before.cart.reduce((n, i) => n + i.qty * before.products[i.barcode].price, 0),
        42.8,
      );
      await scan(page, `figma ${width} Caixa`);
      await page.screenshot({ path: `navigation-screenshots/figma-${theme}-${width}-caixa.png` });
      const primary = page.getByRole("button", { name: "Pagamento", exact: true });
      const btn = await primary.boundingBox(),
        dock = await nav.boundingBox();
      assert.ok(btn.y + btn.height <= dock.y, "checkout must stay above navigation");
      await page.getByRole("button", { name: "Marcar na Conta", exact: true }).click();
      const sheet = page.getByRole("dialog", {
        name: "Marcar na Conta — Misael Oliveira",
        exact: true,
      });
      await scan(page, `figma ${width} fiado`);
      await page.screenshot({ path: `navigation-screenshots/figma-${theme}-${width}-fiado.png` });
      await page.getByRole("radio", { name: "Receber uma parte agora", exact: true }).check();
      await page.getByLabel("Valor a receber agora (R$)").fill("20");
      await scan(page, `figma ${width} entrada`);
      const after = await page.evaluate(
        () => JSON.parse(localStorage.getItem("pdv-mercado")).state,
      );
      assert.deepEqual(after.cart, before.cart);
      assert.deepEqual(after.receivables, before.receivables);
      await page.keyboard.press("Escape");
      await sheet.waitFor({ state: "hidden" });
      for (const label of ["Estoque", "Fiados", "Histórico", "Ajustes"]) {
        await nav.getByRole("link", { name: label, exact: true }).click();
        await scan(page, `figma ${width} ${label}`);
        await page.screenshot({
          path: `navigation-screenshots/figma-${theme}-${width}-${label}.png`,
        });
        count++;
      }
      errors();
      await context.close();
      count += 3;
    }
    console.log(
      `Figma layout: ${count} viewport/state checks passed, references captured, controls and unchanged draft data verified.`,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
