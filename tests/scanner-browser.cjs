const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const assert = require("node:assert/strict");
const { mkdirSync } = require("node:fs");

(async () => {
  mkdirSync("navigation-screenshots", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
  try {
    for (const denied of [false, true]) {
      const context = await browser.newContext({
        viewport: { width: 320, height: 800 },
        hasTouch: true,
      });
      await context.addInitScript(
        ({ denied }) => {
          localStorage.setItem(
            "pdv-mercado",
            JSON.stringify({
              version: 6,
              state: {
                products: { "00123": { barcode: "00123", name: "Arroz", price: 20, stock: 10 } },
                cart: [],
                sales: [],
                settings: { storeName: "Mercadinho União", pixKey: "", merchantName: "", city: "" },
                theme: "light",
                cashOpen: true,
              },
            }),
          );
          if (denied) {
            navigator.mediaDevices.getUserMedia = async () => {
              throw new DOMException("Permission denied", "NotAllowedError");
            };
          }
        },
        { denied },
      );
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
      await page.getByRole("link", { name: "Caixa", exact: true }).click();
      const scanner = page.locator(".pdv-scanner-card");
      if (denied) {
        await scanner.getByText(/Permissão da câmera negada/).waitFor();
      } else {
        await scanner.locator("video").waitFor();
        await scanner.getByRole("button", { name: "Digitar código", exact: true }).click();
      }
      const input = scanner.getByRole("textbox", { name: "Código de barras", exact: true });
      await input.waitFor();
      if (!denied) assert.equal(await input.evaluate((e) => e === document.activeElement), true);
      assert.equal(await input.getAttribute("inputmode"), "numeric");
      assert.equal(await input.getAttribute("type"), "text");
      assert.equal(await input.getAttribute("enterkeyhint"), "done");
      assert.equal(await scanner.getByRole("button", { name: "Usar código" }).isDisabled(), true);
      await input.fill("00123");
      if (!denied) {
        await page.screenshot({ path: "navigation-screenshots/scanner-manual-320.png" });
        await scanner.getByRole("button", { name: "Cancelar digitação" }).click();
        const trigger = scanner.getByRole("button", { name: "Digitar código", exact: true });
        assert.equal(await trigger.evaluate((e) => e === document.activeElement), true);
        await trigger.click();
        assert.equal(await input.inputValue(), "00123");
        await input.dispatchEvent("keydown", { key: "Enter", isComposing: true });
        assert.equal(await input.inputValue(), "00123");
      }
      await input.press("Enter");
      const saved = await page.evaluate(
        () => JSON.parse(localStorage.getItem("pdv-mercado")).state,
      );
      assert.deepEqual(saved.cart, [{ barcode: "00123", qty: 1 }]);
      if (denied) assert.equal(await input.inputValue(), "");
      else {
        await page.waitForTimeout(100);
        assert.equal(
          await scanner.getByRole("button", { name: "Digitar código", exact: true }).isVisible(),
          true,
        );
        assert.equal(await scanner.locator("video").count(), 1);
      }
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      await context.close();
    }
    console.log(
      "Scanner verified: live camera/manual entry, numeric input, leading zeros, Enter, cancel/focus restore and denied permission fallback.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
