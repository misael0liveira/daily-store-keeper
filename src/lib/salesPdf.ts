import { formatDate, formatDateTime } from "@/lib/periods";
import { PAYMENT_LABELS, formatBRL, type Sale } from "@/store/useStore";

export async function generateSalesPdf({
  sales,
  storeName,
  periodLabel,
  start,
  end,
}: {
  sales: Sale[];
  storeName: string;
  periodLabel: string;
  start: number;
  end: number;
}) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ordered = [...sales].sort((a, b) => a.timestamp - b.timestamp);
  const total = ordered.reduce((sum, s) => sum + s.total, 0);

  doc.setFontSize(18);
  doc.text(storeName || "Mini Mercado", 40, 48);
  doc.setFontSize(11);
  doc.text(`Relatório de vendas — ${periodLabel}`, 40, 68);
  doc.text(
    `Período: ${start ? formatDate(start) : "início"} a ${formatDate(end)}`,
    40,
    84
  );
  doc.text(
    `Vendas: ${ordered.length}    Total: ${formatBRL(total)}`,
    40,
    100
  );

  const byMethod = ordered.reduce<Record<string, number>>((acc, s) => {
    acc[s.method] = (acc[s.method] ?? 0) + s.total;
    return acc;
  }, {});

  autoTable(doc, {
    startY: 118,
    head: [["Forma de pagamento", "Total"]],
    body: Object.entries(byMethod).map(([method, value]) => [
      PAYMENT_LABELS[method as Sale["method"]] ?? method,
      formatBRL(value),
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  autoTable(doc, {
    head: [["Data", "Itens", "Pagamento", "Total"]],
    body: ordered.map((s) => [
      formatDateTime(s.timestamp),
      s.items.map((i) => `${i.qty}x ${i.name}`).join(", "),
      PAYMENT_LABELS[s.method],
      formatBRL(s.total),
    ]),
    styles: { fontSize: 9, cellWidth: "wrap" },
    columnStyles: { 1: { cellWidth: 240 } },
    headStyles: { fillColor: [59, 130, 246] },
  });

  const fileName = `vendas-${periodLabel
    .toLowerCase()
    .replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
