const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const assert = require("node:assert/strict");
const { mkdirSync } = require("node:fs");

async function verifyTheme(nav, theme) {
  const colors = await nav.evaluate((element) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = "var(--card)";
    probe.style.color = "var(--primary)";
    element.appendChild(probe);
    const palette = getComputedStyle(probe);
    const expectedSurface = palette.backgroundColor;
    const expectedPrimary = palette.color;
    probe.style.color = "var(--primary-foreground)";
    const expectedInk = getComputedStyle(probe).color;
    const actual = {
      surface: getComputedStyle(element.querySelector(".pos-nav-outline path")).fill,
      label: getComputedStyle(element.querySelector(".is-active .pos-nav-label")).color,
      ink: getComputedStyle(element.querySelector(".is-active .pos-nav-icon")).color,
    };
    probe.remove();
    return { ...actual, expectedSurface, expectedPrimary, expectedInk };
  });
  assert.equal(colors.surface, colors.expectedSurface, `Dock surface/theme mismatch: ${theme}`);
  assert.equal(colors.label, colors.expectedPrimary, `Dock primary/theme mismatch: ${theme}`);
  assert.equal(colors.ink, colors.expectedInk, `Dock active icon/theme mismatch: ${theme}`);
}

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
      await nav.waitFor({ state: "visible" });
      const links = nav.getByRole("link");
      assert.equal(await links.count(), 5);
      for (const [label, path] of [
        ["Início", "/"],
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
        const geometry = await nav.evaluate((element) => {
          const bead = element.querySelector(".pos-nav-bubble").getBoundingClientRect();
          const icon = element.querySelector(".is-active svg").getBoundingClientRect();
          const rect = element.getBoundingClientRect();
          const shape = element.querySelector(".pos-nav-outline path");
          return {
            delta: Math.abs(bead.x + bead.width / 2 - icon.x - icon.width / 2),
            inside: rect.left >= 0 && rect.right <= innerWidth && bead.top >= 0,
            overflow: document.documentElement.scrollWidth > innerWidth,
            shape: shape.getAttribute("d"),
            top: Math.min(
              ...Array.from(
                { length: 301 },
                (_, index) => shape.getPointAtLength((shape.getTotalLength() * index) / 300).y,
              ),
            ),
          };
        });
        assert.ok(geometry.delta < 1, `Bead/icon drift at ${width}px, ${label}`);
        assert.ok(geometry.inside && !geometry.overflow, `Overflow at ${width}px, ${label}`);
        assert.ok(geometry.shape.includes("C"), "Dock curve missing");
        assert.ok(geometry.top >= 44.99, "Dock contour has a raised pointed shoulder");
      }
      await page.screenshot({ path: `navigation-screenshots/ajustes-${width}.png` });
      await nav.getByRole("link", { name: "Início", exact: true }).click();
      await verifyTheme(nav, "claro");
      await page.screenshot({ path: `navigation-screenshots/inicio-${width}.png` });
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });
      await verifyTheme(nav, "escuro");
      await page.screenshot({ path: `navigation-screenshots/escuro-${width}.png` });
      await context.close();
    }
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    const nav = page.getByRole("navigation", { name: "Navegação principal" });
    await nav.waitFor({ state: "visible" });
    const center = () =>
      nav.evaluate((el) => parseFloat(el.style.getPropertyValue("--dock-center")));
    const before = await center();
    await nav.getByRole("link", { name: "Ajustes", exact: true }).click();
    await page.waitForURL("**/mais");
    await page.waitForTimeout(70);
    const intermediate = await center();
    assert.ok(intermediate > before && intermediate < 85, "Bead no longer moves between tabs");
    await nav.getByRole("link", { name: "Histórico", exact: true }).click();
    await page.waitForTimeout(550);
    assert.equal(
      await nav.locator('[aria-current="page"]').getAttribute("aria-label"),
      "Histórico",
    );
    await nav.getByRole("link", { name: "Caixa", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/vender");
    await page.goBack();
    await page.waitForURL("**/vendas");
    await context.close();
    console.log(
      "Navigation verified: 5 routes, 3 widths, themes, keyboard, Back and quick selection.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
