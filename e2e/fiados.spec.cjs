const assert = require("node:assert/strict");
const { scan, seed, watchErrors } = require("./palette-support.cjs");
async function fiadoSeed(context, theme) {
  await seed(context, theme);
  await context.addInitScript(() => {
    if (localStorage.getItem("fiados-seeded")) return;
    localStorage.setItem("fiados-seeded", "yes");
    const raw = JSON.parse(localStorage.getItem("pdv-mercado"));
    raw.state.products = { 123: { barcode: "123", name: "Compra teste", price: 100, stock: 10 } };
    raw.state.customers = [
      {
        id: "c1",
        name: "Joana Silva",
        contact: "(12) 99999-0001",
        creditEnabled: true,
        creditLimit: 200,
        dueDay: 28,
      },
    ];
    raw.state.sales = [
      {
        id: "old-sale",
        timestamp: 1,
        total: 80,
        method: "dinheiro",
        items: [{ barcode: "123", name: "Compra anterior", qty: 1, price: 80 }],
        payments: [],
      },
    ];
    raw.state.receivables = [
      {
        id: "old-debt",
        saleId: "old-sale",
        customerId: "c1",
        timestamp: 1,
        dueAt: "2099-01-01",
        original: 80,
        balance: 80,
        receipts: [],
      },
    ];
    localStorage.setItem("pdv-mercado", JSON.stringify(raw));
  });
}
async function pay(page, method, label) {
  const sheet = page.getByRole("dialog", { name: label });
  await sheet.waitFor();
  const methods = Array.isArray(method) ? method : [method];
  const isEntry = label.startsWith("Entrada");
  assert.equal(
    await sheet.getByRole("button", { name: "Um meio de pagamento", exact: true }).count(),
    isEntry ? 0 : 1,
  );
  if (methods.length > 1) {
    if (isEntry)
      await sheet.getByRole("button", { name: "Usar dois meios na entrada", exact: true }).click();
    else await sheet.getByRole("button", { name: "Dois meios de pagamento", exact: true }).click();
    await sheet.getByLabel("Valor no primeiro meio (R$)", { exact: true }).fill("25");
    await sheet.getByRole("button", { name: "Receber primeira parte", exact: true }).click();
  } else if (!isEntry)
    await sheet.getByRole("button", { name: "Um meio de pagamento", exact: true }).click();
  for (const current of methods) {
    await sheet.getByRole("button", { name: current, exact: true }).click();
    if (current === "Pix") {
      await sheet.getByRole("img", { name: "QR Code do pagamento Pix" }).waitFor();
      await sheet
        .getByText(
          `O cliente escaneia o código para pagar R$ ${methods.length > 1 ? "25" : "50"},00.`,
          { exact: true },
        )
        .waitFor();
    }
    await scan(page, `${label} ${current}`);
    if (isEntry && current === "Dinheiro")
      await page.screenshot({
        path: "navigation-screenshots/fiado-entry-light-320.png",
        fullPage: true,
      });
    if (current === "Dinheiro")
      await sheet.getByRole("button", { name: "PAGO", exact: true }).click();
    else {
      await sheet.getByRole("button", { name: "Confirmar manualmente", exact: true }).click();
      await sheet.getByRole("button", { name: "Confirmar pagamento", exact: true }).click();
    }
  }
}
async function purchase(page, method) {
  await page.getByRole("button", { name: /Abrir cliente Joana Silva/ }).click();
  await page.getByRole("button", { name: "Nova compra", exact: true }).click();
  await page.getByRole("button", { name: "Marcar na Conta", exact: true }).click();
  await page.getByRole("radio", { name: "Receber uma parte agora", exact: true }).check();
  await page.getByLabel("Valor a receber agora (R$)").fill("50");
  assert.equal(await page.getByLabel("Vencimento do fiado").count(), 0);
  await page.getByRole("button", { name: "Receber entrada", exact: true }).click();
  await pay(page, method, "Entrada da compra · Joana Silva");
  await page.getByRole("button", { name: "Confirmar fiado", exact: true }).waitFor();
  let state = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
  assert.equal(state.sales.length, 1);
  assert.equal(
    state.pendingPayments.reduce((n, p) => n + p.amount, 0),
    50,
  );
  assert.equal(state.products["123"].stock, 10);
  const summary = page.getByRole("dialog", { name: "Marcar na Conta — Joana Silva", exact: true });
  await summary.getByRole("radio", { name: "Marcar saldo restante", exact: true }).waitFor();
  await summary
    .getByText("Total da compra R$ 100,00 · recebido R$ 50,00", { exact: true })
    .waitFor();
  await summary.getByText("Valor a marcar R$ 50,00", { exact: true }).waitFor();
  await summary.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Marcar na Conta", exact: true }).click();
  assert.deepEqual(
    (await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state))
      .pendingPayments,
    state.pendingPayments,
    "Fechar/reabrir preserva a entrada já recebida",
  );
  await scan(page, `Resumo da entrada ${method}`);
  await page.getByRole("button", { name: "Confirmar fiado", exact: true }).click();
  await page.getByRole("status", { name: "Venda registrada", exact: true }).waitFor();
  assert(
    await page
      .getByRole("status", { name: "Venda registrada", exact: true })
      .evaluate((el) => el.contains(document.elementFromPoint(innerWidth / 2, innerHeight - 36))),
    "Confirmação do fiado deve cobrir os controles de fundo",
  );
  state = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
  assert.equal(state.receivables.find((d) => d.saleId !== "old-sale").dueAt.slice(-3), "-28");
  assert.equal(state.sales.length, 2);
  assert.equal(state.products["123"].stock, 9);
  assert.equal(
    state.receivables.reduce((n, d) => n + d.balance, 0),
    130,
  );
  assert.equal(state.pendingPayments.length, 0);
  await page
    .getByRole("status", { name: "Venda registrada", exact: true })
    .waitFor({ state: "hidden", timeout: 6000 });
}
async function receive(page, method) {
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Fiados", exact: true })
    .click();
  await page.getByRole("button", { name: /Abrir cliente Joana Silva/ }).click();
  assert(
    await page
      .getByRole("button", { name: "Receber", exact: true })
      .evaluate((el) => el.getBoundingClientRect().height >= 44),
    "Receber deve ter alvo de pelo menos44px",
  );
  await page.getByRole("button", { name: "Receber", exact: true }).click();
  await page.getByLabel("Valor a receber (R$)").fill("50");
  await page.getByRole("button", { name: "Escolher forma de pagamento", exact: true }).click();
  await pay(page, method, "Recebimento de fiado · Joana Silva");
  await page.getByRole("status", { name: "Pagamento recebido", exact: true }).waitFor();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
  assert.equal(
    state.receivables.reduce((n, d) => n + d.balance, 0),
    80,
  );
  assert.equal(state.sales.length, 2);
  assert.equal(state.products["123"].stock, 9);
  assert.equal(
    state.cashMovements.filter((m) => m.type === "debt").length,
    Array.isArray(method) ? method.length : 1,
  );
  await page
    .getByRole("status", { name: "Pagamento recebido", exact: true })
    .waitFor({ state: "hidden", timeout: 6000 });
  await page.getByRole("heading", { name: "Recebimentos", exact: true }).waitFor();
  await scan(page, "Extrato após recebimento");
}
async function identity(page) {
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Caixa", exact: true })
    .click();
  await page.getByRole("button", { name: "Selecionar cliente", exact: true }).click();
  await page.getByRole("button", { name: "Ler QR do cliente", exact: true }).click();
  await page.getByLabel("Código do cliente", { exact: true }).fill("UNIAO:CLIENTE:c1");
  await page.getByRole("button", { name: "Usar código", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar este cliente", exact: true }).click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
  assert.equal(state.currentCustomerId, "c1");
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Fiados", exact: true })
    .click();
  await page.getByRole("button", { name: "Cadastrar cliente", exact: true }).click();
  await page.getByLabel("Nome completo do cliente").fill("Ána Oliveira");
  await page.getByLabel("CPF (opcional)").fill("11111111111");
  await page.getByRole("button", { name: "Salvar cliente", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "CPF inválido" }).waitFor();
  assert.equal(await page.getByLabel("Nome completo do cliente").inputValue(), "Ána Oliveira");
  await page.getByLabel("CPF (opcional)").fill("529.982.247-25");
  await page.getByRole("button", { name: "Salvar cliente", exact: true }).click();
  await page.getByRole("heading", { name: "Ána Oliveira", exact: true }).waitFor();
  await page.getByRole("button", { name: "Cartão do cliente", exact: true }).click();
  await page.getByRole("img", { name: "QR de identificação do cliente" }).waitFor();
  await scan(page, "Cartão de identificação");
  const cardDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salvar cartão em PDF", exact: true }).click();
  const card = await cardDownload;
  const stream = await card.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  assert.equal(Buffer.concat(chunks).subarray(0, 4).toString(), "%PDF");
  await page.getByRole("button", { name: "Voltar aos clientes", exact: true }).click();
  await page.getByRole("button", { name: "Todos os clientes", exact: true }).click();
  await page.getByLabel("Buscar cliente", { exact: true }).fill("sem resultado xyz");
  await page.getByText("Nenhum cliente encontrado. Confira a busca.", { exact: true }).waitFor();
  await scan(page, "Busca sem resultados");
  await page.getByRole("button", { name: "Limpar busca de clientes" }).click();
  assert(
    await page
      .getByLabel("Buscar cliente", { exact: true })
      .evaluate((el) => el === document.activeElement),
  );
  await page.getByLabel("Buscar cliente", { exact: true }).fill("ana");
  await page.getByRole("button", { name: /Abrir cliente Ána Oliveira/ }).waitFor();
  assert(!page.url().includes("529"));
  await page.getByRole("button", { name: "Limpar busca de clientes" }).click();
  await page.getByRole("button", { name: "Com saldo", exact: true }).click();
}
async function backup(page) {
  await page.goto("http://127.0.0.1:4173/gestao?sec=dados", { waitUntil: "networkidle" });
  const original = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar backup com fotos", exact: true }).click();
  const stream = await (await downloadPromise).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  const data = JSON.parse(buffer).payload.data;
  assert.deepEqual(data.customers, original.customers);
  assert.deepEqual(data.receivables, original.receivables);
  await page
    .getByLabel("Escolher backup para conferir (até 50 MB)", { exact: false })
    .setInputFiles({ name: "fiados.json", mimeType: "application/json", buffer });
  await page.getByRole("heading", { name: "Prévia da restauração", exact: true }).waitFor();
  await page.getByRole("button", { name: "Restaurar backup", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Restaurar backup", exact: true })
    .click();
  await page.getByText("Backup restaurado", { exact: false }).waitFor();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
  assert.deepEqual(restored.customers, original.customers);
  assert.deepEqual(restored.receivables, original.receivables);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
}
async function freshQuote(page) {
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Abrir cliente Joana Silva/ }).click();
  await page.getByRole("button", { name: "Nova compra", exact: true }).click();
  await page.getByRole("button", { name: "Pagamento", exact: true }).click();
  if (await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).count())
    await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).click();
  await page.getByRole("button", { name: "Fechar pagamento", exact: true }).click();
  await page.getByRole("button", { name: "Aumentar Compra teste", exact: true }).click();
  await page.getByRole("button", { name: "Marcar na Conta", exact: true }).click();
  await page.getByRole("radio", { name: "Receber uma parte agora", exact: true }).check();
  await page.getByLabel("Valor a receber agora (R$)").fill("100");
  await page.getByRole("button", { name: "Receber entrada", exact: true }).click();
  assert.equal(
    await page.getByRole("button", { name: "Um meio de pagamento", exact: true }).count(),
    0,
  );
  await page.getByRole("button", { name: "PAGO", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirmar fiado", exact: true })
    .waitFor({ timeout: 8000 });
  await page.getByRole("button", { name: "Confirmar fiado", exact: true }).click();
  await page.getByRole("status", { name: "Venda registrada", exact: true }).waitFor();
  assert(
    await page
      .getByRole("status", { name: "Venda registrada", exact: true })
      .evaluate((el) => el.contains(document.elementFromPoint(innerWidth / 2, innerHeight - 36))),
    "Confirmação do fiado deve cobrir os controles de fundo",
  );
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
  assert.equal(state.sales[0].total, 200);
  assert.equal(state.products["123"].stock, 8);
  assert.equal(
    state.receivables.reduce((n, d) => n + d.balance, 0),
    180,
  );
}
async function creditOptions(page) {
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Abrir cliente Joana Silva/ }).click();
  await page.getByRole("button", { name: "Nova compra", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Marcar na Conta", exact: true });
  const sheet = page.getByRole("dialog", { name: "Marcar na Conta — Joana Silva", exact: true });
  await trigger.click();
  const totalChoice = sheet.getByRole("radio", { name: "Marcar valor total", exact: true });
  const partialChoice = sheet.getByRole("radio", { name: "Receber uma parte agora", exact: true });
  const confirm = sheet.getByRole("button", { name: "Confirmar fiado", exact: true });
  assert.equal(await totalChoice.getAttribute("aria-checked"), "true");
  await confirm.waitFor();
  assert.equal(await sheet.getByRole("button", { name: /Voltar/ }).count(), 0);
  assert.equal(await sheet.getByText(/pago R\$/).count(), 0);
  await sheet.getByText("Valor a marcar R$ 100,00", { exact: true }).waitFor();
  const untouched = await read();
  await totalChoice.focus();
  await page.keyboard.down("ArrowDown");
  await page.waitForFunction(
    () => document.getElementById("credit-partial")?.getAttribute("aria-checked") === "true",
  );
  await page.keyboard.up("ArrowDown");
  assert.equal(await partialChoice.getAttribute("aria-checked"), "true");
  await sheet.getByLabel("Valor a receber agora (R$)").fill("50");
  await sheet.getByText("Valor a marcar R$ 50,00", { exact: true }).waitFor();
  await totalChoice.check();
  await sheet.getByText("Valor a marcar R$ 100,00", { exact: true }).waitFor();
  assert.deepEqual(await read(), untouched, "Alternar escolhas não grava nem cobra");
  for (const choice of [totalChoice, partialChoice]) {
    const box = await choice.boundingBox();
    assert(Math.abs(box.width - box.height) <= 1, "Radio mantém círculo sem altura de botão");
  }
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.activeElement?.textContent === "Marcar na Conta");
  assert.deepEqual(await read(), untouched);
  await trigger.click();
  assert.equal(await sheet.getByLabel("Vencimento do fiado").count(), 0);
  const expected = await page.evaluate(() => {
    const n = new Date();
    const month = n.getDate() < 28 ? n.getMonth() : n.getMonth() + 1;
    const d = new Date(n.getFullYear(), month, 28);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-28`;
  });
  await sheet
    .getByText(`Vencimento desta compra ${expected.split("-").reverse().join("/")}`, {
      exact: true,
    })
    .waitFor();
  await scan(page, "Fiado integral e vencimento cadastral");
  await page.screenshot({
    path: "navigation-screenshots/fiado-summary-dark-320.png",
    fullPage: true,
  });
  const original = await read();
  await sheet.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.waitForFunction(() => document.activeElement?.textContent === "Marcar na Conta");
  assert.deepEqual((await read()).receivables, original.receivables);
  assert.equal((await read()).sales.length, original.sales.length);
  await trigger.click();
  await sheet.getByRole("radio", { name: "Receber uma parte agora", exact: true }).check();
  const input = sheet.getByLabel("Valor a receber agora (R$)");
  const receive = sheet.getByRole("button", { name: "Receber entrada", exact: true });
  for (const invalid of ["", "0", "-1", "100", "101", "1,001", "abc"]) {
    await input.fill(invalid);
    await receive.click();
    await sheet.getByRole("alert").waitFor();
    assert.equal((await read()).pendingPayments.length, 0);
  }
  await input.fill("1");
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("pdv-mercado"));
    s.state.customers[0].creditLimit = 100;
    localStorage.setItem("pdv-mercado", JSON.stringify(s));
  });
  await page.reload({ waitUntil: "networkidle" });
  await trigger.click();
  await sheet.getByRole("radio", { name: "Receber uma parte agora", exact: true }).check();
  await input.fill("1");
  await receive.click();
  await sheet
    .getByRole("alert")
    .filter({ hasText: "O novo saldo ultrapassa o limite de fiado." })
    .waitFor();
  assert.equal((await read()).pendingPayments.length, 0);
  await input.fill("90");
  await receive.click();
  const payment = page.getByRole("dialog", {
    name: "Entrada da compra · Joana Silva",
    exact: true,
  });
  await payment.getByRole("button", { name: "PAGO", exact: true }).waitFor();
  assert.equal(
    await payment.getByRole("button", { name: "Um meio de pagamento", exact: true }).count(),
    0,
  );
  await payment.getByRole("button", { name: "Usar dois meios na entrada", exact: true }).click();
  await payment.getByRole("button", { name: "Voltar", exact: true }).click();
  await payment.getByRole("button", { name: "PAGO", exact: true }).waitFor();
  await payment.getByRole("button", { name: "Fechar pagamento", exact: true }).click();
  // Restore the credit limit, preserving all local records; preview cancellation charged nothing.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("pdv-mercado"));
    s.state.customers[0].creditLimit = 200;
    localStorage.setItem("pdv-mercado", JSON.stringify(s));
  });
  await page.reload({ waitUntil: "networkidle" });
  await trigger.click();
  await sheet.getByRole("radio", { name: "Marcar valor total", exact: true }).check();
  await sheet.getByRole("button", { name: "Alterar vencimento desta compra", exact: true }).click();
  await sheet.getByLabel("Vencimento do fiado").fill("2099-12-01");
  await sheet.getByRole("button", { name: "Confirmar fiado", exact: true }).evaluate((button) => {
    button.click();
    button.click();
  });
  await page.getByRole("status", { name: "Venda registrada", exact: true }).waitFor();
  const saved = await read();
  assert.equal(saved.customers[0].dueDay, 28);
  assert.equal(saved.sales.length, original.sales.length + 1);
  assert.equal(saved.products["123"].stock, 9);
  assert.equal(saved.receivables.find((d) => d.saleId !== "old-sale").dueAt, "2099-12-01");
  assert.equal(
    saved.receivables.reduce((n, d) => n + d.balance, 0),
    180,
  );
  return 20;
}
module.exports = {
  creditOptions,
  freshQuote,
  fiadoSeed,
  purchase,
  receive,
  identity,
  backup,
  scan,
  watchErrors,
};
