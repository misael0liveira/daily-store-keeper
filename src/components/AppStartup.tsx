import { useEffect, useState, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { isNativeApp } from "@/lib/platform";

export function AppStartup({ children }: { children: ReactNode }) {
  return (
    <ClientOnly fallback={children}>
      <StartupGate>{children}</StartupGate>
    </ClientOnly>
  );
}

function StartupGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(() => !isNativeApp());

  useEffect(() => {
    if (!isNativeApp()) return;
    const timer = window.setTimeout(() => setReady(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  if (ready) return <>{children}</>;

  return (
    <div className="app-startup" role="status" aria-label="Abrindo Mercadinho União">
      <img
        src="/brand/mercadinho-uniao-approved.jpg"
        alt="Mercadinho União"
        width={1536}
        height={847}
      />
      <span>Abrindo…</span>
    </div>
  );
}
