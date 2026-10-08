const assert = require("node:assert/strict");
const { scan, assertReadable } = require("./palette-support.cjs");

module.exports = async function navigation(page, context, label) {
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  for (const route of ["Início", "Histórico", "Caixa", "Estoque", "Ajustes"]) {
    await nav.getByRole("link", { name: route, exact: true }).click();
    await scan(page, `${label} ${route}`);
    await page.screenshot({ path: `navigation-screenshots/palette-${label}-${route}.png` });
  }
  await page.getByRole("link", { name: /Configurações/ }).click();
  const active = page.getByText("Monitoramento de notificações ativo", { exact: true });
  await active.waitFor();
  const status = await active.evaluate((element) => {
    const root = getComputedStyle(document.documentElement);
    const probe = document.createElement("span");
    probe.style.color = "var(--success)";
    element.appendChild(probe);
    const result = {
      defined: root.getPropertyValue("--success").trim(),
      actual: getComputedStyle(element).color,
      expected: getComputedStyle(probe).color,
    };
    probe.remove();
    return result;
  });
  assert.ok(status.defined, "Success status has no canonical color");
  assert.equal(status.actual, status.expected, "Success utility is missing");
  await scan(page, `${label} configurações e QR`);
  await nav.getByRole("link", { name: "Início", exact: true }).click();
  await assertReadable(
    page.getByRole("link", { name: "Nova venda", exact: true }),
    "Primary action",
  );
  await nav.getByRole("link", { name: "Ajustes", exact: true }).click();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Verificar atualização", exact: true }).click();
  await page.getByText("Sem internet agora", { exact: true }).waitFor();
  await scan(page, `${label} aviso offline`);
  await page.screenshot({ path: `navigation-screenshots/palette-${label}-offline.png` });
  await context.setOffline(false);
  await page.getByRole("switch", { name: "Tema escuro", exact: true }).focus();
  await page.keyboard.press("Space");
  const theme = await page.evaluate(
    () => JSON.parse(localStorage.getItem("pdv-mercado")).state.theme,
  );
  await nav.getByRole("link", { name: "Início", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  await nav.waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.classList.contains("dark")),
    theme === "dark",
    "Theme must survive reload",
  );
  await scan(page, `${label} tema persistido`);
};
