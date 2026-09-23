import { WifiOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Discrete connectivity indicator.
 *
 * Offline: shows a thin bar making clear the register keeps working and sales
 * are stored on the device. Back online: a single toast, no data movement
 * (there is no server yet).
 */
export function ConnectionStatus() {
  const online = useOnlineStatus();
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
        description: "O caixa continua usando somente os dados salvos neste aparelho.",
      });
    } else {
      toast.warning("Sem internet — o caixa continua funcionando", {
        description: "As vendas são salvas neste aparelho.",
      });
    }
  }, [online]);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-16 z-20 mx-auto flex max-w-lg items-center gap-2 border-b border-warning/40 bg-warning/20 px-4 py-2 text-xs font-semibold text-warning-foreground"
    >
      <WifiOff className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">Offline — o aplicativo continua funcionando</span>
    </div>
  );
}
