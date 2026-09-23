import { useEffect, useState, type ReactNode } from "react";

const isNativeApp = typeof window !== "undefined" && window.location.protocol === "capacitor:";

export function AppStartup({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isNativeApp);

  useEffect(() => {
    if (!isNativeApp) return;
    const timer = window.setTimeout(() => setReady(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  if (ready) return <>{children}</>;

  return (
    <div className="app-startup" role="status" aria-label="Abrindo Mercadinho União">
      <img src="/brand/mercadinho-uniao-logo.png" alt="Mercadinho União" />
      <span>Abrindo…</span>
    </div>
  );
}
