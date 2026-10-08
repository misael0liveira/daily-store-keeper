import QRCode from "qrcode";
import {
  customerBalance,
  formatBRL,
  PAYMENT_LABELS,
  type Customer,
  type StoreState,
  type Sale,
} from "@/store/useStore";
export const customerQrPayload = (c: Customer) => `UNIAO:CLIENTE:${c.id}`;
export async function downloadCustomerCard(c: Customer) {
  const { jsPDF } = await import("jspdf");
  const qr = await QRCode.toDataURL(customerQrPayload(c), {
    width: 480,
    margin: 3,
    errorCorrectionLevel: "M",
  });
  const pdf = new jsPDF({ unit: "mm", format: [90, 130] });
  pdf.setFontSize(16);
  pdf.text("Mercadinho União", 45, 15, { align: "center" });
  pdf.setFontSize(11);
  pdf.text(pdf.splitTextToSize(c.name, 75), 45, 28, { align: "center" });
  pdf.addImage(qr, "PNG", 15, 40, 60, 60);
  pdf.text(c.code ?? "", 45, 110, { align: "center" });
  pdf.setFontSize(8);
  pdf.text("Identificação do cliente", 45, 120, { align: "center" });
  pdf.save(`Cartao-${c.code ?? "cliente"}.pdf`);
}
export async function downloadCustomerReceipt(
  state: StoreState,
  c: Customer,
  receiptId?: string,
  sale?: Sale,
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  let y = 18;
  const line = (text: string) => {
    for (const part of pdf.splitTextToSize(text, 175)) {
      if (y > 275) {
        pdf.addPage();
        y = 18;
      }
      pdf.text(part, 16, y);
      y += 7;
    }
  };
  pdf.setFontSize(12);
  line(state.settings.storeName);
  line(sale ? "Comprovante de compra — não fiscal" : "Recibo de fiado — não fiscal");
  line(`${c.name} · ${c.code ?? ""}`);
  if (sale) {
    line(new Date(sale.timestamp).toLocaleString("pt-BR"));
    for (const i of sale.items) line(`${i.qty} × ${i.name}: ${formatBRL(i.qty * i.price)}`);
    line(`Total: ${formatBRL(sale.total)}`);
    line(`Pago: ${formatBRL((sale.payments ?? []).reduce((n, p) => n + p.amount, 0))}`);
    const debt = state.receivables.find((d) => d.saleId === sale.id);
    if (debt)
      line(
        `Fiado da compra: ${formatBRL(debt.original)} · vencimento ${debt.dueAt.split("-").reverse().join("/")}`,
      );
  } else {
    const receipts = state.receivables
      .filter((d) => d.customerId === c.id)
      .flatMap((d) => d.receipts.filter((r) => r.id === receiptId));
    const first = receipts[0];
    if (!first) throw new Error("Recebimento não encontrado.");
    line(new Date(first.timestamp).toLocaleString("pt-BR"));
    line(
      `Recebido: ${formatBRL(receipts.reduce((n, r) => n + r.amount, 0))} · ${PAYMENT_LABELS[first.method]}`,
    );
  }
  line(`Saldo atual em aberto: ${formatBRL(customerBalance(state, c.id))}`);
  pdf.save(`Comprovante-${c.code ?? "cliente"}.pdf`);
}
