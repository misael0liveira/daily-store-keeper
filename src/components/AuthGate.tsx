import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncPendingSales } from "@/lib/sync";
import { useStore } from "@/store/useStore";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    const sync = async () => {
      if (cancelled) return;
      const state = useStore.getState();
      const result = await syncPendingSales(state.sales, state.products);
      if (result.status === "done" && result.synced.length) {
        useStore.getState().markSalesSynced(result.synced);
      }
      if (result.status === "error") {
        console.warn("[Supabase sync]", result.error);
      }
    };

    // Zustand persist pode hidratar depois do primeiro evento de sessão.
    // Fazemos algumas tentativas para garantir que os produtos locais sejam enviados.
    const timers = [500, 2000, 5000].map((delay) => window.setTimeout(() => void sync(), delay));
    const onOnline = () => void sync();
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      window.removeEventListener("online", onOnline);
    };
  }, [session?.user?.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Cadastro criado. Confirme seu e-mail para entrar.");
    setBusy(false);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  if (session) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 pb-16">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Mini Mercado PDV</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entre para sincronizar estoque e vendas na nuvem.</p>
        </div>
        <div className="space-y-3">
          <input className="w-full rounded-xl border bg-background px-3 py-3 text-sm" type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full rounded-xl border bg-background px-3 py-3 text-sm" type="password" placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </div>
        {message && <p className="text-sm text-destructive">{message}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}</button>
        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="w-full text-sm font-medium text-primary">{mode === "login" ? "Ainda não tenho conta" : "Já tenho uma conta"}</button>
      </form>
    </div>
  );
}
