import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, HardDrive, Settings, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { SYNC_ENABLED, pendingSales, syncPendingSales } from "@/lib/sync";
import { useStore } from "@/store/useStore";

export const Route = createFileRoute("/mais")({
  head: () => ({
    meta: [
      { title: "Ajustes — Mini Market POS" },
      { name: "description", content: "Relatórios de vendas e configurações do Mini Market POS." },
      { property: "og:title", content: "Ajustes — Mini Market POS" },
      { property: "og:description", content: "Acesse relatórios e configurações do mini mercado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MorePage,
});

function MorePage() {
  const online = useOnlineStatus();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const sales = useStore((s) => s.sales);
  const products = useStore((s) => s.products);
  const pending = pendingSales(sales).length;

  const check = async () => {
    const result = await syncPendingSales(sales);
    if (result.status === "no-backend") {
      toast.info("Ainda não existe servidor configurado", {
        description: `${result.pending} ${result.pending === 1 ? "venda" : "vendas"} guardadas somente neste aparelho.`,
      });
    } else if (result.status === "offline") {
      toast.warning("Sem internet agora", {
        description: "Tente novamente quando a conexão voltar.",
      });
    } else {
      toast.success("Sincronização concluída", {
        description: `${result.synced.length} enviadas · ${result.failed.length} pendentes`,
      });
    }
  };

  return (
    <div className="pos-page space-y-5">
      <header className="pos-header">
        <h1>Ajustes</h1>
      </header>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <Button asChild variant="ghost" className="h-18 w-full justify-start rounded-none px-4">
          <Link to="/vendas/configuracoes">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary">
              <Settings className="size-5 text-primary" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <strong className="block">Configurações</strong>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                Mercado, Pix e recebedor
              </span>
            </span>
            <ArrowRight className="size-5 text-muted-foreground" />
          </Link>
        </Button>
      </div>

      <section
        className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4"
        aria-labelledby="appearance-title"
      >
        <div>
          <h2 id="appearance-title" className="font-bold">
            Aparência
          </h2>
          <Label htmlFor="dark-theme" className="text-sm text-muted-foreground">
            Tema escuro
          </Label>
        </div>
        <Switch
          id="dark-theme"
          checked={theme === "dark"}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        />
      </section>

      <section aria-labelledby="local-data-title">
        <h2 id="local-data-title" className="mb-3 text-base font-bold">
          Dados neste aparelho
        </h2>
        <div className="rounded-2xl border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary">
              <HardDrive className="size-5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {Object.keys(products).length} produtos · {sales.length} vendas
              </p>
              <p className="text-xs text-muted-foreground">
                Tudo salvo no próprio celular, sem depender de internet.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t pt-4 text-xs font-semibold">
            {online ? (
              <>
                <Wifi className="size-4 text-success" />
                <span className="text-success">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="size-4 text-warning-foreground" />
                <span className="text-warning-foreground">
                  Offline — o caixa continua funcionando
                </span>
              </>
            )}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {SYNC_ENABLED
              ? `${pending} ${pending === 1 ? "venda" : "vendas"} aguardando envio ao servidor.`
              : `Nenhum servidor está conectado, então ${pending === 1 ? "1 venda ainda não foi enviada" : `${pending} vendas ainda não foram enviadas`} para fora do aparelho. Faça cópias pelo relatório em PDF.`}
          </p>

          <Button variant="outline" className="mt-3 h-12 w-full rounded-xl bg-card" onClick={check}>
            Verificar envio dos dados
          </Button>
        </div>
      </section>
    </div>
  );
}
