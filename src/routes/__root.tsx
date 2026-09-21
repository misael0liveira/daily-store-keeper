import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, useRouterState, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Boxes, ScanBarcode, ShoppingCart, Store, Wallet } from "lucide-react";
import appCss from "../styles.css?url";
import { AppLock } from "@/components/AppLock";
import { AppUpdatePrompt } from "@/components/AppUpdatePrompt";
import { Toaster } from "@/components/ui/sonner";
import { registerPWA } from "@/lib/pwa-register";
import { useStore } from "@/store/useStore";

function NotFoundComponent() {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="font-display text-7xl tracking-wide text-foreground">404</h1><h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2><div className="mt-6"><Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Voltar ao início</Link></div></div></div>;
}
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-xl font-semibold tracking-tight text-foreground">Esta página não carregou</h1><p className="mt-2 text-sm text-muted-foreground">Algo deu errado. Você pode tentar novamente ou voltar ao início.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Tentar de novo</button><Link to="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground">Voltar ao início</Link></div></div></div>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Mini Market PDV" },
      { name: "description", content: "Sistema PDV/ERP mobile para gestão do estabelecimento e CNPJ." },
      { name: "theme-color", content: "#225d3f" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Mini Market PDV" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}

function ThemeApplier() {
  const theme = useStore((s) => s.theme);
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);
  return null;
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = (path: string) => path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <nav className="m3-bottom-navigation pdv-bottom-nav fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg items-end bg-card/95 px-2 backdrop-blur">
      <BottomItem to="/" label="Início" icon={<Store className="size-5" />} active={active("/")} />
      <BottomItem to="/vendas" label="Vendas" icon={<ShoppingCart className="size-5" />} active={active("/vendas")} />
      <Link to="/vender" aria-label="Abrir Caixa" className="pdv-scan-action -mt-9 mx-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground transition-transform active:scale-95">
        <ScanBarcode className="size-7" strokeWidth={2.4} />
      </Link>
      <BottomItem to="/estoque" label="Estoque" icon={<Boxes className="size-5" />} active={active("/estoque")} />
      <BottomItem to="/mais" label="Mais" icon={<Wallet className="size-5" />} active={active("/mais")} />
    </nav>
  );
}

function BottomItem({ to, label, icon, active }: { to: "/" | "/vender" | "/vendas" | "/estoque" | "/mais"; label: string; icon: ReactNode; active: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className={`pdv-bottom-item flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-bold transition-colors ${active ? "is-active bg-primary/10 text-primary" : "text-muted-foreground"}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminCodes = pathname.replace(/\/+$/, "") === "/codigos";
  useEffect(() => { registerPWA(); }, []);

  if (isAdminCodes) {
    return <QueryClientProvider client={queryClient}><ThemeApplier /><main className="mx-auto max-w-lg"><Outlet /></main><Toaster richColors position="top-center" /><AppUpdatePrompt /></QueryClientProvider>;
  }

  return <QueryClientProvider client={queryClient}>
    <AppLock>
      <ThemeApplier />
      <main className="m3-app-content mx-auto max-w-lg"><Outlet /></main>
      <BottomNav />
      <Toaster richColors position="top-center" />
      <AppUpdatePrompt />
    </AppLock>
  </QueryClientProvider>;
}
