import { formatStockQuantity, purchaseLabel, type Replenishment } from "@/lib/stockReplenishment";
import type { Settings } from "@/store/useStore";

export function replenishmentText(rows: Replenishment[], settings: Settings, now = Date.now()) {
  const lines = [
    settings.storeName,
    "Lista de compras — reposição",
    new Date(now).toLocaleString("pt-BR"),
    `Base: vendas líquidas dos últimos 30 dias. Ciclo: ${settings.wholesaleCycleDays ?? 7} dias; segurança: ${settings.stockSafetyDays ?? 2} dias.`,
    `${rows.length} produtos nesta lista.`,
    "",
  ];
  for (const r of rows) {
    const unit = r.product.unit ?? "un";
    lines.push(
      `${r.product.name} · código ${r.product.barcode}`,
      `Comprar: ${purchaseLabel(r)} · Saldo: ${formatStockQuantity(r.product.stock)} ${unit}`,
      `Mínimo: ${formatStockQuantity(r.minimum)} ${unit} · Alvo: ${formatStockQuantity(r.target)} ${unit}`,
      ...(r.sold30 === 0
        ? ["Sem vendas registradas nos últimos 30 dias; confira a necessidade."]
        : []),
      "",
    );
  }
  return lines.join("\n");
}

export async function downloadReplenishmentPdf(rows: Replenishment[], settings: Settings) {
  if (!rows.length) throw new Error("Nenhum produto na lista de compras.");
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const pdf = new jsPDF();
  pdf.setFontSize(16);
  const title = pdf.splitTextToSize(settings.storeName, 175);
  pdf.text(title, 16, 18);
  const y = 18 + title.length * 7;
  pdf.setFontSize(11);
  pdf.text("Lista de compras — reposição", 16, y);
  pdf.setFontSize(9);
  pdf.text(new Date().toLocaleString("pt-BR"), 16, y + 7);
  pdf.text(
    `Últimos 30 dias · Ciclo ${settings.wholesaleCycleDays ?? 7} dias · Segurança ${settings.stockSafetyDays ?? 2} dias`,
    16,
    y + 14,
  );
  autoTable(pdf, {
    startY: y + 21,
    head: [["Produto / código", "Saldo", "Mínimo", "Alvo", "Comprar"]],
    body: rows.map((r) => [
      `${r.product.name}\n${r.product.barcode}${r.sold30 === 0 ? "\nSem vendas nos últimos 30 dias" : ""}`,
      `${formatStockQuantity(r.product.stock)} ${r.product.unit ?? "un"}`,
      formatStockQuantity(r.minimum),
      formatStockQuantity(r.target),
      purchaseLabel(r),
    ]),
    styles: { fontSize: 9, overflow: "linebreak" },
    margin: { left: 16, right: 16, bottom: 18 },
    didDrawPage: (data) => {
      pdf.setFontSize(8);
      pdf.text(
        `Sugestão para conferência · Página ${data.pageNumber}`,
        16,
        pdf.internal.pageSize.getHeight() - 8,
      );
    },
  });
  pdf.save("Lista-de-compras-Mercadinho.pdf");
}
