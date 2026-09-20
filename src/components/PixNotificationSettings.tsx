import { BellRing, CheckCircle2, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PixNotification } from "@/lib/pix-notification";

export function PixNotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await PixNotification.isNotificationAccessGranted();
      setEnabled(result.granted);
    } catch {
      setEnabled(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handleFocus = () => void refresh();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  const openSettings = async () => {
    try {
      await PixNotification.openNotificationSettings();
      toast.info("Ative o acesso às notificações do Mini Market", {
        description: "Depois volte para o app. O status será atualizado automaticamente.",
      });
    } catch {
      toast.error("Não foi possível abrir as configurações do Android");
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary">
          <BellRing className="size-5 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">Pix por notificação</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Detecta automaticamente notificações de Pix recebido de qualquer banco
            que mostre o valor na notificação.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/40 p-3">
        {enabled ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 className="size-5" />
            Monitoramento de notificações ativo
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {checking
              ? "Verificando permissão..."
              : "Permissão de acesso às notificações ainda não foi ativada."}
          </p>
        )}
      </div>

      <Button
        variant={enabled ? "outline" : "default"}
        className="h-12 w-full gap-2"
        onClick={openSettings}
      >
        <ExternalLink className="size-5" />
        {enabled ? "Revisar permissão no Android" : "Ativar leitura de notificações"}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        O PDV só considera uma notificação quando ela contém indicação de Pix
        recebido e o valor é igual ao valor esperado da venda. O Android pode
        ocultar conteúdos considerados sensíveis em algumas notificações, então
        esta é uma confirmação por notificação, não uma confirmação bancária via API.
      </p>
    </section>
  );
}
