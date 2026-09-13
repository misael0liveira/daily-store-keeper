import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Moon, Package, Receipt, ShoppingCart, Store, Sun } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { unlockAudio } from "@/lib/feedback";
import { useStore } from "@/store/useStore";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl tracking-wide text-foreground">
          404
        </h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Página não encontrada
        </h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

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
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        { title: "Mini Mercado PDV" },
        {
          name: "description",
          content:
            "Frente de caixa e gestão de estoque para mini mercado, direto no celular.",
        },
        { name: "theme-color", content: "#3b82f6" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "default",
        },
        { name: "apple-mobile-web-app-title", content: "Mercado PDV" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Bebas+Neue&display=swap",
        },
        { rel: "icon", href: "/favicon.png", type: "image/png" },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  }
);

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

function Header() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
          <Store className="size-5 text-primary-foreground" />
        </div>
        <span className="font-display text-2xl tracking-wide">
          Mini Mercado
        </span>
      </div>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Alternar tema claro e escuro"
        className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-accent"
      >
        {theme === "dark" ? (
          <Sun className="size-5" />
        ) : (
          <Moon className="size-5" />
        )}
      </button>
    </header>
  );
}

function BottomNav() {
  const linkClass =
    "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <Link
        to="/"
        className={linkClass}
        activeProps={{ className: `${linkClass} text-primary` }}
        inactiveProps={{ className: `${linkClass} text-muted-foreground` }}
        activeOptions={{ exact: true }}
      >
        <ShoppingCart className="size-6" />
        Caixa
      </Link>
      <Link
        to="/estoque"
        className={linkClass}
        activeProps={{ className: `${linkClass} text-primary` }}
        inactiveProps={{ className: `${linkClass} text-muted-foreground` }}
      >
        <Package className="size-6" />
        Estoque
      </Link>
      <Link
        to="/vendas"
        className={linkClass}
        activeProps={{ className: `${linkClass} text-primary` }}
        inactiveProps={{ className: `${linkClass} text-muted-foreground` }}
      >
        <Receipt className="size-6" />
        Vendas
      </Link>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const unlock = () => unlockAudio();
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      <Header />
      <main className="mx-auto max-w-lg">
        <Outlet />
      </main>
      <BottomNav />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
