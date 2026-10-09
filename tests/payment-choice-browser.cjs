const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const { seed, watchErrors } = require("../e2e/palette-support.cjs");
const { mkdirSync } = require("node:fs");
(async () => {
  mkdirSync("navigation-screenshots", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let count = 0;
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
      await seed(context, theme);
      await context.addInitScript(() => {
        const s = JSON.parse(localStorage.getItem("pdv-mercado"));
        s.state.products["123"].price = 20;
        s.state.products["123"].stock = 10;
        localStorage.setItem("pdv-mercado", JSON.stringify(s));
      });
      const page = await context.newPage();
      const check = watchErrors(page);
      count += await require("../e2e/payment-choice.spec.cjs")(page, context, `${theme}-${width}`);
      check();
      await context.close();
    }
    console.log(`${count} casos de escolha de pagamento passaram.`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
