import { Link } from "@tanstack/react-router";
import { Banknote, Copy, CreditCard, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PixQr } from "@/components/PixQr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildPixPayload } from "@/lib/pix";
import {
  PAYMENT_LABELS,
  formatBRL,
  useStore,
  type PaymentMethod,
} from "@/store/useStore";

const methods: { key: PaymentMethod; icon: typeof Banknote }[] = [
  { key: "dinheiro", icon: Banknote },
  { key: "pix", icon: QrCode },
  { key: "debito", icon: CreditCard },
  { key: "credito", icon: CreditCard },
];

export function PaymentSheet({
  open,
  onOpenChange,
  total,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (payload: {
    method: PaymentMethod;
    paidAmount?: number;
    change?: number;
  }) => void;
}) {
  const settings = useStore((s) => s.settings);
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [paidRaw, setPaidRaw] = useState("");

  const paidValue = Number(paidRaw.replace(",", "."));
  const paid =
    paidRaw.trim() === "" || Number.isNaN(paidValue) ? null : paidValue;
  const change = paid !== null ? paid - total : null;
  const insufficient = method === "dinheiro" && change !== null && change < 0;

  const pixReady = settings.pixKey.trim().length > 0;
  const pixPayload = pixReady
    ? buildPixPayload({
        key: settings.pixKey,
        merchantName: settings.merchantName || settings.storeName,
        city: settings.city,
        amount: total,
      })
    : "";

  const confirm = () => {
    if (insufficient) {
      toast.error("Valor pago insuficiente", {
        description: `Faltam ${formatBRL(-(change ?? 0))}`,
      });
      return;
    }
    if (method === "pix" && !pixReady) {
      toast.error("Cadastre a chave Pix nas configurações de vendas");
      return;
    }
    onConfirm({
      method,
      ...(method === "dinheiro" && paid !== null
        ? { paidAmount: paid, change: change ?? 0 }
        : {}),
    });
    setPaidRaw("");
    setMethod("dinheiro");
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      toast.success("Código Pix copiado");
    } catch {
      toast.error("Não foi possível copiar o código");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-3xl tracking-wide">
            Pagamento
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <div className="flex items-baseline justify-between rounded-2xl border bg-card p-4">
            <span className="text-sm font-medium text-muted-foreground">
              Total a pagar
            </span>
            <span className="font-display text-3xl tracking-wide text-primary">
              {formatBRL(total)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {methods.map(({ key, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMethod(key)}
                className={`flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border text-sm font-medium transition-colors ${
                  method === key
                    ? "border-primary bg-primary/10 text-primary"
                    : "bg-card text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="size-6" />
                {PAYMENT_LABELS[key]}
              </button>
            ))}
          </div>

          {method === "dinheiro" && (
            <div className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="space-y-2">
                <Label htmlFor="paid">Valor pago pelo cliente</Label>
                <Input
                  id="paid"
                  inputMode="decimal"
                  placeholder="R$ 0,00"
                  value={paidRaw}
                  onChange={(e) =>
                    setPaidRaw(e.target.value.replace(/[^\d.,]/g, ""))
                  }
                  className="h-12 text-right text-lg font-semibold"
                />
              </div>
              {paid !== null && (
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Troco
                  </span>
                  <span
                    className={`font-display text-2xl tracking-wide ${
                      insufficient ? "text-destructive" : "text-primary"
                    }`}
                  >
                    {insufficient
                      ? `Faltam ${formatBRL(-(change ?? 0))}`
                      : formatBRL(change ?? 0)}
                  </span>
                </div>
              )}
            </div>
          )}

          {method === "pix" && (
            <div className="space-y-3 rounded-2xl border bg-card p-4">
              {pixReady ? (
                <>
                  <PixQr payload={pixPayload} />
                  <p className="text-center text-sm text-muted-foreground">
                    O cliente escaneia o código para pagar {formatBRL(total)}.
                  </p>
                  <Button
                    variant="outline"
                    className="h-12 w-full gap-2"
                    onClick={copyPix}
                  >
                    <Copy className="size-5" />
                    Copiar código Pix
                  </Button>
                </>
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma chave Pix cadastrada ainda.
                  </p>
                  <Button asChild variant="outline" className="h-12 w-full">
                    <Link
                      to="/vendas/configuracoes"
                      onClick={() => onOpenChange(false)}
                    >
                      Cadastrar chave Pix
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {(method === "debito" || method === "credito") && (
            <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
              Passe o cartão na maquininha e confirme abaixo para registrar a
              venda.
            </p>
          )}

          <Button
            className="h-14 w-full text-lg"
            onClick={confirm}
            disabled={insufficient || (method === "pix" && !pixReady)}
          >
            Confirmar pagamento
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
