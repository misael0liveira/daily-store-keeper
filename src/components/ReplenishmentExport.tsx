import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { downloadReplenishmentPdf, replenishmentText } from "@/lib/replenishmentDocuments";
import type { Replenishment } from "@/lib/stockReplenishment";
import { useStore } from "@/store/useStore";

export function ReplenishmentExport({
  rows,
  onClose,
}: {
  rows: Replenishment[];
  onClose: () => void;
}) {
  const [settings] = useState(() => useStore.getState().settings);
  const [text] = useState(() => replenishmentText(rows, settings));
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const perform = async (action: "copy" | "pdf") => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      if (action === "copy") {
        await navigator.clipboard.writeText(text);
        toast.success("Lista copiada", { description: "Cole no WhatsApp para enviar." });
      } else {
        await downloadReplenishmentPdf(rows, settings);
        toast.success("PDF gerado", {
          description: "Abra o arquivo para compartilhar ou imprimir.",
        });
      }
    } catch {
      if (action === "copy") {
        field.current?.focus();
        field.current?.select();
      }
      toast.error(
        action === "copy"
          ? "Selecione o texto e copie pelo menu do aparelho."
          : "Não foi possível gerar o PDF. Você pode copiar a lista ou tentar novamente.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !locked.current) onClose();
      }}
    >
      <SheetContent side="bottom" className="customer-sheet">
        <SheetTitle>Exportar lista de compras</SheetTitle>
        <SheetDescription>
          Apenas os produtos visíveis ao exportar. Copie para o WhatsApp ou baixe o PDF para
          imprimir.
        </SheetDescription>
        <div className="space-y-3 mt-4">
          <Label htmlFor="replenishment-text">Texto da lista de compras</Label>
          <Textarea
            ref={field}
            id="replenishment-text"
            readOnly
            value={text}
            className="h-56 resize-none"
          />
          <Button
            className="w-full h-12"
            disabled={busy}
            aria-busy={busy}
            onClick={() => void perform("copy")}
          >
            Copiar lista
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            disabled={busy}
            onClick={() => void perform("pdf")}
          >
            Baixar PDF
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
