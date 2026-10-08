const assert = require("node:assert/strict");
const { scan } = require("./palette-support.cjs");

module.exports = async function dimensions(page, { label, baseline = false, safeArea = 0 }) {
  await page.getByRole("link", { name: "Caixa", exact: true }).click();
  await page.getByRole("button", { name: "Ir para pagamento" }).click();
  const sheet = page.getByRole("dialog", { name: "Pagamento", exact: true });
  if (safeArea) {
    await sheet.evaluate((el, inset) => {
      el.style.setProperty("--payment-safe-top", `${inset}px`);
      el.style.setProperty("--payment-safe-bottom", `${inset}px`);
    }, safeArea);
  }
  const measurements = [];
  for (const method of ["Dinheiro", "Pix", "Débito", "Crédito"]) {
    await sheet.getByRole("button", { name: method, exact: true }).click();
    if (method === "Pix")
      await sheet.getByRole("img", { name: "QR Code do pagamento Pix" }).waitFor();
    const geometry = await sheet.evaluate((el) => {
      const box = (rect) => ({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      });
      const brand = el.querySelector(".payment-brand");
      const methods = el.querySelector(".payment-methods");
      const panel = el.querySelector(".payment-panel");
      const buttons = [...methods.querySelectorAll("button")];
      return {
        brand: box(brand.getBoundingClientRect()),
        logo: box(brand.querySelector("img").getBoundingClientRect()),
        methods: box(methods.getBoundingClientRect()),
        panel: box(panel.getBoundingClientRect()),
        tabs: buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          const icon = button.querySelector("svg").getBoundingClientRect();
          const range = document.createRange();
          const label = button.querySelector("span");
          if (label) range.selectNodeContents(label);
          else range.selectNodeContents(button.lastChild);
          return {
            rect: box(rect),
            icon: box(icon),
            text: box(range.getBoundingClientRect()),
            overflow: button.scrollWidth > button.clientWidth + 1,
          };
        }),
        close: box(el.querySelector(".payment-close").getBoundingClientRect()),
        rows: [...el.querySelectorAll(".payment-cash-row")].map((row) => ({
          rect: box(row.getBoundingClientRect()),
          field: box(row.querySelector("strong, input").getBoundingClientRect()),
        })),
        keypad: el.querySelector(".payment-keypad")
          ? box(el.querySelector(".payment-keypad").getBoundingClientRect())
          : null,
        qr: el.querySelector(".payment-qr")
          ? box(el.querySelector(".payment-qr").getBoundingClientRect())
          : null,
        width: innerWidth,
        height: innerHeight,
      };
    });
    measurements.push({ method, ...geometry });
    await page.screenshot({
      path: `navigation-screenshots/payment-dimensions-${label}-${method}.png`,
    });
    if (baseline) continue;
    const reference = measurements[0];
    for (const name of ["brand", "logo", "methods", "panel", "close"]) {
      for (const key of ["x", "y", "width", "height"]) {
        assert.ok(
          Math.abs(geometry[name][key] - reference[name][key]) <= 1,
          `${label}/${method}: ${name}.${key} shifts between methods`,
        );
      }
    }
    assert.ok(
      geometry.brand.y >= safeArea &&
        geometry.panel.bottom <= geometry.height - safeArea + 1 &&
        geometry.panel.x >= 0 &&
        geometry.panel.right <= geometry.width + 1,
    );
    for (const tab of geometry.tabs) {
      assert.ok(
        !tab.overflow && tab.rect.height >= 44,
        `${label}/${method}: clipped or short payment tab`,
      );
      assert.ok(
        Math.abs(tab.icon.width - 18) <= 1 && Math.abs(tab.icon.height - 18) <= 1,
        `${label}/${method}: compressed payment icon`,
      );
      assert.ok(
        Math.abs(tab.icon.x + tab.icon.width / 2 - (tab.rect.x + tab.rect.width / 2)) <= 1,
        `${label}/${method}: icon is not centered`,
      );
      assert.ok(
        tab.text.x >= tab.rect.x &&
          tab.text.right <= tab.rect.right + 1 &&
          tab.icon.bottom <= tab.text.y &&
          tab.text.bottom <= tab.rect.bottom,
        `${label}/${method}: payment label clipped`,
      );
    }
    if (geometry.keypad) {
      const fields = geometry.rows.map((row) => row.field);
      for (const field of fields) {
        assert.ok(
          Math.abs(field.x - fields[0].x) <= 1 && Math.abs(field.width - fields[0].width) <= 1,
          `${label}: monetary fields do not align`,
        );
      }
      assert.ok(
        geometry.rows.at(-1).rect.bottom <= geometry.keypad.y + 1,
        `${label}: cash summary behind keypad`,
      );
      const paid = await sheet.getByRole("button", { name: "PAGO", exact: true }).boundingBox();
      assert.ok(paid.y >= 0 && paid.y + paid.height <= geometry.height, `${label}: PAGO obscured`);
    } else {
      const manual = sheet.getByRole("button", { name: "Confirmar manualmente", exact: true });
      const rect = await manual.boundingBox();
      assert.ok(
        rect.y >= geometry.panel.y && rect.y + rect.height <= geometry.panel.bottom,
        `${label}/${method}: manual confirmation obscured`,
      );
      await manual.click();
      const confirm = sheet.getByRole("button", { name: "Confirmar pagamento", exact: true });
      await confirm.focus();
      const focused = await confirm.boundingBox();
      assert.ok(
        focused.y >= geometry.panel.y && focused.y + focused.height <= geometry.panel.bottom,
        `${label}/${method}: expanded confirmation obscured`,
      );
      await manual.click();
      if (geometry.qr) {
        assert.ok(Math.abs(geometry.qr.width - geometry.qr.height) <= 1, `${label}: distorted QR`);
        const overlaps =
          geometry.qr.x < geometry.close.right &&
          geometry.qr.right > geometry.close.x &&
          geometry.qr.y < geometry.close.bottom &&
          geometry.qr.bottom > geometry.close.y;
        assert.ok(!overlaps, `${label}: close overlaps QR`);
      }
    }
    await scan(page, `${label} ${method} dimensions`);
  }
  console.log(
    JSON.stringify({
      label,
      measurements: measurements.map(({ method, brand, methods, panel }) => ({
        method,
        brand,
        methods,
        panel,
      })),
    }),
  );
};
