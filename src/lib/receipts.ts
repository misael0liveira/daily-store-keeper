import { formatDateTime } from "@/lib/periods";
import {
  PAYMENT_LABELS,
  formatBRL,
  getProductPricing,
  saleNet,
  salePayments,
  type Product,
  type Sale,
} from "@/store/useStore";
export async function generateReceiptPdf(sale: Sale, storeName: string) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(18);
  doc.text(storeName, 40, 48);
  doc.setFontSize(11);
  doc.text(`Comprovante de venda · ${sale.id.slice(0, 12)}`, 40, 70);
  doc.text(formatDateTime(sale.timestamp), 40, 90);
  doc.text(`Situação: ${sale.status === "cancelled" ? "Cancelada" : "Registrada"}`, 40, 108);
  autoTable(doc, {
    startY: 128,
    head: [["Produto", "Quantidade", "Preço", "Total"]],
    body: sale.items.map((i) => [
      i.name,
      String(i.qty),
      formatBRL(i.price),
      formatBRL(i.price * i.qty),
    ]),
    styles: { fontSize: 10 },
  });
  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  doc.text(
    `Total original: ${formatBRL(sale.total)} · Devolvido: ${formatBRL(sale.refundedAmount ?? 0)} · Líquido: ${formatBRL(saleNet(sale))}`,
    40,
    y,
  );
  autoTable(doc, {
    startY: y + 16,
    head: [["Pagamento", "Valor aplicado", "Troco", "Confirmação"]],
    body: salePayments(sale).map((p) => [
      PAYMENT_LABELS[p.method],
      formatBRL(p.amount),
      formatBRL(p.change ?? 0),
      p.source === "notification" ? "Notificação" : "Conferência manual",
    ]),
    styles: { fontSize: 10 },
  });
  doc.setFontSize(9);
  const end = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  doc.text("Comprovante não fiscal. Reimprimir não registra outra venda.", 40, end);
  doc.save(`comprovante-${sale.id.slice(0, 12)}.pdf`);
}
export async function generateLabelsPdf(products: Product[], storeName: string) {
  if (!products.length) throw new Error("Nenhum produto ativo para gerar etiquetas.");
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  products.forEach((p, index) => {
    if (index && index % 12 === 0) doc.addPage();
    const slot = index % 12;
    const x = 32 + (slot % 2) * 270;
    const y = 32 + Math.floor(slot / 2) * 120;
    doc.rect(x, y, 258, 108);
    doc.setFontSize(9);
    doc.text(storeName, x + 10, y + 16);
    doc.setFontSize(12);
    doc.text(doc.splitTextToSize(p.name, 230).slice(0, 2), x + 10, y + 36);
    doc.setFontSize(20);
    doc.text(formatBRL(getProductPricing(p).price), x + 10, y + 80);
    doc.setFontSize(8);
    doc.text(`${p.unit ?? "un"} · Código ${p.barcode}`, x + 10, y + 98);
  });
  doc.save("etiquetas-precos.pdf");
}
