import { CloudOff, WifiOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { pendingSales } from "@/lib/sync";
import { useStore } from "@/store/useStore";

/**
 * Discrete connectivity indicator.
 *
 * Offline: shows a thin bar making clear the register keeps working and sales
 * are stored on the device. Back online: a single toast, no data movement
 * (there is no server yet).
 */
export function ConnectionStatus() {
  const online = useOnlineStatus();
  const sales = useStore((s) => s.sales);
  const pending = pendingSales(sales).length;
  const previous = useRef<boolean | null>(null);

  useEffect(() => {
    if (previous.current === null) {
      previous.current = online;
      return;
    }
    if (previous.current === online) return;
    previous.current = online;

    if (online) {
      toast.success("Conexão restaurada", {
        description:
          pending > 0
            ? `${pending} ${pending === 1 ? "venda" : "vendas"} continuam salvas neste aparelho.`
            : "Nada foi perdido: seus dados ficam neste aparelho.",
      });
    } else {
      toast.warning("Sem internet — o caixa continua funcionando", {
        description: "As vendas são salvas neste aparelho.",
      });
    }
  }, [online, pending]);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-16 z-20 mx-auto flex max-w-lg items-center gap-2 border-b border-warning/40 bg-warning/20 px-4 py-2 text-xs font-semibold text-warning-foreground"
    >
      <WifiOff className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">
        Offline — vendas salvas neste aparelho
      </span>
      {pending > 0 && (
        <span className="flex shrink-0 items-center gap-1">
          <CloudOff className="size-3.5" />
          {pending}
        </span>
      )}
    </div>
  );
}
