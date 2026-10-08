import { decimal } from "@/lib/managementNumbers";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Choice, Field, LocalForm } from "@/components/ManagementUI";
import { generateReceiptPdf } from "@/lib/receipts";
import {
  PAYMENT_LABELS,
  formatBRL,
  useStore,
  type PaymentMethod,
  type Sale,
} from "@/store/useStore";
import { toast } from "sonner";
export function SaleReturnAction({ sale }: { sale: Sale }) {
  const state = useStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [kind, setKind] = useState("return");
  const [restock, setRestock] = useState("yes");
  const [method, setMethod] = useState<PaymentMethod>(sale.method);
  const [confirmed, setConfirmed] = useState(false);
  const [qty, setQty] = useState<Record<string, string>>({});
  const request = useRef(crypto.randomUUID());
  return (
    <div className="management-actions">
      <Button
        variant="outline"
        onClick={() =>
          void generateReceiptPdf(sale, state.settings.storeName).catch(() =>
            toast.error("Não foi possível gerar o comprovante."),
          )
        }
      >
        Comprovante PDF
      </Button>
      {sale.status !== "cancelled" && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setOpen(true)}>
              Devolver ou cancelar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85dvh] overflow-y-auto">
            <DialogTitle>Devolução da venda</DialogTitle>
            <DialogDescription>
              Venda de {formatBRL(sale.total)}. Preserve o histórico e confira o reembolso antes de
              registrar.
            </DialogDescription>
            <LocalForm
              label="Registrar devolução"
              success="Devolução registrada"
              onSave={() => {
                if (!confirmed)
                  throw new Error(
                    "Confirme que o reembolso foi conferido ou que não há valor a devolver.",
                  );
                const items = sale.items
                  .map((i) => ({
                    barcode: i.barcode,
                    qty:
                      kind === "cancel"
                        ? i.qty - (i.returnedQty ?? 0)
                        : decimal(qty[i.barcode] ?? "0"),
                  }))
                  .filter((i) => i.qty > 0);
                state.returnSale({
                  id: request.current,
                  saleId: sale.id,
                  items,
                  reason,
                  restock: restock === "yes",
                  refundMethod: method,
                  cancel: kind === "cancel",
                });
                request.current = crypto.randomUUID();
                setOpen(false);
                setReason("");
                setQty({});
                setConfirmed(false);
              }}
            >
              <Choice
                label="Operação sobre a venda"
                value={kind}
                onChange={setKind}
                options={[
                  { value: "return", label: "Devolução parcial ou total" },
                  { value: "cancel", label: "Cancelar todos os itens restantes" },
                ]}
              />
              {sale.items.map((i) => (
                <div key={i.barcode}>
                  <p className="text-sm">
                    {i.name}: {i.qty - (i.returnedQty ?? 0)} disponíveis para devolver
                  </p>
                  {kind === "return" && (
                    <Field
                      label={`Devolver ${i.name}`}
                      value={qty[i.barcode] ?? ""}
                      onChange={(value) => setQty((old) => ({ ...old, [i.barcode]: value }))}
                      inputMode="decimal"
                      placeholder="0"
                    />
                  )}
                </div>
              ))}
              <Field label="Motivo da devolução" value={reason} onChange={setReason} required />
              <Choice
                label="Destino da mercadoria"
                value={restock}
                onChange={setRestock}
                options={[
                  { value: "yes", label: "Recolocar no estoque disponível" },
                  { value: "no", label: "Não recolocar (avaria ou perda)" },
                ]}
              />
              <Choice
                label="Meio do reembolso conferido"
                value={method}
                onChange={(v) => setMethod(v as PaymentMethod)}
                options={Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 size-5 shrink-0"
                />
                Conferi o reembolso ao cliente, ou o valor será abatido da dívida. Este registro não
                executa estorno bancário.
              </label>
            </LocalForm>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
