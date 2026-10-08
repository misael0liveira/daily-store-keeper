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
  for (const [index, current] of methods.entries()) {
    await sheet.getByRole("button", { name: current, exact: true }).click();
    if (methods.length > 1 && index === 0) {
      await sheet.getByRole("button", { name: "Dividir", exact: true }).click();
      await sheet.getByLabel("Valor desta parcela (R$)", { exact: true }).fill("25");
      await sheet.getByRole("button", { name: "Usar valor da parcela", exact: true }).click();
    }
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
  await page.getByRole("button", { name: "Pagar parte e fiar o restante", exact: true }).click();
  await page.getByLabel("Valor a receber agora (R$)").fill("50");
  await page.getByLabel("Vencimento do fiado").fill("2099-12-01");
  await page.getByRole("button", { name: "Receber entrada", exact: true }).click();
  await pay(page, method, "Entrada da compra · Joana Silva");
  await page.getByRole("button", { name: "Registrar venda com fiado", exact: true }).waitFor();
  let state = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
  assert.equal(state.sales.length, 1);
  assert.equal(
    state.pendingPayments.reduce((n, p) => n + p.amount, 0),
    50,
  );
  assert.equal(state.products["123"].stock, 10);
  await scan(page, `Resumo da entrada ${method}`);
  await page.getByRole("button", { name: "Registrar venda com fiado", exact: true }).click();
  await page.getByRole("status", { name: "Venda registrada", exact: true }).waitFor();
  assert(
    await page
      .getByRole("status", { name: "Venda registrada", exact: true })
      .evaluate((el) => el.contains(document.elementFromPoint(innerWidth / 2, innerHeight - 36))),
    "Confirmação do fiado deve cobrir os controles de fundo",
  );
  state = await page.evaluate(() => JSON.parse(localStorage.getItem("pdv-mercado")).state);
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
  await page.getByRole("button", { name: "Ir para pagamento", exact: true }).click();
  await page.getByRole("button", { name: "Fechar pagamento", exact: true }).click();
  await page.getByRole("button", { name: "Aumentar Compra teste", exact: true }).click();
  await page.getByRole("button", { name: "Pagar parte e fiar o restante", exact: true }).click();
  await page.getByLabel("Valor a receber agora (R$)").fill("100");
  await page.getByRole("button", { name: "Receber entrada", exact: true }).click();
  await page.getByRole("button", { name: "PAGO", exact: true }).click();
  await page
    .getByRole("button", { name: "Registrar venda com fiado", exact: true })
    .waitFor({ timeout: 8000 });
  await page.getByRole("button", { name: "Registrar venda com fiado", exact: true }).click();
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
module.exports = { freshQuote, fiadoSeed, purchase, receive, identity, backup, scan, watchErrors };
