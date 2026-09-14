import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Plus, RefreshCw, ShieldCheck, Smartphone, UserRound, XCircle } from "lucide-react";

type License = {
  id: string;
  code: string;
  status: string;
  device_id: string | null;
  client_name: string | null;
  activated_at: string | null;
  created_at: string;
};

const rpc = (name: string, args?: Record<string, unknown>) =>
  (supabase as unknown as { rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }).rpc(name, args);

export function AdminApp() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(null);
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientName, setClientName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadLicenses() {
    setBusy(true);
    setError("");
    const { data, error } = await rpc("admin_list_licenses");
    if (error) setError(error.message);
    else setLicenses((data ?? []) as License[]);
    setBusy(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) void loadLicenses();
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) void loadLicenses();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message);
    setBusy(false);
  }

  async function createLicense(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { error } = await rpc("admin_create_license", {
      p_code: code.trim().toUpperCase(),
      p_client_name: clientName.trim() || null,
    });
    if (error) setError(error.message);
    else {
      setMessage("Licença criada com sucesso.");
      setCode("");
      setClientName("");
      await loadLicenses();
    }
    setBusy(false);
  }

  async function updateLicense(id: string, status: string | null, release = false) {
    setBusy(true);
    setError("");
    const { error } = await rpc("admin_update_license", {
      p_id: id,
      p_status: status,
      p_release_device: release,
    });
    if (error) setError(error.message);
    else await loadLicenses();
    setBusy(false);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Carregando ADM...</div>;

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
        <div className="mx-auto max-w-md pt-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950"><ShieldCheck className="size-6" /></div>
            <div><p className="text-sm font-semibold text-emerald-400">MINI MERCADO</p><h1 className="text-2xl font-bold">ADM</h1></div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Acesso administrativo</h2>
            <p className="mt-1 text-sm text-slate-400">Entre com uma conta autorizada no painel.</p>
            <form onSubmit={signIn} className="mt-6 space-y-4">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" placeholder="E-mail" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500" required />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Senha" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500" required />
              {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              <button disabled={busy} className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{busy ? "Entrando..." : "Entrar"}</button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const active = licenses.filter((l) => l.status === "active").length;
  const bound = licenses.filter((l) => !!l.device_id).length;
  const available = licenses.filter((l) => l.status === "active" && !l.device_id).length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-10 pt-6 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-bold tracking-[0.2em] text-emerald-400">MINI MERCADO</p><h1 className="text-2xl font-extrabold">Painel ADM</h1></div>
          <button onClick={() => supabase.auth.signOut()} className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300" aria-label="Sair"><LogOut className="size-5" /></button>
        </header>

        <section className="mt-6 grid grid-cols-3 gap-2">
          <Stat label="Ativas" value={active} />
          <Stat label="Disponíveis" value={available} />
          <Stat label="Vinculadas" value={bound} />
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2"><Plus className="size-5 text-emerald-400" /><h2 className="font-bold">Nova licença</h2></div>
          <form onSubmit={createLicense} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Cliente" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white" />
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código (ex.: MK-7F4K-92XA)" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white" required />
            <button disabled={busy} className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50">Criar</button>
          </form>
          {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between"><h2 className="font-bold">Licenças</h2><button onClick={() => void loadLicenses()} className="flex size-10 items-center justify-center rounded-xl bg-white/5" aria-label="Atualizar"><RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} /></button></div>
          <div className="mt-3 space-y-2">
            {licenses.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Nenhuma licença cadastrada.</p> : licenses.map((license) => (
              <article key={license.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="font-mono font-bold text-emerald-300">{license.code}</p><p className="mt-1 flex items-center gap-1 text-sm text-slate-300"><UserRound className="size-3.5" />{license.client_name || "Sem cliente"}</p></div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${license.status === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{license.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Smartphone className="size-3.5" />{license.device_id ? "Dispositivo vinculado" : "Sem dispositivo"}</span></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {license.status === "active" ? <button onClick={() => void updateLicense(license.id, "blocked")} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300">Bloquear</button> : <button onClick={() => void updateLicense(license.id, "active")} className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">Ativar</button>}
                  {license.device_id && <button onClick={() => void updateLicense(license.id, null, true)} className="rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300"><XCircle className="mr-1 inline size-3.5" />Liberar dispositivo</button>}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>;
}
