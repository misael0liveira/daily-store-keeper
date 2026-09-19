import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Download, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { checkForAppUpdate, installAppUpdate, type UpdateInfo } from "@/lib/app-update";

export function AppUpdatePrompt() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const info = await checkForAppUpdate();
        if (active && info) {
          setDismissed(false);
          setUpdate(info);
        }
      } catch (error) {
        console.warn("Falha ao verificar atualização:", error);
      }
    };

    void run();

    let removeListener: (() => void) | undefined;

    if (window.location.protocol === "capacitor:") {
      CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          void run();
        }
      }).then((listener) => {
        removeListener = () => listener.remove();
      });
    }

    return () => {
      active = false;
      removeListener?.();
    };
  }, []);

  if (!update || dismissed) return null;

  const handleUpdate = async () => {
    try {
      setInstalling(true);
      const result = await installAppUpdate(update.downloadUrl);

      if (result.needsPermission) {
        toast.info("Permita instalações deste aplicativo e toque em atualizar novamente.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível iniciar a atualização.", {
        description: "Verifique a permissão de instalação de fontes desconhecidas e tente novamente.",
      });
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-lg rounded-2xl border border-primary/20 bg-card p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RefreshCw className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-black">Nova versão disponível</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Mini Market PDV · versão {update.version}
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar aviso"
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setDismissed(true)}
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Uma atualização do aplicativo está pronta. Seus dados locais permanecem no aparelho.
          </p>

          <button
            type="button"
            disabled={installing}
            onClick={handleUpdate}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-extrabold text-primary-foreground disabled:opacity-60"
          >
            <Download className="size-4" />
            {installing ? "Baixando atualização..." : "Atualizar agora"}
          </button>
        </div>
      </div>
    </div>
  );
}
