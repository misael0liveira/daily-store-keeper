import { useEffect, useRef, useState } from "react";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { Fingerprint, LockKeyhole, ShieldCheck } from "lucide-react";
import { App as CapacitorApp } from "@capacitor/app";

const isNativeApp = typeof window !== "undefined" && window.location.protocol === "capacitor:";

export function AppLock({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const listenerRef = useRef<{ remove: () => Promise<void> } | null>(null);

  async function unlock() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (!isNativeApp) {
        setUnlocked(true);
        return;
      }

      const info = await BiometricAuth.checkBiometry();
      if (!info.isAvailable && !info.deviceIsSecure) {
        setError("Configure a digital, PIN, padrão ou senha no bloqueio do seu celular para desbloquear o aplicativo.");
        return;
      }

      await BiometricAuth.authenticate({
        reason: "Desbloqueie o Mini Market PDV para acessar o estabelecimento.",
        androidTitle: "Desbloquear Mini Market PDV",
        androidSubtitle: "Use sua digital ou o bloqueio de tela do celular",
        androidConfirmationRequired: false,
        allowDeviceCredential: true,
      });

      setUnlocked(true);
    } catch (err: any) {
      console.warn("[App lock]", err);
      setError("Não foi possível desbloquear. Tente novamente com sua digital ou com o PIN, padrão ou senha do celular.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      if (!isNativeApp) {
        setUnlocked(true);
        return;
      }

      await unlock();

      try {
        listenerRef.current = await BiometricAuth.addResumeListener(() => {
          if (!cancelled) setUnlocked(false);
        });
      } catch (err) {
        console.warn("[App lock resume listener]", err);
      }
    };

    void setup();

    return () => {
      cancelled = true;
      void listenerRef.current?.remove();
      listenerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isNativeApp) return;
    const listener = CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) setUnlocked(false);
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm rounded-3xl border bg-card p-7 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck size={32} />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Mini Market PDV</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aplicativo bloqueado. Desbloqueie usando a digital ou a senha, PIN ou padrão de bloqueio do seu celular.
        </p>

        <button
          type="button"
          onClick={() => void unlock()}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          <Fingerprint size={19} />
          {busy ? "Aguardando autenticação…" : "Desbloquear aplicativo"}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole size={14} />
          Protegido pelo bloqueio de tela do Android
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
