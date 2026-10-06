const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const assert = require("node:assert/strict");
const { mkdirSync } = require("node:fs");
const origin = "http://127.0.0.1:4173";

async function seed(context) {
  await context.addInitScript(() => {
    if (localStorage.getItem("promotion-test-seeded")) return;
    localStorage.setItem("promotion-test-seeded", "yes");
    localStorage.setItem(
      "pdv-mercado",
      JSON.stringify({
        version: 6,
        state: {
          products: {
            "00123": { barcode: "00123", name: "Arroz 5kg", price: 20, stock: 2 },
            "00456": { barcode: "00456", name: "Feijão", price: 10, stock: 4 },
          },
          cart: [],
          sales: [],
          settings: { storeName: "Mercadinho União", pixKey: "", merchantName: "", city: "" },
          theme: "light",
          cashOpen: true,
        },
      }),
    );
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Permission denied", "NotAllowedError");
    };
  });
}
async function stock(page) {
  await page.getByRole("link", { name: "Estoque", exact: true }).click();
  await page.getByRole("heading", { name: "Estoque", exact: true }).waitFor();
}
async function selectProduct(page, name) {
  const search = page.getByRole("textbox", { name: "Buscar produto para promoção" });
  await search.fill(name);
  await page.locator("button.promotion-product").filter({ hasText: name }).click();
}
async function checkWidth(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const modal = page.locator(".promotion-dialog:visible");
  if (await modal.count())
    assert.equal(
      await modal.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
      true,
      "Promotion dialog content overflows",
    );
}

(async () => {
  mkdirSync("navigation-screenshots", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 430]) {
      const context = await browser.newContext({
        viewport: { width, height: 800 },
        reducedMotion: "reduce",
      });
      await seed(context);
      const page = await context.newPage();
      await page.goto(origin, { waitUntil: "networkidle" });
      await stock(page);
      await page.locator(".pos-stock-list button").filter({ hasText: "Arroz 5kg" }).click();
      const editor = page.getByRole("dialog", { name: "Editar produto", exact: true });
      assert.equal(
        await editor.getByRole("button", { name: "Tirar foto", exact: true }).count(),
        1,
      );
      assert.equal(
        await editor.getByLabel("Tirar foto do produto").getAttribute("capture"),
        "environment",
      );
      const data = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 80;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(0, 0, 80, 80);
        ctx.fillStyle = "#b41414";
        ctx.fillRect(20, 20, 40, 40);
        return canvas.toDataURL("image/png").split(",")[1];
      });
      await editor.getByLabel("Carregar foto do produto").setInputFiles({
        name: "produto.png",
        mimeType: "image/png",
        buffer: Buffer.from(data, "base64"),
      });
      await editor.getByRole("img", { name: "Foto de Arroz 5kg" }).waitFor();
      await editor.getByRole("button", { name: "Atualizar produto", exact: true }).click();
      await editor.waitFor({ state: "hidden" });
      let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
      assert.ok(stored.products["00123"].photoId);
      const photoCheck = await page.evaluate(async (id) => {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open("mercadinho-product-photos", 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const blob = await new Promise((resolve, reject) => {
          const request = db.transaction("photos").objectStore("photos").get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const image = await createImageBitmap(blob);
        const c = document.createElement("canvas");
        c.width = c.height = 512;
        const ctx = c.getContext("2d");
        ctx.drawImage(image, 0, 0);
        const corner = Array.from(ctx.getImageData(230, 230, 1, 1).data);
        const center = Array.from(ctx.getImageData(256, 256, 1, 1).data);
        db.close();
        return { type: blob.type, width: image.width, height: image.height, corner, center };
      }, stored.products["00123"].photoId);
      assert.equal(photoCheck.type, "image/jpeg");
      assert.equal(photoCheck.width, 512);
      assert.equal(photoCheck.height, 512);
      assert.ok(photoCheck.corner.slice(0, 3).every((channel) => channel > 240));
      assert.ok(
        photoCheck.center[0] > 100 && photoCheck.center[1] < 50,
        "Product was erased by background treatment",
      );
      // Exercise the capture input through the same chooser callback used by the Android bridge.
      await page.locator(".pos-stock-list button").filter({ hasText: "Arroz 5kg" }).click();
      let chooser;
      try {
        [chooser] = await Promise.all([
          page.waitForEvent("filechooser", { timeout: 5000 }),
          editor.getByRole("button", { name: "Tirar foto", exact: true }).click({ timeout: 4500 }),
        ]);
      } catch (error) {
        const diagnostic = await editor.evaluate((element) => ({
          text: element.textContent,
          inputs: Array.from(element.querySelectorAll('input[type="file"]')).map((input) => ({
            capture: input.capture,
            connected: input.isConnected,
            disabled: input.disabled,
          })),
          active: document.activeElement?.outerHTML,
          activation: navigator.userActivation.isActive,
          buttons: Array.from(element.querySelectorAll("button")).map((button) => ({
            text: button.textContent,
            disabled: button.disabled,
            rect: button.getBoundingClientRect().toJSON(),
          })),
          rect: element.getBoundingClientRect().toJSON(),
          scrollTop: element.scrollTop,
        }));
        await page.screenshot({
          path: `navigation-screenshots/camera-picker-failure-${width}.png`,
        });
        throw new Error(`${error.message}; Camera picker: ${JSON.stringify(diagnostic)}`);
      }
      await chooser.setFiles({
        name: "camera.png",
        mimeType: "image/png",
        buffer: Buffer.from(data, "base64"),
      });
      await editor.getByRole("img", { name: "Foto de Arroz 5kg" }).waitFor();
      await editor.getByRole("button", { name: "Atualizar produto", exact: true }).click();
      await editor.waitFor({ state: "hidden" });
      await page.getByRole("button", { name: "Promoção", exact: true }).click();
      await selectProduct(page, "Arroz 5kg");
      await selectProduct(page, "Feijão");
      await page.getByRole("button", { name: "Prosseguir", exact: true }).click();
      const modal = page.getByRole("dialog", { name: "Aplicar promoção", exact: true });
      assert.equal(await modal.locator(".promotion-editor-card").count(), 2);
      await modal.locator("#promotion-0-discount").fill("25");
      await modal.locator("#promotion-1-discount").fill("150");
      await modal.getByRole("button", { name: "Aplicar promoção", exact: true }).click();
      await modal.getByRole("alert").waitFor();
      stored = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
      assert.equal(stored.products["00123"].promotion, undefined);
      await modal.locator("#promotion-1-discount").fill("10");
      await modal
        .locator(".promotion-editor-card")
        .nth(1)
        .getByLabel("Data de começo e fim")
        .check();
      await modal.locator("#promotion-1-start").fill("2020-01-01");
      await modal.locator("#promotion-1-end").fill("2099-12-31");
      await checkWidth(page);
      await page.screenshot({ path: `navigation-screenshots/promocoes-${width}.png` });
      await modal.getByRole("button", { name: "Aplicar promoção", exact: true }).click();
      await modal.waitFor({ state: "hidden" });
      await page.reload({ waitUntil: "networkidle" });
      await stock(page);
      await page.getByRole("img", { name: "Foto de Arroz 5kg" }).waitFor();
      await page.getByRole("link", { name: "Caixa", exact: true }).click();
      const search = page.getByRole("textbox", { name: "Digitar código ou nome do produto" });
      await search.fill("00123");
      await search.press("Enter");
      const cart = page.locator(".pos-cart-row");
      await cart.getByRole("img", { name: "Foto de Arroz 5kg" }).waitFor();
      await cart.locator("del").waitFor();
      assert.match(await cart.locator("del").textContent(), /20,00/);
      assert.match(
        await cart.locator(".product-prices .product-current-price").textContent(),
        /15,00/,
      );
      await page.screenshot({ path: `navigation-screenshots/caixa-foto-${width}.png` });
      await context.setOffline(true);
      await page.getByRole("button", { name: "Ir para pagamento" }).click();
      await page
        .getByRole("dialog", { name: "Pagamento", exact: true })
        .getByRole("button", { name: "Confirmar pagamento", exact: true })
        .click();
      stored = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
      assert.equal(stored.sales[0].total, 15);
      assert.equal(stored.sales[0].items[0].originalPrice, 20);
      await search.fill("00123");
      await search.press("Enter");
      await page.getByRole("button", { name: "Ir para pagamento" }).click();
      await page
        .getByRole("dialog", { name: "Pagamento", exact: true })
        .getByRole("button", { name: "Confirmar pagamento", exact: true })
        .click();
      stored = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
      assert.equal(stored.products["00123"].stock, 0);
      assert.equal(stored.products["00123"].promotion, undefined);
      await checkWidth(page);
      await stock(page);
      await page.getByRole("button", { name: "Promoção", exact: true }).click();
      await page
        .getByRole("button", { name: "Escanear código para promoção", exact: true })
        .click();
      const scanner = page.getByRole("dialog", { name: "Ler código de barras", exact: true });
      const code = scanner.getByRole("textbox", { name: "Código de barras", exact: true });
      await code.fill("00456");
      await code.press("Enter");
      await scanner.waitFor({ state: "hidden" });
      await page.getByRole("button", { name: "Prosseguir", exact: true }).click();
      assert.equal(await modal.locator(".promotion-editor-card").count(), 1);
      assert.match(await modal.textContent(), /Feijão/);
      await modal.getByRole("button", { name: "Voltar", exact: true }).click();
      await context.close();
    }
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    await context.addInitScript(() => {
      window.androidBridge = { postMessage: () => {} };
      window.Capacitor = { isNativePlatform: () => true };
    });
    const page = await context.newPage();
    await page.goto(origin);
    const splash = page.getByRole("status", { name: "Abrindo Mercadinho União" });
    await splash.waitFor();
    const visibleAt = Date.now();
    await splash.waitFor({ state: "hidden" });
    assert.ok(Date.now() - visibleAt < 3500, "Splash still lasts four seconds");
    await page.waitForURL("**/vender");
    await page.getByRole("link", { name: "Início", exact: true }).click();
    await page.waitForURL(origin + "/");
    await page.waitForTimeout(300);
    assert.ok(page.url().endsWith("/"), "Startup forces Caixa again on tab navigation");
    await context.close();
    console.log(
      "Photos, local white background, multi-product/date promotions, atomic validation, persistence, discounted offline sales, depletion, responsive modals, 2s splash and native launch to Caixa passed.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
