const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const assert = require("node:assert/strict");
const { mkdirSync } = require("node:fs");
(async () => {
  mkdirSync("navigation-screenshots", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 360, 430]) {
      const context = await browser.newContext({
        viewport: { width, height: 800 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
      const nav = page.getByRole("navigation", { name: "Navegação principal" });
      await nav.waitFor();
      assert.equal(await nav.getByRole("link").count(), 5);
      for (const [label, path] of [
        ["Fiados", "/"],
        ["Histórico", "/vendas"],
        ["Caixa", "/vender"],
        ["Estoque", "/estoque"],
        ["Ajustes", "/mais"],
      ]) {
        await nav.getByRole("link", { name: label, exact: true }).click();
        await page.waitForURL(`http://127.0.0.1:4173${path}`);
        assert.equal(
          await nav.getByRole("link", { name: label, exact: true }).getAttribute("aria-current"),
          "page",
        );
        for (const text of ["Fiados", "Histórico", "Caixa", "Estoque", "Ajustes"])
          assert.ok(await nav.getByText(text, { exact: true }).isVisible());
        const geometry = await nav.evaluate((el) => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          targets: [...el.querySelectorAll("a")].map((n) => {
            const b = n.getBoundingClientRect();
            return {
              w: b.width,
              h: b.height,
              inside: b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight,
            };
          }),
        }));
        assert.ok(
          !geometry.overflow && geometry.targets.every((t) => t.w >= 44 && t.h >= 44 && t.inside),
          `navigation geometry ${width}/${label}`,
        );
      }
      for (const dark of [false, true]) {
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle("dark", dark),
          dark,
        );
        const colors = await nav.evaluate((el) => {
          const probe = document.createElement("span");
          probe.style.color = "var(--primary)";
          el.appendChild(probe);
          const result = {
            active: getComputedStyle(el.querySelector(".is-active")).color,
            expected: getComputedStyle(probe).color,
          };
          probe.remove();
          return result;
        });
        assert.equal(colors.active, colors.expected);
        await page.screenshot({
          path: `navigation-screenshots/figma-nav-${width}-${dark ? "dark" : "light"}.png`,
        });
      }
      await nav.getByRole("link", { name: "Caixa", exact: true }).focus();
      await page.keyboard.press("Enter");
      await page.waitForURL("**/vender");
      await page.goBack();
      await page.waitForURL("**/mais");
      await context.close();
    }
    console.log("Navigation verified: five permanent labels, 3 widths, themes, keyboard and Back.");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
