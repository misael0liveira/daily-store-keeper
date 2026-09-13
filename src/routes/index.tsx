import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  Clock3,
  PackageX,
  Power,
  ReceiptText,
  ScanLine,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PAYMENT_LABELS, formatBRL, useStore } from "@/store/useStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Mini Market POS" },
      {
        name: "description",
        content: "Resumo de hoje, situação do caixa, estoque e últimas vendas do mini mercado.",
      },
      { property: "og:title", content: "Início — Mini Market POS" },
      {
        property: "og:description",
        content: "Painel operacional do mini mercado com vendas e estoque em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

const HOUR_START = 6;
const HOUR_END = 22;

function dayBounds(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  const start = date.getTime();
  return { start, end: start + 86_400_000 - 1 };
}

function DashboardPage() {
  const sales = useStore((s) => s.sales);
  const products = useStore((s) => s.products);
  const cashOpen = useStore((s) => s.cashOpen);
  const toggleCash = useStore((s) => s.toggleCash);

  const data = useMemo(() => {
    const todayBounds = dayBounds();
    const yesterdayBounds = dayBounds(-1);
    const today = sales
      .filter((sale) => sale.timestamp >= todayBounds.start && sale.timestamp <= todayBounds.end)
      .sort((a, b) => b.timestamp - a.timestamp);
    const yesterday = sales.filter(
      (sale) => sale.timestamp >= yesterdayBounds.start && sale.timestamp <= yesterdayBounds.end,
    );
    const revenue = today.reduce((sum, sale) => sum + sale.total, 0);
    const yesterdayRevenue = yesterday.reduce((sum, sale) => sum + sale.total, 0);
    const hourly = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, index) => {
      const hour = HOUR_START + index;
      return today
        .filter((sale) => new Date(sale.timestamp).getHours() === hour)
        .reduce((sum, sale) => sum + sale.total, 0);
    });
    const allProducts = Object.values(products);
    const outOfStock = allProducts.filter((product) => product.stock === 0);
    const lowStock = allProducts.filter((product) => product.stock > 0 && product.stock <= 5);
    return {
      today,
      revenue,
      yesterdayRevenue,
      average: today.length ? revenue / today.length : 0,
      hourly,
      outOfStock,
      lowStock,
    };
  }, [products, sales]);

  const change =
    data.yesterdayRevenue > 0
      ? ((data.revenue - data.yesterdayRevenue) / data.yesterdayRevenue) * 100
      : null;
  const maxHour = Math.max(...data.hourly, 1);
  const saleWord = data.today.length === 1 ? "venda" : "vendas";

  return (
    <div className="space-y-6 px-4 pb-28 pt-5">
      <section aria-labelledby="today-title">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Visão operacional</p>
            <h1 id="today-title" className="mt-1 text-xl font-extrabold">Hoje</h1>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date())}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground">Faturamento</p>
          <p className="mt-1 text-4xl font-extrabold text-foreground">{formatBRL(data.revenue)}</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            {change == null ? (
              <span className="text-muted-foreground">Sem vendas ontem para comparar</span>
            ) : (
              <span className={`inline-flex items-center gap-1 font-semibold ${change >= 0 ? "text-success" : "text-destructive"}`}>
                {change >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                {Math.abs(change).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs. ontem
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Vendas</p>
              <p className="mt-1 text-xl font-bold">{data.today.length}</p>
            </div>
            <div className="border-l pl-4">
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="mt-1 text-xl font-bold">{formatBRL(data.average)}</p>
            </div>
          </div>

          <div className="mt-5" aria-label="Vendas por hora de hoje">
            <div className="flex h-20 items-end gap-1.5 border-b border-dashed">
              {data.hourly.map((value, index) => (
                <div
                  key={HOUR_START + index}
                  className="min-h-1 flex-1 rounded-t-sm bg-primary/80 transition-[height]"
                  style={{ height: `${Math.max((value / maxHour) * 100, 4)}%` }}
                  title={`${HOUR_START + index}h: ${formatBRL(value)}`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>06h</span><span>10h</span><span>14h</span><span>18h</span><span>22h</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="actions-title">
        <h2 id="actions-title" className="mb-3 text-base font-bold">Ações rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="col-span-2 h-16 justify-between rounded-2xl px-5 text-base shadow-action">
            <Link to="/vender">
              <span className="flex items-center gap-3"><ScanLine className="size-6" /> Nova venda</span>
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-14 rounded-2xl bg-card">
            <Link to="/estoque"><Boxes className="size-5" /> Estoque</Link>
          </Button>
          <Button
            variant={cashOpen ? "outline" : "default"}
            className="h-14 rounded-2xl bg-card"
            onClick={toggleCash}
          >
            <Power className="size-5" /> {cashOpen ? "Fechar caixa" : "Abrir caixa"}
          </Button>
        </div>
      </section>

      <section aria-labelledby="alerts-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="alerts-title" className="text-base font-bold">Alertas operacionais</h2>
          <Button asChild variant="link" className="h-auto p-0 text-xs"><Link to="/estoque">Ver estoque</Link></Button>
        </div>
        {data.lowStock.length === 0 && data.outOfStock.length === 0 ? (
          <div className="rounded-2xl border bg-card px-4 py-4 text-sm text-muted-foreground shadow-soft">
            Estoque sem alertas no momento.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
            {data.outOfStock.length > 0 && (
              <Link to="/estoque" className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span className="grid size-10 place-items-center rounded-xl bg-destructive/10"><PackageX className="size-5 text-destructive" /></span>
                <span className="min-w-0"><strong className="block text-sm">Itens sem estoque</strong><span className="block truncate text-xs text-muted-foreground">{data.outOfStock.slice(0, 2).map((p) => p.name).join(", ")}</span></span>
                <strong className="text-destructive">{data.outOfStock.length}</strong>
              </Link>
            )}
            {data.lowStock.length > 0 && (
              <Link to="/estoque" className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <span className="grid size-10 place-items-center rounded-xl bg-warning/20"><AlertTriangle className="size-5 text-warning-foreground" /></span>
                <span className="min-w-0"><strong className="block text-sm">Estoque baixo</strong><span className="block truncate text-xs text-muted-foreground">{data.lowStock.slice(0, 2).map((p) => p.name).join(", ")}</span></span>
                <strong className="text-warning-foreground">{data.lowStock.length}</strong>
              </Link>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="cash-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="cash-title" className="text-base font-bold">Resumo do caixa</h2>
          <Button asChild variant="link" className="h-auto p-0 text-xs"><Link to="/vendas">Detalhes</Link></Button>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium"><CircleDollarSign className="size-5 text-primary" /> Valor atual</span>
            <strong className="text-xl">{formatBRL(data.revenue)}</strong>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
            <div><span className="text-muted-foreground">Entradas</span><strong className="mt-1 block text-success">+ {formatBRL(data.revenue)}</strong></div>
            <div><span className="text-muted-foreground">Saídas</span><strong className="mt-1 block">{formatBRL(0)}</strong><span className="text-[10px] text-muted-foreground">Sem registro disponível</span></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="recent-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-title" className="text-base font-bold">Últimas vendas</h2>
          <Button asChild variant="link" className="h-auto p-0 text-xs"><Link to="/vendas">Ver todas</Link></Button>
        </div>
        {data.today.length === 0 ? (
          <div className="rounded-2xl border bg-card px-5 py-7 text-center shadow-soft">
            <ReceiptText className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Nenhuma venda hoje</p>
            <p className="mt-1 text-xs text-muted-foreground">As vendas finalizadas aparecem aqui.</p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border bg-card shadow-soft">
            {data.today.slice(0, 4).map((sale) => (
              <li key={sale.id} className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 last:border-b-0">
                <span className="grid size-9 place-items-center rounded-xl bg-secondary"><Clock3 className="size-4 text-primary" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(sale.timestamp)}</p>
                  <p className="truncate text-xs text-muted-foreground">{sale.items.reduce((sum, item) => sum + item.qty, 0)} itens · {PAYMENT_LABELS[sale.method]}</p>
                </div>
                <strong className="text-sm">{formatBRL(sale.total)}</strong>
              </li>
            ))}
          </ul>
        )}
        <span className="sr-only">{data.today.length} {saleWord} hoje</span>
      </section>
    </div>
  );
}