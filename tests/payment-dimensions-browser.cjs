const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const { mkdirSync } = require("node:fs");
const { seed, watchErrors } = require("../e2e/palette-support.cjs");

(async () => {
  mkdirSync("navigation-screenshots", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let count = 0;
  try {
    for (const theme of ["light", "dark"]) {
      for (const [width, height, safeArea = 0] of [
        [320, 568],
        [360, 640],
        [390, 844],
        [414, 896],
        [430, 800],
        [390, 844, 24],
      ]) {
        const context = await browser.newContext({
          viewport: { width, height },
          reducedMotion: "reduce",
        });
        try {
          await seed(context, theme);
          if (safeArea) {
            await context.addInitScript(() => {
              const store = JSON.parse(localStorage.getItem("pdv-mercado"));
              store.state.products[123].price = 1234.56;
              localStorage.setItem("pdv-mercado", JSON.stringify(store));
            });
          }
          const page = await context.newPage();
          const checkErrors = watchErrors(page);
          await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
          await page.getByRole("navigation", { name: "Navegação principal" }).waitFor();
          await require("../e2e/payment-dimensions.spec.cjs")(page, {
            label: `${theme}-${width}x${height}${safeArea ? "-safearea-largeamount" : ""}`,
            baseline: process.env.DIMENSIONS_BASELINE === "1",
            safeArea,
          });
          checkErrors();
          count += 4;
        } finally {
          await context.close();
        }
      }
    }
    console.log(
      `Payment dimensions: ${count} method/theme/viewport cases ${process.env.DIMENSIONS_BASELINE === "1" ? "measured as baseline" : "passed"}.`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
