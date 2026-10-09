const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const { mkdirSync, writeFileSync } = require("node:fs");
const {
  seedReplenishment,
  stock,
  geometry,
  backup,
  watchErrors,
} = require("../e2e/replenishment.spec.cjs");
(async () => {
  mkdirSync("navigation-screenshots", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let cases = 0;
  try {
    for (const [theme, width] of [
      ["light", 320],
      ["dark", 360],
      ["light", 430],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height: 740 },
        reducedMotion: "reduce",
      });
      await seedReplenishment(context, theme);
      const page = await context.newPage();
      const check = watchErrors(page);
      const label = `${theme}-${width}`;
      try {
        cases += await geometry(page, label);
        cases += await stock(page, context, label, width === 320);
        if (width === 320) cases += await backup(page);
        check();
        console.log(`Reposição ${label}: passou`);
      } catch (e) {
        await page.screenshot({
          path: `navigation-screenshots/replenishment-failure-${label}.png`,
          fullPage: true,
        });
        throw e;
      } finally {
        await context.close();
      }
    }
    writeFileSync(
      "replica/replenishment-browser-results.json",
      JSON.stringify(
        {
          cases,
          passed: cases,
          failed: 0,
          themes: ["light", "dark"],
          widths: [320, 360, 430],
          clipboard: "API simulada, sucesso/falha",
          pdf: "arquivo local real",
          physicalDevice: "pendente",
        },
        null,
        2,
      ),
    );
    console.log(`${cases} casos de reposição passaram.`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
