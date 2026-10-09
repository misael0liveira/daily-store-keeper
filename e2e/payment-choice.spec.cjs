const assert = require("node:assert/strict");
const { scan } = require("./palette-support.cjs");
module.exports = async function choice(page, context, label) {
  await page.goto("http://127.0.0.1:4173/vender", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Pagamento", exact: true });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Pagamento", exact: true });
  await page.keyboard.press("Escape");
  await sheet.waitFor({ state: "hidden" });
  assert(await trigger.evaluate((el) => el === document.activeElement));
  await trigger.click();
  await sheet.getByRole("button", { name: "Dois meios de pagamento", exact: true }).click();
  const field = sheet.getByLabel("Valor no primeiro meio (R$)", { exact: true });
  const next = sheet.getByRole("button", { name: "Receber primeira parte", exact: true });
  for (const value of ["", "0", "-1", "20", "21", "1,001", "abc"]) {
    await field.fill(value);
    assert(await next.isDisabled(), value);
  }
  await field.fill("5");
  await sheet.getByText("Restante no segundo meio: R$ 15,00.", { exact: true }).waitFor();
  await scan(page, label + " escolha");
  await page.screenshot({ path: `navigation-screenshots/payment-choice-${label}.png` });
  await sheet.getByRole("button", { name: "Voltar", exact: true }).click();
  await sheet.getByRole("button", { name: "Cancelar", exact: true }).click();
  await sheet.waitFor({ state: "hidden" });
  assert(await trigger.evaluate((el) => el === document.activeElement));
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
  assert.equal((await read()).pendingPayments.length, 0);
  await trigger.click();
  await sheet.getByRole("button", { name: "Dois meios de pagamento", exact: true }).click();
  await field.fill("5");
  await next.click();
  assert.equal(await sheet.getByRole("button", { name: "Dividir", exact: true }).count(), 0);
  await sheet.getByRole("button", { name: "PAGO", exact: true }).click();
  await sheet.getByRole("button", { name: "Dinheiro", exact: true }).waitFor({ state: "visible" });
  assert(await sheet.getByRole("button", { name: "Dinheiro", exact: true }).isDisabled());
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("pdv-mercado")).state.pendingPayments.length === 1,
  );
  assert.equal((await read()).sales.length, 0);
  await sheet.getByRole("button", { name: "Fechar pagamento", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  await context.setOffline(true);
  await trigger.click();
  assert.equal(
    await sheet.getByRole("button", { name: "Um meio de pagamento", exact: true }).count(),
    0,
  );
  await sheet.getByRole("button", { name: "Pix", exact: true }).click();
  await sheet
    .getByText("O cliente escaneia o código para pagar R$ 15,00.", { exact: true })
    .waitFor();
  await scan(page, label + " saldo");
  await sheet.getByRole("button", { name: "Confirmar manualmente", exact: true }).click();
  await sheet.getByRole("button", { name: "Confirmar pagamento", exact: true }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("pdv-mercado")).state.sales.length === 1,
  );
  const state = await read();
  assert.deepEqual(
    state.sales[0].payments.map((p) => [p.method, p.amount]),
    [
      ["dinheiro", 5],
      ["pix", 15],
    ],
  );
  assert.equal(state.products["123"].stock, 9);
  await sheet.waitFor({ state: "hidden" });
  await context.setOffline(false);
  return 13;
};
