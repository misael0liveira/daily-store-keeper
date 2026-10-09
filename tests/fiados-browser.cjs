const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const { mkdirSync, writeFileSync } = require("node:fs");
const {
  creditOptions,
  freshQuote,
  fiadoSeed,
  purchase,
  receive,
  identity,
  backup,
  scan,
  watchErrors,
} = require("../e2e/fiados.spec.cjs");
(async () => {
  mkdirSync("navigation-screenshots", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let cases = 0;
  try {
    for (const [theme, width, method] of [
      ["light", 320, "Dinheiro"],
      ["dark", 360, "Pix"],
      ["light", 430, "Débito"],
      ["dark", 320, "Crédito"],
      ["light", 390, ["Dinheiro", "Pix"]],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height: 740 },
        reducedMotion: "reduce",
      });
      await fiadoSeed(context, theme);
      const page = await context.newPage();
      const check = watchErrors(page);
      try {
        await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
        await scan(page, "Fiados lista");
        if (method === "Dinheiro") {
          await identity(page);
          cases += 4;
        }
        await purchase(page, method);
        cases += 4;
        await receive(page, method);
        cases += 3;
        if (method === "Dinheiro") {
          await backup(page);
          cases += 2;
        }
        await page.screenshot({
          path: `navigation-screenshots/fiados-${theme}-${width}-${method}.png`,
          fullPage: true,
        });
        await context.setOffline(true);
        await page.reload({ waitUntil: "networkidle" });
        await page.getByRole("heading", { name: "Fiados", exact: true }).waitFor();
        await scan(page, "Fiados offline após recarga");
        cases++;
        check();
        console.log(`Fiados ${theme}/${width}/${method}: passou`);
      } catch (error) {
        await page.screenshot({
          path: `navigation-screenshots/fiados-failure-${method}.png`,
          fullPage: true,
        });
        console.log(
          await page.evaluate(() =>
            [...document.querySelectorAll("body *")]
              .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
              .map((el) => ({
                tag: el.tagName,
                text: el.textContent?.slice(0, 80),
                box: el.getBoundingClientRect().toJSON(),
              }))
              .slice(-20),
          ),
        );
        throw error;
      } finally {
        await context.close();
      }
    }
    const options = await browser.newContext({
      viewport: { width: 320, height: 740 },
      reducedMotion: "reduce",
    });
    try {
      await fiadoSeed(options, "dark");
      const page = await options.newPage();
      const check = watchErrors(page);
      cases += await creditOptions(page);
      check();
    } finally {
      await options.close();
    }
    const fresh = await browser.newContext({
      viewport: { width: 320, height: 740 },
      reducedMotion: "reduce",
    });
    try {
      await fiadoSeed(fresh, "light");
      const page = await fresh.newPage();
      const check = watchErrors(page);
      await freshQuote(page);
      check();
      cases += 3;
    } finally {
      await fresh.close();
    }
    writeFileSync(
      "replica/fiados-browser-results.json",
      JSON.stringify(
        {
          cases,
          passed: cases,
          failed: 0,
          methods: ["dinheiro", "pix", "debito", "credito"],
          viewports: [320, 360, 430],
          bridge: "sintética; recebimentos conferidos manualmente",
          physicalDevice: "pendente",
        },
        null,
        2,
      ),
    );
    console.log(`${cases} casos Fiados passaram.`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
