import { createFileRoute, Link } from "@tanstack/react-router";
import { formatBRL, PAYMENT_LABELS, useStore } from "@/store/useStore";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const { products, sales, cashOpen, settings } = useStore();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = sales.filter((s) => s.timestamp >= start.getTime());
  const productList = Object.values(products);
  const lowStock = productList.filter((p) => p.stock <= 5);
  const recent = [...sales].sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);
  return (
    <div className="pos-page pos-home">
      <header className="pos-header pos-home-header">
        <img
          src="/brand/mercadinho-uniao-logo.png"
          alt={settings.storeName || "Mercadinho União"}
          className="pos-home-logo"
        />
        <span className={`pos-status ${cashOpen ? "is-open" : ""}`}>
          <i />
          Caixa {cashOpen ? "aberto" : "fechado"}
        </span>
      </header>
      <section className="pos-card pos-summary" aria-labelledby="today-title">
        <h2 id="today-title">Resumo de hoje</h2>
        <strong>{formatBRL(today.reduce((sum, s) => sum + s.total, 0))}</strong>
        <p>
          {today.length} vendas ·{" "}
          {today.reduce((sum, s) => sum + s.items.reduce((n, i) => n + i.qty, 0), 0)} itens
        </p>
        <Link to="/vender" className="pos-primary">
          Nova venda
        </Link>
      </section>
      <section className="pos-card">
        <div className="pos-section-heading">
          <h2>Precisam de reposição</h2>
          <Link to="/estoque">Ver estoque</Link>
        </div>
        {lowStock.length ? (
          <ul className="pos-rows">
            {lowStock.slice(0, 3).map((p) => (
              <li key={p.barcode}>
                <span>{p.name}</span>
                <span className="pos-low-stock">{p.stock} un.</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pos-empty">
            {productList.length === 0
              ? "Nenhum produto cadastrado. Cadastre o primeiro item no estoque."
              : "Nenhum produto precisa de reposição."}
          </p>
        )}
      </section>
      <section className="pos-card">
        <h2>Últimas vendas</h2>
        {recent.length ? (
          <ul className="pos-rows">
            {recent.map((s) => (
              <li key={s.id}>
                <span className="text-muted-foreground">
                  {new Date(s.timestamp).toLocaleDateString() !== new Date().toLocaleDateString() &&
                    `${new Date(s.timestamp).toLocaleDateString("pt-BR")} · `}
                  {new Date(s.timestamp).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {PAYMENT_LABELS[s.method]}
                </span>
                <span>{formatBRL(s.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pos-empty">Suas vendas aparecerão aqui.</p>
        )}
      </section>
    </div>
  );
}
