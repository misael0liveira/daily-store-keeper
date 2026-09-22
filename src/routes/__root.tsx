import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { Boxes, ScanBarcode, House, ReceiptText, Settings } from "lucide-react";
import appCss from "../styles.css?url";
import { AppLock } from "@/components/AppLock";
import { AppUpdatePrompt } from "@/components/AppUpdatePrompt";
import { Toaster } from "@/components/ui/sonner";
import { registerPWA } from "@/lib/pwa-register";
import { useStore } from "@/store/useStore";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl tracking-wide text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Você pode tentar novamente ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tentar de novo
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Mercadinho União" },
      {
        name: "description",
        content: "Sistema de caixa e estoque do Mercadinho União.",
      },
      { name: "theme-color", content: "#005BAA" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Mercadinho União" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ThemeApplier() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return null;
}

function BrandWatermark() {
  return (
    <div className="app-watermark" aria-hidden="true">
      <img src="/brand/mercadinho-uniao-logo.svg" alt="" />
    </div>
  );
}

const navigation = [
  { to: "/", label: "Início", icon: House },
  { to: "/vendas", label: "Histórico", icon: ReceiptText },
  { to: "/vender", label: "Caixa", icon: ScanBarcode },
  { to: "/estoque", label: "Estoque", icon: Boxes },
  { to: "/mais", label: "Ajustes", icon: Settings },
] as const;

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selected = pathname.startsWith("/vendas/configuracoes")
    ? 4
    : Math.max(
        0,
        navigation.findIndex((item) =>
          item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
        ),
      );
  return (
    <nav
      className="pos-nav"
      aria-label="Navegação principal"
      style={{ "--active-tab": selected } as CSSProperties}
    >
      <div className="pos-nav-surface" aria-hidden="true" />
      <svg
        className="pos-nav-notch"
        viewBox="0 -2 84 38"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0-2H84V0C72 0 69 4 63 14C56 27 51 34 42 34C33 34 28 27 21 14C15 4 12 0 0 0Z" />
      </svg>
      <div className="pos-nav-bubble" aria-hidden="true" />
      {navigation.map(({ to, label, icon: Icon }, index) => (
        <Link
          key={to}
          to={to}
          aria-current={selected === index ? "page" : undefined}
          className={`pos-nav-item ${selected === index ? "is-active" : ""}`}
        >
          <Icon aria-hidden="true" size={23} strokeWidth={1.8} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminCodes = pathname.replace(/\/+$/, "") === "/codigos";
  useEffect(() => {
    registerPWA();
  }, []);

  if (isAdminCodes) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeApplier />
        <BrandWatermark />
        <main className="mx-auto max-w-lg">
          <Outlet />
        </main>
        <Toaster richColors position="top-center" />
        <AppUpdatePrompt />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <BrandWatermark />
      <AppLock>
        <main className="m3-app-content mx-auto max-w-lg">
          <Outlet />
        </main>
        <BottomNav />
        <Toaster richColors position="top-center" />
        <AppUpdatePrompt />
      </AppLock>
    </QueryClientProvider>
  );
}
