// Auditoria 2026-09-19: tela principal, navegação e leitor de barras verificados.\nimport { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  Boxes,
  Bell,
  Package,
  ScanBarcode,
  Search,
  ShoppingCart,
  Store,
  Wallet,
  ChevronRight,
  Plus,
  CircleAlert,
  DoorOpen,
} from "lucide-react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useStore, formatBRL } from "@/store/useStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mini Market PDV" },
      {
        name: "description",
        content: "Tela principal do Mini Market PDV com acesso rápido a vendas, estoque e leitor de código de barras.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const products = useStore((s) => s.products);
  const sales = useStore((s) => s.sales);
  const cashOpen = useStore((s) => s.cashOpen);
  const settings = useStore((s) => s.settings);
  const addToCart = useStore((s) => s.addToCart);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const productList = useMemo(() => Object.values(products), [products]);
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productList.slice(0, 6);
    return productList
      .filter((p) => p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q))
      .slice(0, 6);
  }, [productList, query]);

  const todaySales = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return sales.filter((sale) => sale.timestamp >= start.getTime());
  }, [sales]);

  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const lowStock = productList.filter((p) => p.stock <= 5);
  const itemsSold = todaySales.reduce(
    (sum, sale) => sum + sale.items.reduce((n, item) => n + item.qty, 0),
    0,
  );

  const addProduct = (barcode: string) => {
    const product = products[barcode.trim()];
    if (!product) {
      toast.error("Produto não cadastrado", { description: `Código: ${barcode}` });
      return;
    }
    addToCart(product.barcode);
    toast.success(`${product.name} adicionado à venda`, {
      description: formatBRL(product.price),
    });
    setQuery("");
    setScannerOpen(false);
  };

  return (
    <div className="min-h-dvh bg-background pb-24">
      <header className="bg-primary px-4 pb-5 pt-4 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-white/15">
            <ShoppingCart className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/75">Sistema PDV</p>
            <h1 className="truncate text-xl font-black">Mini Market</h1>
          </div>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-white/10"
            aria-label="Notificações"
            onClick={() => toast.info("Notificações", { description: "Nenhuma notificação nova." })}
          >
            <Bell className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-extrabold">{settings.storeName || "Mini Mercado"}</h2>
              <p className="text-xs text-muted-foreground">
                {cashOpen ? "Caixa aberto" : "Caixa fechado"} · Operação local
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${cashOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {cashOpen ? "ABERTO" : "FECHADO"}
            </span>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">Vendas hoje</p>
            <strong className="mt-1 block text-xl font-black text-primary">{formatBRL(todayTotal)}</strong>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">Qtd. de vendas</p>
            <strong className="mt-1 block text-xl font-black">{todaySales.length}</strong>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">Itens vendidos</p>
            <strong className="mt-1 block text-xl font-black">{itemsSold}</strong>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">Estoque baixo</p>
            <strong className={`mt-1 block text-xl font-black ${lowStock.length ? "text-destructive" : "text-primary"}`}>
              {lowStock.length}
            </strong>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Frente de caixa</p>
              <h2 className="text-lg font-black">Nova venda</h2>
            </div>
            <Link
              to="/vender"
              className="text-sm font-extrabold text-primary"
            >
              Abrir PDV
            </Link>
          </div>

          {scannerOpen ? (
            <BarcodeScanner
              onScan={addProduct}
              onClose={() => setScannerOpen(false)}
            />
          ) : (
            <button
              type="button"
              className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-primary px-4 text-base font-extrabold text-primary-foreground shadow-sm active:scale-[0.99]"
              onClick={() => setScannerOpen(true)}
            >
              <ScanBarcode className="size-6" />
              Ler código de barras
            </button>
          )}

          <form
            className="relative mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              const exact = products[query.trim()];
              if (exact) addProduct(exact.barcode);
              else if (suggestions[0]) addProduct(suggestions[0].barcode);
              else if (query.trim()) toast.error("Produto não encontrado");
            }}
          >
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou código"
              className="h-13 w-full rounded-2xl border bg-background pl-12 pr-4 text-base outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
              inputMode="search"
              aria-label="Buscar produto por nome ou código"
            />
          </form>

          {query.trim() && (
            <div className="mt-2 overflow-hidden rounded-2xl border">
              {suggestions.length ? (
                suggestions.map((p) => (
                  <button
                    type="button"
                    key={p.barcode}
                    className="flex w-full items-center gap-3 border-b px-3 py-3 text-left last:border-b-0 active:bg-muted"
                    onClick={() => addProduct(p.barcode)}
                  >
                    <Package className="size-5 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">{p.barcode}</span>
                    </span>
                    <strong className="text-sm">{formatBRL(p.price)}</strong>
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
              )}
            </div>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-black">Acesso rápido</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/vender" className="flex min-h-20 items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShoppingCart className="size-5" /></span>
              <span className="font-extrabold">Vender</span>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
            <Link to="/estoque" className="flex min-h-20 items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Boxes className="size-5" /></span>
              <span className="font-extrabold">Estoque</span>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
            <Link to="/vendas" className="flex min-h-20 items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><BarChart3 className="size-5" /></span>
              <span className="font-extrabold">Vendas</span>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
            <Link to="/mais" className="flex min-h-20 items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Wallet className="size-5" /></span>
              <span className="font-extrabold">Mais</span>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          </div>
        </section>

        {lowStock.length > 0 && (
          <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-destructive">
              <CircleAlert className="size-5" />
              <h2 className="font-black">Estoque baixo</h2>
            </div>
            <div className="space-y-2">
              {lowStock.slice(0, 4).map((p) => (
                <div key={p.barcode} className="flex items-center gap-3 rounded-xl bg-background/80 p-3">
                  <Package className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                  <strong className="text-sm text-destructive">{p.stock} un.</strong>
                </div>
              ))}
            </div>
            {lowStock.length > 4 && (
              <Link to="/estoque" className="mt-3 flex items-center justify-center gap-1 text-sm font-extrabold text-primary">
                Ver estoque <ChevronRight className="size-4" />
              </Link>
            )}
          </section>
        )}

        <section className="grid grid-cols-2 gap-3">
          <Link to="/codigos" className="flex items-center justify-center gap-2 rounded-2xl border bg-card px-3 py-3 text-sm font-bold shadow-sm">
            <Plus className="size-4" /> Administração
          </Link>
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card px-3 py-3 text-sm font-bold text-muted-foreground shadow-sm">
            <DoorOpen className="size-4" /> {cashOpen ? "Caixa aberto" : "Caixa fechado"}
          </div>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-lg border-t bg-card/95 px-2 py-2 backdrop-blur">
        <BottomLink to="/" label="Início" icon={<Store className="size-5" />} />
        <BottomLink to="/vender" label="Vender" icon={<ShoppingCart className="size-5" />} />
        <BottomLink to="/estoque" label="Estoque" icon={<Boxes className="size-5" />} />
        <BottomLink to="/vendas" label="Vendas" icon={<BarChart3 className="size-5" />} />
        <BottomLink to="/mais" label="Mais" icon={<Wallet className="size-5" />} />
      </nav>
    </div>
  );
}

function BottomLink({
  to,
  label,
  icon,
}: {
  to: "/" | "/vender" | "/estoque" | "/vendas" | "/mais";
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold text-muted-foreground"
      activeProps={{ className: "flex flex-1 flex-col items-center gap-1 rounded-xl bg-primary/10 px-2 py-1.5 text-[11px] font-extrabold text-primary" }}
    >
      {icon}
      {label}
    </Link>
  );
}
