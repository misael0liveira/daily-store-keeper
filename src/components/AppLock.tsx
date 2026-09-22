import { useCallback, useEffect, useRef, useState } from "react";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { Fingerprint, LockKeyhole } from "lucide-react";
import { App as CapacitorApp } from "@capacitor/app";

const isNativeApp = typeof window !== "undefined" && window.location.protocol === "capacitor:";

export function AppLock({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const busyRef = useRef(false);
  const listenerRef = useRef<{ remove: () => Promise<void> } | null>(null);

  const unlock = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      if (!isNativeApp) {
        setUnlocked(true);
        return;
      }

      const info = await BiometricAuth.checkBiometry();
      if (!info.isAvailable) {
        setError("Cadastre uma biometria no Android para desbloquear o aplicativo.");
        return;
      }

      await BiometricAuth.authenticate({
        reason: "Desbloqueie o Mercadinho União para acessar o estabelecimento.",
        androidTitle: "Desbloquear Mercadinho União",
        androidSubtitle: "Use sua biometria",
        androidConfirmationRequired: false,
        allowDeviceCredential: false,
      });

      setUnlocked(true);
    } catch (err: unknown) {
      console.warn("[App lock]", err);
      setError("Não foi possível desbloquear. Tente novamente usando sua biometria.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

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
  }, [unlock]);

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
    <div className="relative z-[1] flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm rounded-3xl border bg-card p-7 text-center shadow-sm">
        <img
          src="/brand/mercadinho-uniao-logo.svg"
          alt="Mercadinho União"
          className="mx-auto w-full max-w-[290px]"
        />
        <p className="mt-5 text-sm text-muted-foreground">
          Aplicativo bloqueado. Use a biometria cadastrada no seu celular para continuar.
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
          Protegido pela biometria do Android
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
