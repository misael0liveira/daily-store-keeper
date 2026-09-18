import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FileText, HardDrive, Settings, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { SYNC_ENABLED, pendingSales, syncPendingSales } from "@/lib/sync";
import { useStore } from "@/store/useStore";

export const Route = createFileRoute("/mais")({
  head: () => ({
    meta: [
      { title: "Mais — Mini Market POS" },
      { name: "description", content: "Relatórios de vendas e configurações do Mini Market POS." },
      { property: "og:title", content: "Mais — Mini Market POS" },
      { property: "og:description", content: "Acesse relatórios e configurações do mini mercado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MorePage,
});

function MorePage() {
  const online = useOnlineStatus();
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
    <div className="space-y-5 px-4 pb-28 pt-5">
      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground">Operação</p>
        <h1 className="mt-1 text-2xl font-extrabold">Mais</h1>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <Button asChild variant="ghost" className="h-18 w-full justify-start rounded-none px-4">
          <Link to="/vendas">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary"><FileText className="size-5 text-primary" /></span>
            <span className="min-w-0 flex-1 text-left"><strong className="block">Vendas e relatórios</strong><span className="block truncate text-xs font-normal text-muted-foreground">Histórico, períodos e PDF</span></span>
            <ArrowRight className="size-5 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-18 w-full justify-start rounded-none border-t px-4">
          <Link to="/vendas/configuracoes">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary"><Settings className="size-5 text-primary" /></span>
            <span className="min-w-0 flex-1 text-left"><strong className="block">Configurações</strong><span className="block truncate text-xs font-normal text-muted-foreground">Mercado, Pix e recebedor</span></span>
            <ArrowRight className="size-5 text-muted-foreground" />
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-18 w-full justify-start rounded-none border-t px-4">
          <Link to="/codigos">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary"><KeyRound className="size-5 text-primary" /></span>
            <span className="min-w-0 flex-1 text-left"><strong className="block">Códigos de ativação</strong><span className="block truncate text-xs font-normal text-muted-foreground">Gerar códigos para outros celulares</span></span>
            <ArrowRight className="size-5 text-muted-foreground" />
          </Link>
        </Button>
      </div>

      <section aria-labelledby="local-data-title">
        <h2 id="local-data-title" className="mb-3 text-base font-bold">Dados neste aparelho</h2>
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
                <span className="text-warning-foreground">Offline — o caixa continua funcionando</span>
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
