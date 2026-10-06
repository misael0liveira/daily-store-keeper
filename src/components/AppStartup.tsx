import { useEffect, useState, type ReactNode } from "react";
import { ClientOnly, useRouter } from "@tanstack/react-router";
import { isNativeApp } from "@/lib/platform";

export function AppStartup({ children }: { children: ReactNode }) {
  return (
    <ClientOnly fallback={children}>
      <StartupGate>{children}</StartupGate>
    </ClientOnly>
  );
}

function StartupGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(() => !isNativeApp());

  useEffect(() => {
    if (!isNativeApp()) return;
    void router.navigate({ to: "/vender", replace: true });
    const timer = window.setTimeout(() => setReady(true), 2000);
    return () => window.clearTimeout(timer);
  }, [router]);

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
