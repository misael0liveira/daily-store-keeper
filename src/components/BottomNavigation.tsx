import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Boxes, ScanBarcode, House, ReceiptText, Settings } from "lucide-react";

const navigation = [
  { to: "/", label: "Início", icon: House },
  { to: "/vendas", label: "Histórico", icon: ReceiptText },
  { to: "/vender", label: "Caixa", icon: ScanBarcode },
  { to: "/estoque", label: "Estoque", icon: Boxes },
  { to: "/mais", label: "Ajustes", icon: Settings },
] as const;

// Reference coordinates: 550 × 140, with the bead centred on the bar's top edge.
// The same centre drives the curve and bead so they cannot drift during motion.
function dockOutline(center: number) {
  const x = center * 550;
  return [
    "M26 45",
    `H${x - 57}`,
    `C${x - 51} 45 ${x - 49} 45 ${x - 47} 57`,
    `C${x - 45} 69 ${x - 32} 93 ${x} 93`,
    `C${x + 32} 93 ${x + 45} 69 ${x + 47} 57`,
    `C${x + 49} 45 ${x + 51} 45 ${x + 57} 45`,
    "H524 Q549 45 549 70 V114 Q549 139 524 139",
    "H26 Q1 139 1 114 V70 Q1 45 26 45 Z",
  ].join(" ");
}

export function BottomNavigation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selected = pathname.startsWith("/vendas/configuracoes")
    ? 4
    : Math.max(
        0,
        navigation.findIndex((item) =>
          item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
        ),
      );
  const navRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const centerRef = useRef(0.15 + selected * 0.175);

  useEffect(() => {
    const nav = navRef.current;
    const path = pathRef.current;
    if (!nav || !path) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target = 0.15 + selected * 0.175;
    const start = centerRef.current;
    let frame = 0;
    const draw = (center: number) => {
      centerRef.current = center;
      nav.style.setProperty("--dock-center", `${center * 100}%`);
      path.setAttribute("d", dockOutline(center));
    };
    const finish = () => {
      cancelAnimationFrame(frame);
      draw(target);
    };
    if (motion.matches || start === target) {
      finish();
    } else {
      const started = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - started) / 470, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        draw(start + (target - start) * eased);
        if (progress < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    }
    const onMotionChange = () => {
      if (motion.matches) finish();
    };
    motion.addEventListener("change", onMotionChange);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", onMotionChange);
    };
  }, [selected]);

  return (
    <nav ref={navRef} className="pos-nav" aria-label="Navegação principal">
      <svg className="pos-nav-outline" viewBox="0 0 550 140" aria-hidden="true">
        <path ref={pathRef} d={dockOutline(centerRef.current)} />
      </svg>
      <div className="pos-nav-bubble" aria-hidden="true" />
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
              <Icon aria-hidden="true" size={23} strokeWidth={1.8} />
            </span>
            <span className="pos-nav-label">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
