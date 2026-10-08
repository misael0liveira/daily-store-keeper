const assert = require("node:assert/strict");
const AxeBuilder = require(process.env.AXE_MODULE).default;

async function scan(page, label) {
  // Check settled states: a permission result can change a button variant mid-transition.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().iterations))
        .map((animation) => animation.finished.catch(() => {})),
    ),
  );
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ html: n.html, failure: n.failureSummary })),
    })),
    [],
    `Accessibility: ${label}`,
  );
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    `Horizontal overflow: ${label}`,
  );
}

function contrast(a, b) {
  const luminance = (color) => {
    const values = color
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number);
    return values.reduce((sum, value, i) => {
      const n = value / 255;
      return (
        sum +
        [0.2126, 0.7152, 0.0722][i] * (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4)
      );
    }, 0);
  };
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (high + 0.05) / (low + 0.05);
}

async function assertReadable(locator, label, gradient = false) {
  const colors = await locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return { ink: style.color, background: style.backgroundColor, gradient: style.backgroundImage };
  });
  const surfaces = gradient ? colors.gradient.match(/rgb\([^)]+\)/g) : [colors.background];
  assert.ok(surfaces?.length, `${label}: missing color stops`);
  for (const surface of surfaces) {
    assert.ok(
      contrast(colors.ink, surface) >= 4.5,
      `${label}: contrast ${contrast(colors.ink, surface).toFixed(2)} < 4.5`,
    );
  }
}

async function seed(context, theme) {
  await context.addInitScript((theme) => {
    if (!localStorage.getItem("palette-seeded")) {
      localStorage.setItem("palette-seeded", "yes");
      localStorage.setItem(
        "pdv-mercado",
        JSON.stringify({
          version: 6,
          state: {
            products: { 123: { barcode: "123", name: "Arroz São João", price: 4.24, stock: 2 } },
            cart: [{ barcode: "123", qty: 1 }],
            sales: [],
            cashOpen: true,
            theme,
            settings: {
              storeName: "Mercadinho União",
              pixKey: "teste@example.com",
              merchantName: "Loja Teste",
              city: "SAO PAULO",
            },
          },
        }),
      );
    }
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Permission denied", "NotAllowedError");
    };
    window.Capacitor = {
      PluginHeaders: [
        {
          name: "PixNotification",
          methods: [
            "setExpectedAmount",
            "clearExpectedAmount",
            "getLastPayment",
            "isNotificationAccessGranted",
          ].map((name) => ({ name, rtype: "promise" })),
        },
      ],
      nativePromise: async (_plugin, method) =>
        method === "isNotificationAccessGranted"
          ? { granted: true }
          : method === "setExpectedAmount"
            ? { startedAt: Date.now() }
            : { found: false },
    };
  }, theme);
}

function watchErrors(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 500) failures.push(`${response.status()} ${response.url()}`);
  });
  return () => assert.deepEqual(failures, [], "Browser console/5xx errors");
}

module.exports = { scan, assertReadable, contrast, seed, watchErrors };
