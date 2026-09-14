import { FormEvent, useState } from "react";
import { ShieldCheck, Smartphone } from "lucide-react";
import { activateLicense, getStoredLicense } from "@/lib/license";

const messages: Record<string, string> = {
  invalid_code: "Digite um código de ativação válido.",
  code_not_found: "Código não encontrado. Confira os caracteres e tente novamente.",
  code_blocked: "Este código está bloqueado. Fale com o administrador.",
  code_already_linked: "Este código já está vinculado a outro celular.",
  connection_error: "Não foi possível validar o código agora. Verifique sua internet e tente novamente.",
  activation_error: "Não foi possível ativar este código.",
  invalid_device: "Não foi possível identificar esta instalação.",
};

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const [licensed, setLicensed] = useState(() => getStoredLicense()?.ok === true);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (licensed) return <>{children}</>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await activateLicense(code);
    if (result.ok) {
      setLicensed(true);
      return;
    }
    setError(messages[result.error ?? "activation_error"] ?? messages.activation_error);
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-8">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6 rounded-3xl border bg-card p-7 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-foreground">Ativar Mini Mercado PDV</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Digite o código de ativação fornecido pelo administrador. O código será vinculado a este celular.</p>
        </div>

        <div className="space-y-3">
          <label htmlFor="license-code" className="text-sm font-semibold text-foreground">Código de ativação</label>
          <input
            id="license-code"
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="MK-XXXX-XXXX"
            className="w-full rounded-2xl border bg-background px-4 py-4 text-center text-lg font-bold tracking-widest text-foreground outline-none focus:ring-2 focus:ring-primary"
            maxLength={32}
          />
        </div>

        {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-destructive">{error}</p>}

        <button disabled={busy || code.trim().length < 8} className="w-full rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Validando…" : "Ativar aplicativo"}
        </button>

        <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">
          <Smartphone className="mt-0.5 size-4 shrink-0" />
          <span>1 código = 1 cliente = 1 celular. Depois da ativação, o PDV continua funcionando offline.</span>
        </div>
      </form>
    </div>
  );
}
