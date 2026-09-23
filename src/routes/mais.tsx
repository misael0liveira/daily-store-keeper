import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Download, RefreshCw, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { checkForAppUpdate, installAppUpdate, type UpdateInfo } from "@/lib/app-update";
import { useStore } from "@/store/useStore";

export const Route = createFileRoute("/mais")({
  head: () => ({
    meta: [
      { title: "Ajustes — Mercadinho União" },
      { name: "description", content: "Relatórios e configurações do Mercadinho União." },
      { property: "og:title", content: "Ajustes — Mercadinho União" },
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
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<UpdateInfo | null>(null);

  const checkUpdate = async () => {
    if (!online) {
      toast.warning("Sem internet agora", {
        description: "Conecte-se somente para verificar se existe uma nova versão.",
      });
      return;
    }

    setCheckingUpdate(true);
    try {
      const update = await checkForAppUpdate();
      setAvailableUpdate(update);
      if (update) {
        toast.info(`Versão ${update.version} disponível`, {
          description: "Toque em Atualizar agora para baixar e instalar.",
        });
      } else {
        toast.success("Aplicativo atualizado", {
          description: "Você já está usando a versão mais recente.",
        });
      }
    } catch {
      toast.error("Não foi possível verificar a atualização", {
        description: "Confira a conexão e tente novamente.",
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const installUpdate = async () => {
    if (!availableUpdate || installingUpdate) return;
    setInstallingUpdate(true);
    try {
      const result = await installAppUpdate(availableUpdate.downloadUrl);
      if (result.needsPermission) {
        toast.info("Permita instalações deste aplicativo e toque em Atualizar agora novamente.");
      }
    } catch {
      toast.error("Não foi possível iniciar a atualização", {
        description: "Confira a conexão e a permissão para instalar aplicativos.",
      });
    } finally {
      setInstallingUpdate(false);
    }
  };

  return (
    <div className="pos-page pos-settings">
      <header className="pos-header">
        <h1>Ajustes</h1>
      </header>
      <div className="pos-card pos-settings-link">
        <Link className="pos-settings-action" to="/vendas/configuracoes">
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
      </div>

      <section
        className="pos-card flex items-center justify-between gap-4"
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

      <section className="pos-settings-data" aria-labelledby="update-title">
        <h2 id="update-title" className="mb-2 text-base font-semibold">
          Atualizações
        </h2>
        <div className="pos-card">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary">
              <RefreshCw className="size-5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Verificar nova versão</p>
              <p className="text-xs text-muted-foreground">
                Apenas a atualização usa internet. Caixa, estoque e histórico funcionam offline.
              </p>
            </div>
          </div>

          {availableUpdate ? (
            <Button
              className="mt-4 h-12 w-full gap-2 rounded-xl"
              disabled={installingUpdate}
              onClick={() => void installUpdate()}
            >
              <Download className="size-4" />
              {installingUpdate
                ? "Baixando atualização…"
                : `Atualizar para ${availableUpdate.version}`}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="mt-4 h-12 w-full gap-2 rounded-xl bg-card"
              disabled={checkingUpdate}
              onClick={() => void checkUpdate()}
            >
              <RefreshCw className={`size-4 ${checkingUpdate ? "animate-spin" : ""}`} />
              {checkingUpdate ? "Verificando…" : "Verificar atualização"}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
