import { FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, KeyRound, Loader2, Plus, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLicenseCode, listLicenseCodes, updateLicenseCode } from "@/lib/licenses.functions";

type LicenseRow = {
  id: string;
  code: string;
  active: boolean;
  device_id: string | null;
  activated_at: string | null;
  created_at: string;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export const Route = createFileRoute("/codigos")({
  head: () => ({
    meta: [
      { title: "Códigos de ativação — Mini Market POS" },
      { name: "description", content: "Gere e gerencie códigos de ativação do Mini Market POS." },
      { property: "og:title", content: "Códigos de ativação — Mini Market POS" },
      {
        property: "og:description",
        content: "Crie códigos para liberar o app em novos celulares.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CodesPage,
});

function CodesPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<LicenseRow[]>([]);

  const list = useServerFn(listLicenseCodes);
  const create = useServerFn(createLicenseCode);
  const update = useServerFn(updateLicenseCode);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) return;
    setBusy(true);
    try {
      const data = await list({ data: { password } });
      setRows(data);
      setUnlocked(true);
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Não foi possível abrir a lista de códigos."));
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    try {
      const row = await create({ data: { password } });
      setRows((prev) => [row, ...prev]);
      await copy(row.code);
      toast.success(`Código criado: ${row.code}`, { description: "Já copiado para você enviar." });
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Não foi possível criar o código."));
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, payload: { active?: boolean; unbind?: boolean }) {
    setBusy(true);
    try {
      const row = await update({ data: { password, id, ...payload } });
      setRows((prev) => prev.map((item) => (item.id === row.id ? row : item)));
      toast.success("Código atualizado.");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Não foi possível atualizar o código."));
    } finally {
      setBusy(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado.");
    } catch {
      toast.info(`Código: ${code}`);
    }
  }

  if (!unlocked) {
    return (
      <div className="px-4 pb-28 pt-8">
        <form
          noValidate
          onSubmit={unlock}
          className="mx-auto w-full max-w-sm space-y-4 rounded-2xl border bg-card p-5 shadow-soft"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-secondary">
            <KeyRound className="size-5 text-primary" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold">Códigos de ativação</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Digite a senha de administrador para gerar códigos.
            </p>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de administrador"
            autoComplete="current-password"
            className="h-12 rounded-xl"
            required
          />
          <Button disabled={busy} className="h-12 w-full rounded-xl">
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground">Administração</p>
        <h1 className="mt-1 text-2xl font-extrabold">Códigos de ativação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada código libera o app em um celular. Depois de usado, fica vinculado àquele aparelho.
        </p>
      </div>

      <Button onClick={generate} disabled={busy} className="h-14 w-full rounded-xl text-base">
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
        Gerar novo código
      </Button>

      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground shadow-soft">
            Nenhum código criado ainda.
          </p>
        )}
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 truncate text-lg font-extrabold tracking-wider">
                {row.code}
              </p>
              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-xl bg-card"
                onClick={() => copy(row.code)}
                aria-label="Copiar código"
              >
                <Copy className="size-4" />
              </Button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className={row.active ? "text-success" : "text-destructive"}>
                {row.active ? "Ativo" : "Desativado"}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Smartphone className="size-3.5" />
                {row.device_id ? "Em uso em um celular" : "Livre para usar"}
              </span>
            </div>

            <div className="mt-3 flex gap-2 border-t pt-3">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-xl bg-card"
                disabled={busy}
                onClick={() => patch(row.id, { active: !row.active })}
              >
                {row.active ? <X className="size-4" /> : <Check className="size-4" />}
                {row.active ? "Desativar" : "Reativar"}
              </Button>
              {row.device_id && (
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-xl bg-card"
                  disabled={busy}
                  onClick={() => patch(row.id, { unbind: true })}
                >
                  Desvincular
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
