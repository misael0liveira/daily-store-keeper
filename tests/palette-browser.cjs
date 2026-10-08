const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const { mkdirSync } = require("node:fs");
const { seed, watchErrors } = require("../e2e/palette-support.cjs");

(async () => {
  mkdirSync("navigation-screenshots", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let passed = 0;
  try {
    for (const theme of ["light", "dark"]) {
      for (const width of [320, 430]) {
        for (const flow of [
          "navigation",
          "stock",
          "payments",
          ...(width === 430 ? ["native"] : []),
        ]) {
          const context = await browser.newContext({
            viewport: { width, height: 800 },
            reducedMotion: "reduce",
          });
          try {
            await seed(context, theme);
            if (flow === "native") {
              await context.addInitScript(() => {
                window.testBarStyles = [];
                window.testResumeListeners = {};
                window.androidBridge = { postMessage: () => {} };
                const capacitor = window.Capacitor;
                const originalPromise = capacitor.nativePromise;
                capacitor.platform = "android";
                capacitor.isNativePlatform = () => true;
                capacitor.PluginHeaders.push(
                  { name: "SystemBars", methods: [{ name: "setStyle", rtype: "promise" }] },
                  {
                    name: "App",
                    methods: [
                      { name: "addListener", rtype: "callback" },
                      { name: "removeListener", rtype: "promise" },
                    ],
                  },
                );
                capacitor.nativePromise = async (plugin, method, options) => {
                  if (plugin === "SystemBars") {
                    window.testBarStyles.push(options.style);
                    return {};
                  }
                  if (plugin === "App" && method === "removeListener") {
                    delete window.testResumeListeners[options.callbackId];
                    return {};
                  }
                  return originalPromise(plugin, method, options);
                };
                capacitor.nativeCallback = (_plugin, _method, options, callback) => {
                  const id = crypto.randomUUID();
                  if (options.eventName === "resume") window.testResumeListeners[id] = callback;
                  return id;
                };
              });
            }
            const page = await context.newPage();
            const checkErrors = watchErrors(page);
            await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
            if (flow !== "native")
              await page.getByRole("navigation", { name: "Navegação principal" }).waitFor();
            await require(`../e2e/palette-${flow}.spec.cjs`)(page, context, `${theme}-${width}`);
            checkErrors();
            passed++;
            console.log(`PASS palette ${flow} ${theme} ${width}`);
          } finally {
            await context.close();
          }
        }
      }
    }
    console.log(
      `Palette: ${passed} flow/theme/viewport combinations passed, axe on each screen, console/5xx clean.`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
