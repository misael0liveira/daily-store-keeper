const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const assert = require("node:assert/strict");
const { mkdirSync } = require("node:fs");

(async () => {
  mkdirSync("navigation-screenshots", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [width, height] of [
      [320, 568],
      [414, 896],
      [430, 800],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.addInitScript(() => {
        localStorage.setItem(
          "pdv-mercado",
          JSON.stringify({
            version: 6,
            state: {
              products: { 123: { barcode: "123", name: "Arroz", price: 4.24, stock: 20 } },
              cart: [{ barcode: "123", qty: 1 }],
              sales: [],
              cashOpen: true,
              theme: "light",
              settings: {
                storeName: "Mercadinho União",
                pixKey: "teste@example.com",
                merchantName: "Loja Teste",
                city: "SAO PAULO",
              },
            },
          }),
        );
        window.testExpected = null;
        window.testPayment = null;
        window.testWaits = 0;
        window.Capacitor = {
          PluginHeaders: [
            {
              name: "PixNotification",
              methods: [
                "setExpectedAmount",
                "clearExpectedAmount",
                "getLastPayment",
                "isNotificationAccessGranted",
              ].map((name) => ({ name, rtype: "promise" })),
            },
          ],
          nativePromise: async (plugin, method, options) => {
            if (method === "isNotificationAccessGranted") return { granted: true };
            if (method === "setExpectedAmount") {
              window.testExpected = { ...options, startedAt: Date.now() };
              return { startedAt: window.testExpected.startedAt };
            }
            if (method === "clearExpectedAmount") {
              if (window.testExpected?.monitorId === options.monitorId) window.testExpected = null;
              return;
            }
            if (method === "getLastPayment") {
              if (window.testDefer) {
                window.testDefer = false;
                return new Promise((resolve) => {
                  window.testResolve = resolve;
                });
              }
              const payment = window.testPayment;
              window.testPayment = null;
              window.testWaits++;
              return payment || { found: false };
            }
          },
        };
      });
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
      await page.getByRole("link", { name: "Caixa", exact: true }).click();
      await page.getByRole("button", { name: "Pagamento" }).click();
      if (await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).count())
        await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).click();
      const sheet = page.getByRole("dialog", { name: "Pagamento", exact: true });
      const persisted = () =>
        page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
      const assertBounds = async () => {
        const geometry = await sheet.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const keypad = el.querySelector(".payment-keypad")?.getBoundingClientRect();
          const summary = [...el.querySelectorAll(".payment-cash-row")]
            .at(-1)
            ?.getBoundingClientRect();
          return {
            inside:
              rect.left >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1,
            horizontalOverflow: el.scrollWidth > el.clientWidth + 1,
            keypadInside: !keypad || (keypad.top >= 0 && keypad.bottom <= innerHeight),
            summaryVisible: !summary || !keypad || summary.bottom <= keypad.top,
          };
        });
        assert.ok(
          geometry.inside &&
            !geometry.horizontalOverflow &&
            geometry.keypadInside &&
            geometry.summaryVisible,
          `Payment overflow at ${width}x${height}`,
        );
      };
      const waitSuccess = async (saleCount) => {
        const status = sheet.getByRole("status", { name: "Pagamento recebido", exact: true });
        await status.waitFor();
        const startedAt = Date.now();
        assert.equal(
          (await persisted()).sales.length,
          saleCount,
          "Sale must be saved before success animation",
        );
        await page.keyboard.press("Escape");
        await page.waitForTimeout(1350);
        assert.ok(await status.isVisible(), "Success animation closed early");
        await status.waitFor({ state: "hidden" });
        const elapsed = Date.now() - startedAt;
        assert.ok(
          elapsed >= 1750 && elapsed < 2650,
          `Expected two-second success, got ${elapsed}ms`,
        );
        await sheet.waitFor({ state: "hidden" });
      };
      const nextSale = async () => {
        const search = page.getByRole("textbox", { name: "Digitar código ou nome do produto" });
        await search.fill("123");
        await search.press("Enter");
        await page.getByRole("button", { name: "Pagamento" }).click();
        if (await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).count())
          await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).click();
      };
      const send = async (overrides = {}) => {
        await page.waitForFunction(() => window.testExpected != null);
        await page.evaluate((overrides) => {
          const expected = window.testExpected;
          window.testPayment = {
            found: true,
            amount: expected.amount,
            timestamp: Date.now(),
            monitorId: expected.monitorId,
            method: expected.method,
            bank: "Banco teste",
            ...overrides,
          };
        }, overrides);
        await page.waitForFunction(() => window.testPayment === null);
      };
      await sheet.getByRole("button", { name: "3", exact: true }).click();
      assert.ok(await sheet.getByRole("button", { name: "PAGO", exact: true }).isDisabled());
      await sheet.getByRole("button", { name: "Limpar valor" }).click();
      await sheet.getByRole("button", { name: "5", exact: true }).click();
      assert.match(await sheet.locator(".payment-cash-row").last().textContent(), /0,76/);
      assert.equal(
        await sheet
          .getByRole("textbox", { name: "Valor pago pelo cliente" })
          .getAttribute("inputmode"),
        "none",
      );
      await assertBounds();
      await page.screenshot({ path: `navigation-screenshots/pagamento-dinheiro-${width}.png` });
      await context.setOffline(true);
      await sheet.getByRole("button", { name: "PAGO", exact: true }).click();
      await waitSuccess(1);
      assert.equal((await persisted()).sales[0].paidAmount, 5);
      assert.equal((await persisted()).sales[0].change, 0.76);

      await nextSale();
      await sheet.getByRole("button", { name: "Pix", exact: true }).click();
      await sheet.getByRole("img", { name: "QR Code do pagamento Pix" }).waitFor();
      await assertBounds();
      await page.screenshot({ path: `navigation-screenshots/pagamento-pix-${width}.png` });
      await send({ amount: 4.25 });
      assert.equal((await persisted()).sales.length, 1);
      await send({ timestamp: 1 });
      assert.equal((await persisted()).sales.length, 1);
      await send({ monitorId: "previous-checkout" });
      assert.equal((await persisted()).sales.length, 1);
      await send({ method: "credito" });
      assert.equal((await persisted()).sales.length, 1);
      // A response from a monitor cancelled while a poll was pending must be discarded.
      await page.evaluate(() => {
        window.testDefer = true;
      });
      await page.waitForFunction(() => window.testResolve != null);
      await sheet.getByRole("button", { name: "Dinheiro", exact: true }).click();
      await page.evaluate(() =>
        window.testResolve({ found: true, amount: 4.24, timestamp: Date.now(), method: "pix" }),
      );
      assert.equal((await persisted()).sales.length, 1);
      await sheet.getByRole("button", { name: "Pix", exact: true }).click();
      await send();
      await waitSuccess(2);

      for (const [index, bank] of ["Mercado Pago", "PagBank", "Ton", "SumUp"].entries()) {
        await nextSale();
        const method = index % 2 === 0 ? "Débito" : "Crédito";
        await sheet.getByRole("button", { name: method, exact: true }).click();
        await sheet.getByRole("img", { name: "Maquininha com cartão" }).waitFor();
        await assertBounds();
        if (index === 0)
          await page.screenshot({ path: `navigation-screenshots/pagamento-cartao-${width}.png` });
        await send({ bank });
        await waitSuccess(index + 3);
        const sale = (await persisted()).sales[0];
        assert.equal(sale.method, index % 2 === 0 ? "debito" : "credito");
        assert.equal(sale.total, 4.24);
      }
      assert.equal((await persisted()).products["123"].stock, 14);
      await context.close();
    }
    console.log(
      "Payments verified: fixed keypad/change, immediate offline persistence, Pix/card monitor sessions, stale response rejection, all three layouts and two-second success at 320/414/430px. Native matching is tested separately with synthetic fixtures.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
