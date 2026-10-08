const assert = require("node:assert/strict");
const { scan } = require("./palette-support.cjs");

module.exports = async function stock(page, _context, label) {
  await page.getByRole("link", { name: "Estoque", exact: true }).click();
  const search = page.getByRole("textbox", { name: "Buscar no estoque" });
  await search.fill("São João");
  await page.getByRole("button", { name: /Arroz São João/ }).click();
  const editor = page.getByRole("dialog", { name: "Editar produto", exact: true });
  await editor
    .getByRole("textbox", { name: "Nome do produto", exact: true })
    .fill("Arroz São João 🛒");
  await scan(page, `${label} editor de produto`);
  await page.screenshot({ path: `navigation-screenshots/palette-${label}-editor.png` });
  await page.keyboard.press("Escape");
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("pdv-mercado")).state.products["123"].name,
    ),
    "Arroz São João",
    "Cancel must retain persisted data",
  );
  await page.getByRole("button", { name: "Promoção", exact: true }).click();
  await page.getByRole("textbox", { name: "Buscar produto para promoção" }).fill("São João");
  await page.getByRole("button", { name: /Arroz São João/ }).click();
  await page.getByRole("button", { name: "Prosseguir", exact: true }).click();
  const promotion = page.getByRole("dialog", { name: "Aplicar promoção", exact: true });
  await promotion.getByRole("button", { name: "Aplicar promoção", exact: true }).click();
  await promotion.getByRole("alert").waitFor();
  await scan(page, `${label} validação da promoção`);
  await promotion.getByRole("textbox", { name: "Desconto (%)", exact: true }).fill("10");
  await promotion.getByRole("radio", { name: "Enquanto durar o estoque", exact: true }).check();
  await scan(page, `${label} preço verde e desconto`);
  await page.screenshot({ path: `navigation-screenshots/palette-${label}-promocao.png` });
  await page.keyboard.press("Escape");
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("pdv-mercado")).state.products["123"].promotion,
    ),
    undefined,
    "Cancel must not apply discount",
  );
};
