import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, FileDown, Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaleReturnAction } from "@/components/SaleReturnAction";
import { PERIOD_LABELS, formatDateTime, periodRange, type PeriodKey } from "@/lib/periods";
import { generateSalesPdf } from "@/lib/salesPdf";
import {
  PAYMENT_LABELS,
  canOperate,
  formatBRL,
  saleNet,
  salePayments,
  saleMethodLabel,
  useStore,
  type PaymentMethod,
} from "@/store/useStore";

export const Route = createFileRoute("/vendas/")({
  head: () => ({
    meta: [
      { title: "Histórico — Mercadinho União" },
      {
        name: "description",
        content:
          "Resumo semanal, quinzenal e mensal das vendas do mini mercado, com exportação em PDF.",
      },
      { property: "og:title", content: "Histórico — Mercadinho União" },
      {
        property: "og:description",
        content: "Saídas registradas por forma de pagamento e relatório em PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VendasPage,
});

const periods: PeriodKey[] = ["semanal", "quinzenal", "mensal", "personalizado", "tudo"];

function VendasPage() {
  const sales = useStore((s) => s.sales);
  const settings = useStore((s) => s.settings);
  const state = useStore();
  const [period, setPeriod] = useState<PeriodKey>("semanal");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { start, end } = useMemo(() => periodRange(period, from, to), [period, from, to]);

  const filtered = useMemo(
    () =>
      sales
        .filter((s) => s.timestamp >= start && s.timestamp <= end)
        .sort((a, b) => b.timestamp - a.timestamp),
    [sales, start, end],
  );

  const total = filtered.reduce((sum, s) => sum + saleNet(s), 0);
  const byMethod = filtered.reduce<Record<string, number>>((acc, s) => {
    for (const p of salePayments(s)) {
      acc[p.method] = (acc[p.method] ?? 0) + p.amount;
    }
    for (const r of state.returns.filter((r) => r.saleId === s.id)) {
      acc[r.refundMethod] = (acc[r.refundMethod] ?? 0) - (r.amount - r.debtReduction);
    }
    return acc;
  }, {});

  const exportPdf = async () => {
    if (filtered.length === 0) {
      toast.error("Nenhuma venda no período escolhido");
      return;
    }
    try {
      await generateSalesPdf({
        sales: filtered,
        storeName: settings.storeName,
        periodLabel: PERIOD_LABELS[period],
        start,
        end,
      });
      toast.success("PDF gerado!");
    } catch {
      toast.error("Não foi possível gerar o PDF");
    }
  };

  return (
    <div className="pos-page pos-history">
      <header className="pos-header">
        <h1>Histórico</h1>
      </header>

      <div className="pos-periods" aria-label="Período do histórico">
        {periods.map((p) => (
          <button key={p} type="button" onClick={() => setPeriod(p)} aria-pressed={period === p}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {period === "personalizado" && (
        <div className="pos-card pos-date-range grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="from">De</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">Até</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-12"
            />
          </div>
        </div>
      )}

      <section className="pos-card pos-history-summary" aria-labelledby="history-total-title">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            <span id="history-total-title">Total vendido líquido</span>
          </span>
          <strong className="pos-history-total">{formatBRL(total)}</strong>
        </div>
        {filtered.length > 0 && (
          <>
            <p className="pos-history-count">
              {filtered.length} {filtered.length === 1 ? "venda" : "vendas"} no período
            </p>
            <div className="pos-payment-summary">
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                <div key={m}>
                  <p>{PAYMENT_LABELS[m]}</p>
                  <strong>{formatBRL(byMethod[m] ?? 0)}</strong>
                </div>
              ))}
            </div>
            <Button variant="outline" className="pos-history-export" onClick={exportPdf}>
              <FileDown className="size-5" />
              Gerar PDF
            </Button>
          </>
        )}
      </section>

      {filtered.length === 0 ? (
        <div className="pos-history-empty">
          <span className="pos-empty-icon">
            <Receipt aria-hidden="true" />
          </span>
          <p>Nenhuma venda no período</p>
          <span>As vendas finalizadas no caixa aparecem aqui automaticamente.</span>
        </div>
      ) : (
        <ul className="pos-sales-list">
          {filtered.map((sale) => (
            <li key={sale.id} className="pos-sale-card">
              <button
                type="button"
                className="pos-sale-trigger"
                aria-expanded={openId === sale.id}
                onClick={() => setOpenId(openId === sale.id ? null : sale.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{formatDateTime(sale.timestamp)}</p>
                  <p className="text-sm text-muted-foreground">
                    {saleMethodLabel(sale)} · {sale.items.reduce((n, i) => n + i.qty, 0)} itens
                  </p>
                </div>
                <span className="pos-sale-value">{formatBRL(sale.total)}</span>
                {openId === sale.id ? (
                  <ChevronUp aria-hidden="true" />
                ) : (
                  <ChevronDown aria-hidden="true" />
                )}
              </button>

              {openId === sale.id && (
                <div className="pos-sale-details">
                  {sale.items.map((i) => (
                    <div key={i.barcode} className="flex justify-between text-sm">
                      <span className="min-w-0 truncate">
                        {i.qty}x {i.name}
                      </span>
                      <span className="shrink-0 pl-3 text-muted-foreground">
                        {formatBRL(i.price * i.qty)}
                      </span>
                    </div>
                  ))}
                  {sale.paidAmount != null && (
                    <p className="text-sm text-muted-foreground">
                      Pago {formatBRL(sale.paidAmount)} · Troco {formatBRL(sale.change ?? 0)}
                    </p>
                  )}
                  <p className="text-sm font-semibold">
                    {sale.status === "cancelled"
                      ? "Venda cancelada"
                      : sale.refundedAmount
                        ? `Devolvido: ${formatBRL(sale.refundedAmount)}`
                        : "Venda registrada"}{" "}
                    · Líquido {formatBRL(saleNet(sale))}
                  </p>
                  {salePayments(sale).map((p) => (
                    <p key={p.id} className="text-sm text-muted-foreground">
                      {PAYMENT_LABELS[p.method]} · {formatBRL(p.amount)} ·{" "}
                      {p.source === "notification" ? "Notificação" : "Conferência manual"}
                      {p.bank ? ` · ${p.bank}` : ""}
                    </p>
                  ))}
                  {canOperate(state, "returns") ? (
                    <SaleReturnAction sale={sale} />
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() =>
                        void import("@/lib/receipts")
                          .then((m) => m.generateReceiptPdf(sale, settings.storeName))
                          .catch(() => toast.error("Não foi possível gerar comprovante."))
                      }
                    >
                      Comprovante PDF
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
