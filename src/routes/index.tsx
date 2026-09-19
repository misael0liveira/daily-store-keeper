import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Users,
  Info,
  LayoutGrid,

  Minus,
  Moon,
  Package,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Wallet,
  ScanLine,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Sun,
  TrendingUp,
  Boxes,
  FileText,
  MoreHorizontal,
  Receipt,
  Lock,
  Truck,
  ClipboardList,
  Building2,
  HandCoins,
  Calculator,
  UserRound,
  DoorOpen,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mini Market — Sistema PDV para mercadinhos" },
      {
        name: "description",
        content:
          "Protótipo navegável do Mini Market: PDV mobile para gestão de mercadinho com vendas, produtos, estoque, relatórios e financeiro.",
      },
      { property: "og:title", content: "Mini Market — Sistema PDV para mercadinhos" },
      {
        property: "og:description",
        content: "Vendas, estoque, relatórios e financeiro do seu mercadinho em um app simples.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MiniMarketPdv,
});

type ScreenId =
  | "dashboard"
  | "sell"
  | "products"
  | "stock"
  | "sales"
  | "finance"
  | "reports"
  | "more"
  | "settings"
  | "productDetail"
  | "productNew"
  | "checkout"
  | "sale"
  | "stockMove"
  | "cashier"
  | "cashierMove"
  | "suppliers"
  | "purchases"
  | "users"
  | "company"
  | "fiscal"
  | "customers"
  | "about";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace("\u00a0", " ");

const sellItems = [
  { name: "Arroz Tipo 1 5kg", price: 24.9 },
  { name: "Feijão Carioca 1kg", price: 8.9 },
  { name: "Óleo de Soja 900ml", price: 6.99 },
  { name: "Leite 1L", price: 4.39 },
];

const productList = [
  { name: "Água Mineral 500ml", price: 1.99, stock: 48, cat: "Bebidas" },
  { name: "Refrigerante 2L", price: 7.99, stock: 24, cat: "Bebidas" },
  { name: "Cerveja Lata 350ml", price: 3.49, stock: 36, cat: "Bebidas" },
  { name: "Pão de Forma", price: 5.99, stock: 12, cat: "Alimentos" },
  { name: "Leite 1L", price: 4.39, stock: 18, cat: "Alimentos" },
];

function MiniMarketPdv() {
  const [stack, setStack] = useState<ScreenId[]>(["dashboard"]);
  const [dark, setDark] = useState(false);
  const screen = stack[stack.length - 1] ?? "dashboard";

  const go = (s: ScreenId) => setStack((p) => [...p, s]);
  const back = () => setStack((p) => (p.length > 1 ? p.slice(0, -1) : p));
  const reset = (s: ScreenId) => setStack([s]);

  const tabOf: Partial<Record<ScreenId, string>> = {
    dashboard: "inicio",
    sell: "vender",
    checkout: "vender",
    sale: "vender",
    products: "produtos",
    productDetail: "produtos",
    productNew: "produtos",
    sales: "vendas",
    more: "mais",
    settings: "mais",
    about: "mais",
  };
  const showTabs = ["dashboard", "sell", "products", "sales", "more", "stock", "finance", "reports"].includes(
    screen,
  );

  return (
    <div className="stage">
      <div className="phone" data-theme={dark ? "dark" : "light"}>
        <>
<Screens
              screen={screen}
              go={go}
              back={back}
              reset={reset}
              dark={dark}
              setDark={setDark}
            />
            {showTabs && (
              <nav className="tabbar">
                {[
                  { id: "inicio", label: "Início", icon: Store, to: "dashboard" as ScreenId },
                  { id: "vender", label: "Vender", icon: ShoppingCart, to: "sell" as ScreenId },
                  { id: "produtos", label: "Produtos", icon: Package, to: "products" as ScreenId },
                  { id: "vendas", label: "Vendas", icon: BarChart3, to: "sales" as ScreenId },
                  { id: "mais", label: "Mais", icon: MoreHorizontal, to: "more" as ScreenId },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={tabOf[screen] === t.id ? "on" : ""}
                    onClick={() => reset(t.to)}
                  >
                    <t.icon size={19} strokeWidth={2} />
                    {t.label}
                  </button>
                ))}
              </nav>
            )}
</>
      </div>
    </div>
  );
}

/* --------------------------------- chrome --------------------------------- */

function StatusBar({ light }: { light?: boolean }) {
  return (
    <div className="statusbar" style={light ? { color: "#fff" } : undefined}>
      <span>9:41</span>
      <span>▮▮▮ ⌁ 100%</span>
    </div>
  );
}

function TopBar({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--primary-deep)" }}>
      <StatusBar light />
      <div className="topbar">
        {onBack ? (
          <button onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={19} />
          </button>
        ) : (
          <span className="brand-dot">
            <ShoppingCart size={18} />
          </span>
        )}
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <span className="spacer" />
        {action}
      </div>
    </div>
  );
}

/* --------------------------------- screens -------------------------------- */

function Screens({
  screen,
  go,
  back,
  reset,
  dark,
  setDark,
}: {
  screen: ScreenId;
  go: (s: ScreenId) => void;
  back: () => void;
  reset: (s: ScreenId) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
}) {
  switch (screen) {
    case "dashboard":
      return <Dashboard go={go} reset={reset} />;
    case "sell":
      return <Sell go={go} />;
    case "products":
      return <Products go={go} />;
    case "stock":
      return <Stock go={go} back={back} />;
    case "sales":
      return <Sales go={go} />;
    case "finance":
      return <Finance back={back} />;
    case "reports":
      return <Reports back={back} />;
    case "more":
      return <More go={go} reset={reset} />;
    case "settings":
      return <SettingsScreen back={back} dark={dark} setDark={setDark} />;
    case "productDetail":
      return <ProductDetail go={go} back={back} />;
    case "productNew":
      return <ProductNew back={back} />;
    case "checkout":
      return <Checkout go={go} back={back} />;
    case "sale":
      return <SaleReceipt go={go} back={back} />;
    case "stockMove":
      return <StockMove back={back} />;
    case "cashier":
      return <Cashier go={go} back={back} />;
    case "cashierMove":
      return <CashierMove back={back} />;
    case "suppliers":
      return <Suppliers back={back} />;
    case "purchases":
      return <Purchases go={go} back={back} />;
    case "users":
      return <UsersScreen back={back} />;
    case "company":
      return <Company back={back} />;
    case "fiscal":
      return <Fiscal back={back} />;
    case "customers":
      return <Customers back={back} />;
    case "about":
      return <About back={back} />;
    default:
      return null;
  }
}

/* 2 — Dashboard */
function Dashboard({ go, reset }: { go: (s: ScreenId) => void; reset: (s: ScreenId) => void }) {
  const shortcuts = [
    { label: "Vender", icon: ShoppingCart, to: "sell" as ScreenId, tab: true },
    { label: "Produtos", icon: Package, to: "products" as ScreenId, tab: true },
    { label: "Estoque", icon: Boxes, to: "stock" as ScreenId },
    { label: "Relatórios", icon: FileText, to: "reports" as ScreenId },
    { label: "Financeiro", icon: Wallet, to: "finance" as ScreenId },
    { label: "Caixa", icon: DoorOpen, to: "cashier" as ScreenId },
    { label: "Compras", icon: ClipboardList, to: "purchases" as ScreenId },
    { label: "Fornecedores", icon: Truck, to: "suppliers" as ScreenId },
    { label: "Configurações", icon: Settings, to: "settings" as ScreenId },
  ];
  return (
    <>
      <TopBar
        title="Mini Market"
        subtitle="Sistema PDV"
        action={
          <button
            aria-label="Notificações"
            onClick={() => window.alert("Nenhuma nova notificação.")}
          >
            <Bell size={18} />
          </button>
        }
      />
      <div className="scroll">
        <div className="page with-tabs">
          <div className="card" style={{ padding: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 850 }}>Mercadinho Bom Preço LTDA</h2>
            <p style={{ margin: "3px 0 0", fontSize: 12 }} className="muted">
              CNPJ 12.345.678/0001-90 · Operador: João Silva
            </p>
          </div>

          <div className="card item" style={{ marginTop: 10 }}>
            <span className="thumb">
              <DoorOpen size={17} />
            </span>
            <div className="body">
              <h3>Caixa 01 aberto</h3>
              <p>Abertura 08:00 · saldo {brl(1898.2)}</p>
            </div>
            <span className="up" style={{ fontSize: 10, fontWeight: 800, color: "var(--primary)" }}>
              ABERTO
            </span>
          </div>

          <p className="sec-title">Faturamento do dia · 14/09/2026</p>
          <div className="grid2">
            <div className="card stat">
              <span>Vendas</span>
              <strong>{brl(2487.5)}</strong>
            </div>
            <div className="card stat">
              <span>Qtd. de vendas</span>
              <strong>48</strong>
            </div>
            <div className="card stat">
              <span>Ticket médio</span>
              <strong>{brl(51.82)}</strong>
            </div>
            <div className="card stat">
              <span>Itens vendidos</span>
              <strong>126</strong>
            </div>
            <div className="card stat">
              <span>Estoque baixo</span>
              <strong style={{ color: "var(--destructive)" }}>12 produtos</strong>
            </div>
            <div className="card stat">
              <span>Saldo em caixa</span>
              <strong>{brl(1898.2)}</strong>
            </div>
          </div>

          <p className="sec-title">Gestão</p>
          <div className="grid3">
            {shortcuts.map((s) => (
              <button
                key={s.label}
                className="card shortcut"
                onClick={() => (s.tab ? reset(s.to) : go(s.to))}
              >
                <span className="ic">
                  <s.icon size={18} />
                </span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* 3 — Vender */
function Sell({ go }: { go: (s: ScreenId) => void }) {
  const [qty, setQty] = useState<number[]>([1, 1, 1, 1]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const total = sellItems.reduce((s, it, i) => s + it.price * (qty[i] ?? 0), 0);
  const count = qty.reduce((a, b) => a + b, 0);
  return (
    <>
      <TopBar title="Frente de caixa" subtitle="Nova venda" />
      <div className="scroll">
        <div className="page with-tabs" style={{ paddingBottom: 168 }}>
          <div className="search-row">
            <div className="search">
              <Search size={16} />
              <input placeholder="Buscar produto..." />
            </div>
            <button
              className="icon-btn"
              aria-label="Scanner"
              onClick={() => setScannerOpen(true)}
            >
              <ScanLine size={18} />
            </button>
          </div>
          {scannerOpen ? (
            <div style={{ marginTop: 10 }}>
              <BarcodeScanner
                onScan={(code) => {
                  setScannedCode(code);
                  setScannerOpen(false);
                }}
                onClose={() => setScannerOpen(false)}
              />
            </div>
          ) : (
            <button
              className="btn ghost-green"
              style={{ marginTop: 10 }}
              onClick={() => setScannerOpen(true)}
            >
              <ScanLine size={17} /> Ler código de barras
            </button>
          )}
          {scannedCode && (
            <div className="card" style={{ marginTop: 10, padding: 12 }}>
              <span className="muted" style={{ fontSize: 11 }}>Último código lido</span>
              <strong style={{ display: "block", marginTop: 3 }}>{scannedCode}</strong>
            </div>
          )}

          <p className="sec-title">Itens da venda</p>
          <div className="list">
            {sellItems.map((it, i) => (
              <div className="card item" key={it.name}>
                <span className="thumb">
                  <Package size={17} />
                </span>
                <div className="body">
                  <h3>{it.name}</h3>
                  <p>{brl(it.price)}</p>
                </div>
                <div className="stepper">
                  <button onClick={() => setQty((q) => q.map((v, j) => (j === i ? Math.max(0, v - 1) : v)))}>
                    <Minus size={13} />
                  </button>
                  <b>{qty[i]}</b>
                  <button
                    className="solid"
                    onClick={() => setQty((q) => q.map((v, j) => (j === i ? v + 1 : v)))}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="sticky-foot" style={{ bottom: 66 }}>
        <div className="row-between" style={{ marginBottom: 9 }}>
          <span className="muted" style={{ fontSize: 12.5, fontWeight: 700 }}>
            {count} {count === 1 ? "item" : "itens"}
          </span>
          <strong style={{ fontSize: 18 }}>{brl(total)}</strong>
        </div>
        <button className="btn" onClick={() => go("checkout")}>
          Finalizar venda
        </button>
      </div>
    </>
  );
}

/* 4 — Produtos */
function Products({ go }: { go: (s: ScreenId) => void }) {
  const [cat, setCat] = useState("Todos");
  const cats = ["Todos", "Bebidas", "Alimentos", "Higiene"];
  const list = cat === "Todos" ? productList : productList.filter((p) => p.cat === cat);
  return (
    <>
      <TopBar
        title="Produtos"
        subtitle="248 cadastrados"
        action={
          <button aria-label="Novo produto" onClick={() => go("productNew")}>
            <Plus size={19} />
          </button>
        }
      />
      <div className="scroll">
        <div className="page with-tabs">
          <div className="search">
            <Search size={16} />
            <input placeholder="Buscar produto..." />
          </div>
          <div className="chips">
            {cats.map((c) => (
              <button key={c} className={c === cat ? "on" : ""} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="list" style={{ marginTop: 10 }}>
            {list.map((p) => (
              <div className="card item" key={p.name}>
                <button className="body" onClick={() => go("productDetail")}>
                  <h3>{p.name}</h3>
                  <p>
                    {brl(p.price)} · estoque {p.stock}
                  </p>
                </button>
                <button
                  className="icon-btn"
                  style={{ width: 34, height: 34 }}
                  aria-label="Adicionar"
                  onClick={() => go("sell")}
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
            {list.length === 0 && <p className="muted">Nenhum produto nesta categoria.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

/* 5 — Estoque */
function Stock({ go, back }: { go: (s: ScreenId) => void; back: () => void }) {
  const cats = [
    ["Alimentos", 96],
    ["Bebidas", 52],
    ["Higiene", 38],
    ["Limpeza", 22],
    ["Diversos", 40],
  ] as const;
  return (
    <>
      <TopBar
        title="Estoque"
        subtitle="Controle de produtos"
        onBack={back}
        action={
          <button aria-label="Movimentação" onClick={() => go("stockMove")}>
            <RefreshCw size={18} />
          </button>
        }
      />
      <div className="scroll">
        <div className="page with-tabs">
          <div className="grid2">
            <div className="card stat">
              <span>Total de produtos</span>
              <strong>248</strong>
            </div>
            <div className="card stat">
              <span>Estoque baixo</span>
              <strong style={{ color: "var(--destructive)" }}>12</strong>
            </div>
          </div>

          <p className="sec-title">Estoque por categoria</p>
          <div className="list">
            {cats.map(([name, qty]) => (
              <div className="card item" key={name}>
                <span className="thumb">
                  <Boxes size={17} />
                </span>
                <div className="body">
                  <h3>{name}</h3>
                </div>
                <strong>{qty}</strong>
              </div>
            ))}
          </div>

          <button className="btn outline" style={{ marginTop: 16 }} onClick={() => go("stockMove")}>
            <RefreshCw size={16} /> Registrar movimentação
          </button>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => go("products")}>
            Ver todos os produtos
          </button>
        </div>
      </div>
    </>
  );
}

/* 6 — Vendas */
function Sales({ go }: { go: (s: ScreenId) => void }) {
  const bars = [30, 45, 38, 62, 55, 80, 70, 95, 66, 48];
  const hours = ["8h", "9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h"];
  const last = [
    ["#0487", 68.9],
    ["#0486", 32.5],
    ["#0485", 45.0],
  ] as const;
  return (
    <>
      <TopBar title="Vendas" subtitle="14/09/2026" />
      <div className="scroll">
        <div className="page with-tabs">
          <div className="card stat" style={{ marginBottom: 10 }}>
            <span>Total de vendas</span>
            <strong style={{ fontSize: 22 }}>{brl(2487.5)}</strong>
          </div>
          <div className="grid2">
            <div className="card stat">
              <span>Qtd. de vendas</span>
              <strong>48</strong>
            </div>
            <div className="card stat">
              <span>Ticket médio</span>
              <strong>{brl(51.82)}</strong>
            </div>
          </div>

          <p className="sec-title">Vendas por hora</p>
          <div className="card">
            <div className="bars">
              {bars.map((h, i) => (
                <div key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="bar-labels">
              {hours.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
          </div>

          <p className="sec-title">Últimas vendas</p>
          <div className="list">
            {last.map(([id, v]) => (
              <button className="card item" key={id} onClick={() => go("sale")}>
                <span className="thumb">
                  <Receipt size={17} />
                </span>
                <div className="body">
                  <h3>Venda {id}</h3>
                  <p>14/09/2026</p>
                </div>
                <strong>{brl(v)}</strong>
                <ChevronRight size={16} className="muted" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* 7 — Financeiro */
function Finance({ back }: { back: () => void }) {
  const moves = [
    ["Vendas", 2487.5, "in"],
    ["Fornecedores", 420.0, "out"],
    ["Despesas", 169.3, "out"],
  ] as const;
  return (
    <>
      <TopBar title="Financeiro" subtitle="14/09/2026" onBack={back} />
      <div className="scroll">
        <div className="page with-tabs">
          <div className="grid2">
            <div className="card stat">
              <span>Entradas</span>
              <strong style={{ color: "var(--primary)" }}>{brl(2487.5)}</strong>
            </div>
            <div className="card stat">
              <span>Saídas</span>
              <strong style={{ color: "var(--destructive)" }}>{brl(589.3)}</strong>
            </div>
          </div>
          <div className="card stat" style={{ marginTop: 10 }}>
            <span>Saldo do dia</span>
            <strong style={{ fontSize: 22 }}>{brl(1898.2)}</strong>
          </div>

          <p className="sec-title">Movimentações</p>
          <div className="list">
            {moves.map(([name, v, dir]) => (
              <div className="card item" key={name}>
                <span
                  className="thumb"
                  style={
                    dir === "out"
                      ? { background: "color-mix(in oklab, var(--destructive) 12%, transparent)", color: "var(--destructive)" }
                      : undefined
                  }
                >
                  {dir === "in" ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                </span>
                <div className="body">
                  <h3>{name}</h3>
                  <p>{dir === "in" ? "Entrada" : "Saída"}</p>
                </div>
                <strong style={dir === "out" ? { color: "var(--destructive)" } : { color: "var(--primary)" }}>
                  {dir === "in" ? "+" : "-"} {brl(v)}
                </strong>
              </div>
            ))}
          </div>

          <button
            className="btn outline"
            style={{ marginTop: 16 }}
            onClick={() => window.alert("O extrato detalhado será integrado nesta tela.")}
          >
            Ver extrato completo
          </button>
        </div>
      </div>
    </>
  );
}

/* 8 — Relatórios */
function Reports({ back }: { back: () => void }) {
  const [range, setRange] = useState("Hoje");
  const ranges = ["Hoje", "7 dias", "30 dias", "Personalizado"];
  const cards = [
    ["Vendas", brl(2487.5), "+12%"],
    ["Qtd. de vendas", "48", "+8%"],
    ["Ticket médio", brl(51.82), "+5%"],
  ] as const;
  const reports = [
    "Vendas por período",
    "Produtos mais vendidos",
    "Formas de pagamento",
    "Movimentação de estoque",
  ];
  return (
    <>
      <TopBar title="Relatórios" subtitle="Desempenho do mercadinho" onBack={back} />
      <div className="scroll">
        <div className="page with-tabs">
          <div className="chips" style={{ marginTop: 0 }}>
            {ranges.map((r) => (
              <button key={r} className={r === range ? "on" : ""} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>

          <div className="list" style={{ marginTop: 12 }}>
            {cards.map(([label, value, delta]) => (
              <div className="card stat" key={label}>
                <div className="row-between">
                  <div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                  <span className="up">
                    <TrendingUp size={13} style={{ display: "inline", marginRight: 3 }} />
                    {delta}
                  </span>
                </div>
                <div className="spark">
                  {[40, 55, 35, 70, 60, 85, 75].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="sec-title">Relatórios disponíveis</p>
          <div className="list">
            {reports.map((r) => (
              <button
                className="card item"
                key={r}
                onClick={() => window.alert(`Relatório selecionado: ${r}`)}
              >
                <span className="thumb">
                  <FileText size={17} />
                </span>
                <div className="body">
                  <h3>{r}</h3>
                </div>
                <ChevronRight size={16} className="muted" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* 9 — Mais */
function More({ go, reset }: { go: (s: ScreenId) => void; reset: (s: ScreenId) => void }) {
  const items = [
    { label: "Dados do estabelecimento", icon: Building2, to: "company" as ScreenId },
    { label: "Usuários e operadores", icon: Users, to: "users" as ScreenId },
    { label: "Caixa (abertura e fechamento)", icon: DoorOpen, to: "cashier" as ScreenId },
    { label: "Fornecedores", icon: Truck, to: "suppliers" as ScreenId },
    { label: "Compras e entradas", icon: ClipboardList, to: "purchases" as ScreenId },
    { label: "Clientes e crediário", icon: UserRound, to: "customers" as ScreenId },
    { label: "Configuração fiscal (NFC-e / NF-e)", icon: Calculator, to: "fiscal" as ScreenId },
    { label: "Configurações do sistema", icon: Settings, to: "settings" as ScreenId },
    { label: "Backup / Sincronização", icon: RefreshCw, action: "backup" as const },
    { label: "Ajuda e suporte", icon: CircleHelp, action: "help" as const },
    { label: "Sobre o sistema", icon: Info, to: "about" as ScreenId },
  ];
  return (
    <>
      <TopBar title="Mais" subtitle="Ajustes e informações" />
      <div className="scroll">
        <div className="page with-tabs">
          <div className="card item" style={{ padding: 14 }}>
            <span className="thumb" style={{ width: 44, height: 44 }}>
              <Store size={20} />
            </span>
            <div className="body">
              <h3 style={{ fontSize: 15, fontWeight: 850 }}>Mercadinho Bom Preço LTDA</h3>
              <p>CNPJ 12.345.678/0001-90 · Mini Market PDV</p>
            </div>
          </div>

          <p className="sec-title">Sistema</p>
          <div className="list">
            {items.map((it) => (
              <button
                className="card item"
                key={it.label}
                onClick={() => {
                  if (it.to) go(it.to);
                  else if (it.action === "backup") window.alert("Backup e sincronização serão configurados nesta versão.");
                  else if (it.action === "help") window.alert("Ajuda e suporte: procure o administrador do sistema.");
                }}
              >
                <span className="thumb">
                  <it.icon size={17} />
                </span>
                <div className="body">
                  <h3>{it.label}</h3>
                </div>
                <ChevronRight size={16} className="muted" />
              </button>
            ))}
          </div>

          <button className="btn danger" style={{ marginTop: 18 }} onClick={() => reset("dashboard")}>
            Voltar ao início
          </button>
        </div>
      </div>
    </>
  );
}

/* 10 — Configurações */
function SettingsScreen({
  back,
  dark,
  setDark,
}: {
  back: () => void;
  dark: boolean;
  setDark: (v: boolean) => void;
}) {
  const [notif, setNotif] = useState({ estoque: true, vendas: true, sistema: false });
  const others = [
    { label: "Impressora térmica", icon: Printer, value: "Conectada" },
    { label: "Leitor de código de barras", icon: ScanLine, value: "Ativo" },
    { label: "Sincronização na nuvem", icon: RefreshCw, value: "Automática" },
  ];
  return (
    <>
      <TopBar title="Configurações" onBack={back} />
      <div className="scroll">
        <div className="page">
          <p className="sec-title" style={{ marginTop: 4 }}>
            Aparência
          </p>
          <div className="list">
            <button className={`card choice ${!dark ? "on" : ""}`} onClick={() => setDark(false)}>
              <span className="radio" />
              <Sun size={17} />
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>Tema claro</span>
            </button>
            <button className={`card choice ${dark ? "on" : ""}`} onClick={() => setDark(true)}>
              <span className="radio" />
              <Moon size={17} />
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>Tema escuro</span>
            </button>
          </div>

          <p className="sec-title">Notificações</p>
          <div className="list">
            {(
              [
                ["Estoque baixo", "estoque"],
                ["Novas vendas", "vendas"],
                ["Atualizações do sistema", "sistema"],
              ] as const
            ).map(([label, key]) => (
              <div className="card item" key={key}>
                <span className="thumb">
                  <Bell size={16} />
                </span>
                <div className="body">
                  <h3>{label}</h3>
                </div>
                <button
                  className={`switch ${notif[key] ? "on" : ""}`}
                  aria-label={label}
                  onClick={() => setNotif((n) => ({ ...n, [key]: !n[key] }))}
                >
                  <i />
                </button>
              </div>
            ))}
          </div>

          <p className="sec-title">Outras configurações</p>
          <div className="list">
            {others.map((o) => (
              <button
                className="card item"
                key={o.label}
                onClick={() => window.alert(`${o.label}: ${o.value}`)}
              >
                <span className="thumb">
                  <o.icon size={17} />
                </span>
                <div className="body">
                  <h3>{o.label}</h3>
                  <p>{o.value}</p>
                </div>
                <ChevronRight size={16} className="muted" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* 11 — Detalhes do Produto */
function ProductDetail({ go, back }: { go: (s: ScreenId) => void; back: () => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <TopBar
        title="Detalhes do produto"
        onBack={back}
        action={
          <button aria-label="Novo produto" onClick={() => go("productNew")}>
            <Plus size={19} />
          </button>
        }
      />
      <div className="scroll">
        <div className="page">
          <div className="card item" style={{ padding: 14, marginBottom: 6 }}>
            <span className="thumb" style={{ width: 48, height: 48 }}>
              <Package size={21} />
            </span>
            <div className="body">
              <h3 style={{ fontSize: 16, fontWeight: 850 }}>Coca-Cola 2L</h3>
              <p>Código 78900012345 · Bebidas</p>
            </div>
          </div>

          <p className="sec-title">Preços</p>
          <div className="grid2">
            <div className="card stat">
              <span>Preço de venda</span>
              <strong>{brl(7.99)}</strong>
            </div>
            <div className="card stat">
              <span>Preço de custo</span>
              <strong>{brl(5.2)}</strong>
            </div>
          </div>

          <p className="sec-title">Estoque</p>
          <div className="grid2">
            <div className="card stat">
              <span>Estoque inicial</span>
              <strong>24</strong>
            </div>
            <div className="card stat">
              <span>Estoque mínimo</span>
              <strong>6</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn outline" onClick={() => setEditing(true)}>
              Editar
            </button>
            <button className="btn" onClick={() => setEditing(false)}>
              {editing ? "Salvar" : "Salvar"}
            </button>
          </div>
          {editing && (
            <p className="muted" style={{ fontSize: 11.5, textAlign: "center", marginTop: 10 }}>
              Modo de edição ativo (demonstração)
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/* 12 — Novo Produto */
function ProductNew({ back }: { back: () => void }) {
  return (
    <>
      <TopBar title="Novo produto" onBack={back} />
      <div className="scroll">
        <div className="page">
          <div className="photo-drop" style={{ marginBottom: 16 }}>
            <Camera size={22} />
            Adicionar foto do produto
          </div>
          <div className="field">
            <label>Nome do produto</label>
            <input placeholder="Ex: Coca-Cola 2L" />
          </div>
          <div className="field">
            <label>Categoria</label>
            <select defaultValue="Bebidas">
              <option>Bebidas</option>
              <option>Alimentos</option>
              <option>Higiene</option>
              <option>Limpeza</option>
              <option>Diversos</option>
            </select>
          </div>
          <div className="grid2">
            <div className="field">
              <label>Preço de venda</label>
              <input placeholder="R$ 0,00" />
            </div>
            <div className="field">
              <label>Preço de custo</label>
              <input placeholder="R$ 0,00" />
            </div>
          </div>
          <div className="field">
            <label>Estoque inicial</label>
            <input placeholder="0" inputMode="numeric" />
          </div>
          <button className="btn" style={{ marginTop: 6 }} onClick={back}>
            Salvar
          </button>
        </div>
      </div>
    </>
  );
}

/* 13 — Finalizar Venda */
function Checkout({ go, back }: { go: (s: ScreenId) => void; back: () => void }) {
  const [pay, setPay] = useState("Dinheiro");
  const methods = [
    { label: "Dinheiro", icon: Banknote },
    { label: "Cartão de débito", icon: CreditCard },
    { label: "Cartão de crédito", icon: CreditCard },
    { label: "Pix", icon: QrCode },
  ];
  return (
    <>
      <TopBar title="Finalizar venda" onBack={back} />
      <div className="scroll">
        <div className="page">
          <div className="card stat" style={{ textAlign: "center", padding: 18 }}>
            <span>Total da venda</span>
            <strong style={{ fontSize: 30 }}>{brl(68.9)}</strong>
          </div>

          <p className="sec-title">Forma de pagamento</p>
          <div className="list">
            {methods.map((m) => (
              <button
                key={m.label}
                className={`card choice ${pay === m.label ? "on" : ""}`}
                onClick={() => setPay(m.label)}
              >
                <span className="radio" />
                <m.icon size={17} />
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>{m.label}</span>
              </button>
            ))}
          </div>

          <button className="btn" style={{ marginTop: 18 }} onClick={() => go("sale")}>
            Confirmar venda
          </button>
        </div>
      </div>
    </>
  );
}

/* 14 — Venda #0487 */
function SaleReceipt({ go, back }: { go: (s: ScreenId) => void; back: () => void }) {
  const items = [
    ["Coca-Cola 2L", 1, 7.99],
    ["Pão de Forma", 1, 5.99],
    ["Leite 1L", 1, 4.39],
  ] as const;
  return (
    <>
      <TopBar title="Venda #0487" subtitle="14/09/2026 - 19:42" onBack={back} />
      <div className="scroll">
        <div className="page">
          <div className="card" style={{ padding: 14 }}>
            {items.map(([name, q, v]) => (
              <div className="receipt-line" key={name}>
                <span>
                  {name} <span className="muted">{q}x</span>
                </span>
                <strong>{brl(v)}</strong>
              </div>
            ))}
            <div className="receipt-line" style={{ borderTop: "1px dashed var(--border)", marginTop: 6, paddingTop: 11 }}>
              <span className="muted">Subtotal</span>
              <span>{brl(16.37)}</span>
            </div>
            <div className="receipt-line">
              <span className="muted">Desconto</span>
              <span>{brl(0)}</span>
            </div>
            <div className="receipt-line total">
              <span>Total</span>
              <span>{brl(18.37)}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn outline" onClick={() => window.print()}>
              <Printer size={16} /> Imprimir
            </button>
            <button className="btn" onClick={() => go("dashboard")}>
              Concluir
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* 15 — Movimentação de Estoque */
function StockMove({ back }: { back: () => void }) {
  const [type, setType] = useState("Entrada");
  return (
    <>
      <TopBar title="Movimentação de estoque" onBack={back} />
      <div className="scroll">
        <div className="page">
          <div className="grid2">
            {["Entrada", "Saída"].map((t) => (
              <button
                key={t}
                className={`card choice ${type === t ? "on" : ""}`}
                style={{ justifyContent: "center" }}
                onClick={() => setType(t)}
              >
                {t === "Entrada" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                <span style={{ fontSize: 13.5, fontWeight: 750 }}>{t}</span>
              </button>
            ))}
          </div>

          <div style={{ height: 16 }} />
          <div className="field">
            <label>Produto</label>
            <select defaultValue="Coca-Cola 2L">
              {["Coca-Cola 2L", "Leite 1L", "Pão de Forma", "Arroz Tipo 1 5kg"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Quantidade</label>
            <input placeholder="0" inputMode="numeric" />
          </div>
          <div className="field">
            <label>Observação</label>
            <textarea placeholder="Ex: reposição do fornecedor" />
          </div>
          <button className="btn" onClick={back}>
            Registrar
          </button>
        </div>
      </div>
    </>
  );
}

/* 16 — Sobre o Sistema */
function About({ back }: { back: () => void }) {
  const features = [
    "Vendas e caixa",
    "Controle de estoque",
    "Relatórios completos",
    "Gestão financeira e de caixa",
    "Backup e sincronização",
  ];
  return (
    <>
      <TopBar title="Sobre o sistema" onBack={back} />
      <div className="scroll">
        <div className="page" style={{ textAlign: "center" }}>
          <span
            style={{
              width: 66,
              height: 66,
              borderRadius: 20,
              margin: "12px auto 0",
              display: "grid",
              placeItems: "center",
              background: "var(--primary-soft)",
              color: "var(--accent-foreground)",
            }}
          >
            <ShoppingCart size={30} />
          </span>
          <h2 style={{ margin: "12px 0 0", fontSize: 19, fontWeight: 850 }}>Mini Market</h2>
          <p className="muted" style={{ margin: "3px 0 0", fontSize: 12 }}>
            v1.0.0
          </p>
          <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
            Sistema PDV para gestão de mercadinhos
          </p>

          <div className="card" style={{ padding: 14, marginTop: 18, textAlign: "left" }}>
            {features.map((f) => (
              <div className="check-line" key={f}>
                <span>
                  <Check size={13} />
                </span>
                {f}
              </div>
            ))}
          </div>

          <div className="card item" style={{ marginTop: 14 }}>
            <span className="thumb">
              <LayoutGrid size={16} />
            </span>
            <div className="body">
              <h3>Protótipo navegável</h3>
              <p>Dados de demonstração</p>
            </div>
          </div>

          <p className="muted" style={{ marginTop: 22, fontSize: 12 }}>
            Desenvolvido com ❤️ para o seu mercadinho
          </p>
        </div>
      </div>
    </>
  );
}

/* ------------------------- gestão do estabelecimento ------------------------ */

/* Caixa: abertura, fechamento, sangria e suprimento */
function Cashier({ go, back }: { go: (s: ScreenId) => void; back: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <TopBar title="Caixa 01" subtitle="Operador: João Silva" onBack={back} />
      <div className="scroll">
        <div className="page">
          <div className="card" style={{ padding: 14 }}>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>
              Situação do caixa
            </p>
            <h2 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 850 }}>
              {open ? "Aberto desde 08:00" : "Fechado"}
            </h2>
          </div>

          <div className="grid2" style={{ marginTop: 10 }}>
            <div className="card stat">
              <span>Abertura</span>
              <strong>{brl(200)}</strong>
            </div>
            <div className="card stat">
              <span>Vendas em dinheiro</span>
              <strong>{brl(812.4)}</strong>
            </div>
            <div className="card stat">
              <span>Sangrias</span>
              <strong>{brl(300)}</strong>
            </div>
            <div className="card stat">
              <span>Suprimentos</span>
              <strong>{brl(100)}</strong>
            </div>
          </div>

          <p className="sec-title">Saldo esperado em gaveta</p>
          <div className="card" style={{ padding: 14 }}>
            <strong style={{ fontSize: 20 }}>{brl(812.4)}</strong>
          </div>

          <p className="sec-title">Operações de caixa</p>
          <div className="list">
            <button className="card item" onClick={() => go("cashierMove")}>
              <span className="thumb">
                <ArrowUpRight size={17} />
              </span>
              <div className="body">
                <h3>Sangria</h3>
                <p>Retirada de valores da gaveta</p>
              </div>
              <ChevronRight size={16} className="muted" />
            </button>
            <button className="card item" onClick={() => go("cashierMove")}>
              <span className="thumb">
                <ArrowDownLeft size={17} />
              </span>
              <div className="body">
                <h3>Suprimento</h3>
                <p>Entrada de troco no caixa</p>
              </div>
              <ChevronRight size={16} className="muted" />
            </button>
          </div>

          <button className="btn" style={{ marginTop: 16 }} onClick={() => setOpen(!open)}>
            {open ? "Fechar caixa" : "Abrir caixa"}
          </button>
        </div>
      </div>
    </>
  );
}

/* Sangria / suprimento */
function CashierMove({ back }: { back: () => void }) {
  const [type, setType] = useState("Sangria");
  return (
    <>
      <TopBar title="Movimentação de caixa" onBack={back} />
      <div className="scroll">
        <div className="page">
          <div className="grid2">
            {["Sangria", "Suprimento"].map((t) => (
              <button
                key={t}
                className={`card choice ${type === t ? "on" : ""}`}
                style={{ justifyContent: "center" }}
                onClick={() => setType(t)}
              >
                {t === "Sangria" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                <span style={{ fontSize: 13.5, fontWeight: 750 }}>{t}</span>
              </button>
            ))}
          </div>
          <div style={{ height: 16 }} />
          <div className="field">
            <label>Valor</label>
            <input placeholder="R$ 0,00" inputMode="decimal" />
          </div>
          <div className="field">
            <label>Responsável</label>
            <select defaultValue="João Silva (gerente)">
              <option>João Silva (gerente)</option>
              <option>Maria Souza (operadora)</option>
            </select>
          </div>
          <div className="field">
            <label>Observação</label>
            <textarea placeholder="Ex: retirada para depósito bancário" />
          </div>
          <button className="btn" onClick={back}>
            Registrar movimentação
          </button>
        </div>
      </div>
    </>
  );
}

/* Fornecedores */
function Suppliers({ back }: { back: () => void }) {
  const list = [
    { name: "Distribuidora Sul Alimentos", doc: "CNPJ 04.112.998/0001-22", tag: "Alimentos" },
    { name: "Bebidas Vale Norte", doc: "CNPJ 18.774.320/0001-05", tag: "Bebidas" },
    { name: "Higiene & Limpeza Prime", doc: "CNPJ 22.905.117/0001-71", tag: "Higiene" },
    { name: "Panificadora Central", doc: "CNPJ 31.660.404/0001-18", tag: "Padaria" },
  ];
  return (
    <>
      <TopBar
        title="Fornecedores"
        subtitle="4 cadastrados"
        onBack={back}
        action={
          <button
            aria-label="Novo fornecedor"
            onClick={() => window.alert("O cadastro de fornecedor será adicionado nesta tela.")}
          >
            <Plus size={18} />
          </button>
        }
      />
      <div className="scroll">
        <div className="page">
          <div className="search">
            <Search size={16} className="muted" />
            <input placeholder="Buscar fornecedor..." />
          </div>
          <div className="list" style={{ marginTop: 12 }}>
            {list.map((f) => (
              <div className="card item" key={f.name}>
                <span className="thumb">
                  <Truck size={17} />
                </span>
                <div className="body">
                  <h3>{f.name}</h3>
                  <p>
                    {f.doc} · {f.tag}
                  </p>
                </div>
                <ChevronRight size={16} className="muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* Compras / entradas */
function Purchases({ go, back }: { go: (s: ScreenId) => void; back: () => void }) {
  const list = [
    { id: "#C-1042", sup: "Distribuidora Sul Alimentos", total: 1240.5, st: "Recebida" },
    { id: "#C-1041", sup: "Bebidas Vale Norte", total: 860.0, st: "Recebida" },
    { id: "#C-1040", sup: "Higiene & Limpeza Prime", total: 412.9, st: "Pendente" },
  ];
  return (
    <>
      <TopBar title="Compras e entradas" subtitle="Setembro / 2026" onBack={back} />
      <div className="scroll">
        <div className="page">
          <div className="grid2">
            <div className="card stat">
              <span>Compras do mês</span>
              <strong>{brl(2513.4)}</strong>
            </div>
            <div className="card stat">
              <span>Notas pendentes</span>
              <strong>1</strong>
            </div>
          </div>

          <p className="sec-title">Últimas entradas</p>
          <div className="list">
            {list.map((c) => (
              <div className="card item" key={c.id}>
                <span className="thumb">
                  <ClipboardList size={17} />
                </span>
                <div className="body">
                  <h3>
                    {c.id} · {c.sup}
                  </h3>
                  <p>{c.st}</p>
                </div>
                <strong style={{ fontSize: 13.5 }}>{brl(c.total)}</strong>
              </div>
            ))}
          </div>

          <button className="btn" style={{ marginTop: 16 }} onClick={() => go("stockMove")}>
            <Plus size={16} /> Lançar entrada de mercadoria
          </button>
        </div>
      </div>
    </>
  );
}

/* Usuários e operadores */
function UsersScreen({ back }: { back: () => void }) {
  const list = [
    { name: "João Silva", role: "Administrador", on: true },
    { name: "Maria Souza", role: "Operador de caixa", on: true },
    { name: "Carlos Lima", role: "Estoquista", on: true },
    { name: "Ana Reis", role: "Operador de caixa", on: false },
  ];
  return (
    <>
      <TopBar
        title="Usuários e operadores"
        subtitle="4 usuários"
        onBack={back}
        action={
          <button
            aria-label="Novo usuário"
            onClick={() => window.alert("O cadastro de usuário será adicionado nesta tela.")}
          >
            <Plus size={18} />
          </button>
        }
      />
      <div className="scroll">
        <div className="page">
          <div className="list">
            {list.map((u) => (
              <div className="card item" key={u.name}>
                <span className="thumb">
                  <UserRound size={17} />
                </span>
                <div className="body">
                  <h3>{u.name}</h3>
                  <p>{u.role}</p>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: u.on ? "var(--primary)" : "var(--destructive)",
                  }}
                >
                  {u.on ? "ATIVO" : "INATIVO"}
                </span>
              </div>
            ))}
          </div>

          <p className="sec-title">Permissões</p>
          <div className="list">
            {["Aplicar descontos", "Cancelar venda", "Realizar sangria", "Editar produtos"].map(
              (p) => (
                <div className="card item" key={p}>
                  <span className="thumb">
                    <Lock size={17} />
                  </span>
                  <div className="body">
                    <h3>{p}</h3>
                    <p>Somente administrador</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* Dados do estabelecimento */
function Company({ back }: { back: () => void }) {
  const fields: [string, string][] = [
    ["Razão social", "Mercadinho Bom Preço LTDA"],
    ["Nome fantasia", "Mini Market"],
    ["CNPJ", "12.345.678/0001-90"],
    ["Inscrição estadual", "110.042.490.114"],
    ["Regime tributário", "Simples Nacional"],
    ["Telefone", "(11) 4002-8922"],
    ["Endereço", "Rua das Palmeiras, 320 — Centro"],
  ];
  return (
    <>
      <TopBar title="Dados do estabelecimento" onBack={back} />
      <div className="scroll">
        <div className="page">
          <div className="card item" style={{ padding: 14 }}>
            <span className="thumb" style={{ width: 44, height: 44 }}>
              <Building2 size={20} />
            </span>
            <div className="body">
              <h3 style={{ fontSize: 15, fontWeight: 850 }}>Mercadinho Bom Preço LTDA</h3>
              <p>Matriz · 1 caixa ativo</p>
            </div>
          </div>

          <p className="sec-title">Cadastro</p>
          <div className="list">
            {fields.map(([k, v]) => (
              <div className="card item" key={k}>
                <div className="body">
                  <p style={{ fontSize: 11 }}>{k}</p>
                  <h3>{v}</h3>
                </div>
              </div>
            ))}
          </div>

          <button className="btn" style={{ marginTop: 16 }} onClick={back}>
            Salvar dados
          </button>
        </div>
      </div>
    </>
  );
}

/* Configuração fiscal */
function Fiscal({ back }: { back: () => void }) {
  return (
    <>
      <TopBar title="Configuração fiscal" subtitle="NFC-e e NF-e" onBack={back} />
      <div className="scroll">
        <div className="page">
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 850 }}>Área em preparação</h3>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
              Emissão fiscal ainda não habilitada neste protótipo. Apenas visualização das
              configurações previstas.
            </p>
          </div>

          <p className="sec-title">Parâmetros fiscais</p>
          <div className="list">
            {[
              ["Emissão de NFC-e", "Não configurado"],
              ["Emissão de NF-e", "Não configurado"],
              ["Certificado digital A1", "Não enviado"],
              ["Série e numeração", "Série 1 · próxima 000000001"],
              ["Ambiente", "Homologação"],
              ["CFOP padrão de venda", "5.102"],
            ].map(([k, v]) => (
              <div className="card item" key={k}>
                <span className="thumb">
                  <Calculator size={17} />
                </span>
                <div className="body">
                  <h3>{k}</h3>
                  <p>{v}</p>
                </div>
                <ChevronRight size={16} className="muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* Clientes / crediário */
function Customers({ back }: { back: () => void }) {
  const list = [
    { name: "Padaria do Zé (CNPJ)", doc: "08.554.221/0001-33", due: 340.5 },
    { name: "Lanchonete Vila Nova", doc: "27.118.440/0001-09", due: 128.0 },
    { name: "Escola Jardim Azul", doc: "14.902.330/0001-55", due: 0 },
  ];
  return (
    <>
      <TopBar
        title="Clientes e crediário"
        subtitle="Contas a receber"
        onBack={back}
        action={
          <button
            aria-label="Novo cliente"
            onClick={() => window.alert("O cadastro de cliente será adicionado nesta tela.")}
          >
            <Plus size={18} />
          </button>
        }
      />
      <div className="scroll">
        <div className="page">
          <div className="grid2">
            <div className="card stat">
              <span>Em aberto</span>
              <strong>{brl(468.5)}</strong>
            </div>
            <div className="card stat">
              <span>Contas ativas</span>
              <strong>2</strong>
            </div>
          </div>

          <p className="sec-title">Cadastros</p>
          <div className="list">
            {list.map((c) => (
              <div className="card item" key={c.name}>
                <span className="thumb">
                  <HandCoins size={17} />
                </span>
                <div className="body">
                  <h3>{c.name}</h3>
                  <p>CNPJ {c.doc}</p>
                </div>
                <strong style={{ fontSize: 13 }}>{brl(c.due)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}