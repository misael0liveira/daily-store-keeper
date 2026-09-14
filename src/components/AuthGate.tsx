import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncPendingSales } from "@/lib/sync";
import { useStore } from "@/store/useStore";

const ACTIVATION_KEY = "mini-market-client-activation";

type Activation = { code: string; deviceId: string };

function getDeviceId() {
  const key = "mini-market-device-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(key, id);
  return id;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [activated, setActivated] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(ACTIVATION_KEY);
    setActivated(Boolean(saved));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!activated) return;
    let cancelled = false;
    const sync = async () => {
      if (cancelled) return;
      const state = useStore.getState();
      const result = await syncPendingSales(state.sales, state.products);
      if (result.status === "done" && result.synced.length) useStore.getState().markSalesSynced(result.synced);
      if (result.status === "error") console.warn("[Supabase sync]", result.error);
    };
    const timers = [500, 2000, 5000].map((delay) => window.setTimeout(() => void sync(), delay));
    window.addEventListener("online", sync);
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      window.removeEventListener("online", sync);
    };
  }, [activated]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setBusy(true);
    setMessage("");

    try {
      const deviceId = getDeviceId();
      const { data, error } = await (supabase as any).rpc("activate_device_license", {
        p_code: normalized,
        p_device_id: deviceId,
      });

      if (error) throw error;

      if (!data?.ok) {
        const messages: Record<string, string> = {
          invalid_code: "Código inválido. Verifique o código e tente novamente.",
          inactive_code: "Este código está desativado.",
          device_mismatch: "Este código já está vinculado a outro celular.",
          invalid_input: "Informe um código válido.",
        };
        setMessage(messages[data?.reason] || "Não foi possível ativar este código.");
        return;
      }

      const activation: Activation = { code: normalized, deviceId };
      localStorage.setItem(ACTIVATION_KEY, JSON.stringify(activation));
      setActivated(true);
    } catch (error: any) {
      console.error("[Client activation]", error);
      setMessage(error?.message || "Não foi possível validar o código. Confira sua internet e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  if (activated) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 pb-16">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Mini Mercado PDV</h1>
          <p className="mt-1 text-sm text-muted-foreground">Digite o código de ativação fornecido pelo administrador.</p>
        </div>
        <input
          className="w-full rounded-xl border bg-background px-3 py-3 text-center text-base font-semibold tracking-wider uppercase"
          type="text"
          placeholder="MK-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          required
        />
        {message && <p className="text-sm text-destructive">{message}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Validando…" : "Ativar aplicativo"}
        </button>
      </form>
    </div>
  );
}
