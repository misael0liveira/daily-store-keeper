import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes, ScanBarcode, ReceiptText, Settings, NotebookPen } from "lucide-react";

const navigation = [
  { to: "/", label: "Fiados", icon: NotebookPen },
  { to: "/vendas", label: "Histórico", icon: ReceiptText },
  { to: "/vender", label: "Caixa", icon: ScanBarcode },
  { to: "/estoque", label: "Estoque", icon: Boxes },
  { to: "/mais", label: "Ajustes", icon: Settings },
] as const;

export function BottomNavigation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selected =
    pathname.startsWith("/vendas/configuracoes") ||
    pathname.startsWith("/gestao") ||
    pathname.startsWith("/resumo")
      ? 4
      : Math.max(
          0,
          navigation.findIndex((item) =>
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
          ),
        );
  return (
    <nav className="pos-nav" aria-label="Navegação principal">
      <div className="pos-nav-links">
        {navigation.map(({ to, label, icon: Icon }, index) => (
          <Link
            key={to}
            to={to}
            aria-label={label}
            aria-current={selected === index ? "page" : undefined}
            className={`pos-nav-item ${selected === index ? "is-active" : ""}`}
          >
            <span className="pos-nav-icon">
              <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
            </span>
            <span className="pos-nav-label">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
