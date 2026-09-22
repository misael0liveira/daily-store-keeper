import { Link, createFileRoute } from "@tanstack/react-router";
import { FileDown, Receipt, Settings, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PERIOD_LABELS,
  formatDateTime,
  periodRange,
  type PeriodKey,
} from "@/lib/periods";
import { generateSalesPdf } from "@/lib/salesPdf";
import {
  PAYMENT_LABELS,
  formatBRL,
  useStore,
  type PaymentMethod,
} from "@/store/useStore";

export const Route = createFileRoute("/vendas/")({
  head: () => ({
    meta: [
      { title: "Histórico — Mini Mercado PDV" },
      {
        name: "description",
        content:
          "Resumo semanal, quinzenal e mensal das vendas do mini mercado, com exportação em PDF.",
      },
      { property: "og:title", content: "Histórico — Mini Mercado PDV" },
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
  const deleteSale = useStore((s) => s.deleteSale);
  const [period, setPeriod] = useState<PeriodKey>("semanal");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { start, end } = useMemo(
    () => periodRange(period, from, to),
    [period, from, to]
  );

  const filtered = useMemo(
    () =>
      sales
        .filter((s) => s.timestamp >= start && s.timestamp <= end)
        .sort((a, b) => b.timestamp - a.timestamp),
    [sales, start, end]
  );

  const total = filtered.reduce((sum, s) => sum + s.total, 0);
  const byMethod = filtered.reduce<Record<string, number>>((acc, s) => {
    acc[s.method] = (acc[s.method] ?? 0) + s.total;
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
    <div className="space-y-5 px-4 pb-28 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide">Histórico</h1>
        <Button asChild variant="outline" className="h-11 gap-2">
          <Link to="/vendas/configuracoes">
            <Settings className="size-5" />
            Configurações
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
              period === p
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-accent"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {period === "personalizado" && (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-card p-4">
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

      <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total vendido
          </span>
          <span className="font-display text-4xl tracking-wide text-primary">
            {formatBRL(total)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "venda" : "vendas"} no
          período
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
            <div key={m} className="rounded-xl bg-muted/60 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                {PAYMENT_LABELS[m]}
              </p>
              <p className="font-semibold">{formatBRL(byMethod[m] ?? 0)}</p>
            </div>
          ))}
        </div>
        <Button className="h-12 w-full gap-2" onClick={exportPdf}>
          <FileDown className="size-5" />
          Gerar PDF do período
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Receipt className="size-12 text-muted-foreground" />
          <p className="font-display text-2xl tracking-wide text-muted-foreground">
            Nenhuma venda no período
          </p>
          <p className="max-w-56 text-sm text-muted-foreground">
            As vendas finalizadas no caixa aparecem aqui automaticamente.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((sale) => (
            <li
              key={sale.id}
              className="rounded-2xl border bg-card p-3 shadow-sm"
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left"
                onClick={() =>
                  setOpenId(openId === sale.id ? null : sale.id)
                }
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{formatDateTime(sale.timestamp)}</p>
                  <p className="text-sm text-muted-foreground">
                    {PAYMENT_LABELS[sale.method]} ·{" "}
                    {sale.items.reduce((n, i) => n + i.qty, 0)} itens
                  </p>
                </div>
                <span className="font-display text-2xl tracking-wide text-primary">
                  {formatBRL(sale.total)}
                </span>
              </button>

              {openId === sale.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {sale.items.map((i) => (
                    <div
                      key={i.barcode}
                      className="flex justify-between text-sm"
                    >
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
                      Pago {formatBRL(sale.paidAmount)} · Troco{" "}
                      {formatBRL(sale.change ?? 0)}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    className="h-11 w-full gap-2 text-destructive"
                    onClick={() => {
                      if (window.confirm("Excluir este registro de venda?")) {
                        deleteSale(sale.id);
                        toast.success("Venda excluída");
                      }
                    }}
                  >
                    <Trash2 className="size-5" />
                    Excluir registro
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
