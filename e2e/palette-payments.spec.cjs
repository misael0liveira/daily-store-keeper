const assert = require("node:assert/strict");
const { scan, assertReadable } = require("./palette-support.cjs");

module.exports = async function payments(page, _context, label) {
  await page.getByRole("link", { name: "Caixa", exact: true }).click();
  await page.getByRole("button", { name: "Ir para pagamento" }).click();
  const sheet = page.getByRole("dialog", { name: "Pagamento", exact: true });
  for (const method of ["Dinheiro", "Pix", "Débito", "Crédito"]) {
    await sheet.getByRole("button", { name: method, exact: true }).click();
    if (method === "Pix")
      await sheet.getByRole("img", { name: "QR Code do pagamento Pix" }).waitFor();
    await assertReadable(
      sheet.getByRole("button", { name: method, exact: true }),
      `Selected ${method}`,
    );
    await scan(page, `${label} ${method}`);
    await page.screenshot({ path: `navigation-screenshots/palette-${label}-${method}.png` });
  }
  await sheet.getByRole("button", { name: "Dinheiro", exact: true }).click();
  await assertReadable(
    sheet.getByRole("button", { name: "PAGO", exact: true }),
    "PAGO gradient",
    true,
  );
  await sheet.getByRole("button", { name: "3", exact: true }).click();
  assert.ok(await sheet.getByRole("button", { name: "PAGO", exact: true }).isDisabled());
  await scan(page, `${label} valor insuficiente`);
  await sheet.getByRole("button", { name: "Limpar valor" }).click();
  await sheet.getByRole("button", { name: "PAGO", exact: true }).click();
  const success = page.getByRole("status", { name: "Pagamento recebido", exact: true });
  await success.waitFor();
  await assertReadable(success, "Payment success");
  await scan(page, `${label} confirmação`);
  await page.screenshot({ path: `navigation-screenshots/palette-${label}-sucesso.png` });
  await success.waitFor({ state: "hidden" });
  assert.equal(
    await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state.sales.length),
    1,
  );
};
