const assert = require("node:assert/strict");
const { scan } = require("./palette-support.cjs");

module.exports = async function nativeAppearance(page, _context, label) {
  const opening = page.getByRole("status", { name: "Abrindo Mercadinho União" });
  await opening.waitFor();
  assert.equal(
    await opening.evaluate((el) => getComputedStyle(el).backgroundColor),
    "rgb(255, 255, 255)",
  );
  assert.equal(
    await page.evaluate(() => window.testBarStyles.length),
    0,
    "No dark-theme icons over the white startup screen",
  );
  await scan(page, `${label} abertura`);
  await opening.waitFor({ state: "hidden" });
  const initial = label.startsWith("dark") ? "DARK" : "LIGHT";
  await page.waitForFunction((style) => window.testBarStyles.at(-1) === style, initial);
  await scan(page, `${label} tema Android`);
  await page.getByRole("link", { name: "Ajustes", exact: true }).click();
  await page.getByRole("switch", { name: "Tema escuro", exact: true }).click();
  const changed = initial === "DARK" ? "LIGHT" : "DARK";
  await page.waitForFunction((style) => window.testBarStyles.at(-1) === style, changed);
  await scan(page, `${label} troca do tema Android`);
  const before = await page.evaluate(() => window.testBarStyles.length);
  await page.evaluate(() => {
    for (const callback of Object.values(window.testResumeListeners)) callback();
  });
  await page.waitForFunction((count) => window.testBarStyles.length > count, before);
  assert.equal(
    await page.evaluate(() => window.testBarStyles.at(-1)),
    changed,
    "Resume preserves current system icon style",
  );
};
