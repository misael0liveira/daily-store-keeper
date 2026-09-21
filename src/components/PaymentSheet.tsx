import { Link } from "@tanstack/react-router";
import { Banknote, Check, Copy, CreditCard, QrCode } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PixQr } from "@/components/PixQr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { buildPixPayload } from "@/lib/pix";
import { PixNotification } from "@/lib/pix-notification";
import { PAYMENT_LABELS, formatBRL, useStore, type PaymentMethod } from "@/store/useStore";

const methods: { key: PaymentMethod; icon: typeof Banknote }[] = [
  { key: "dinheiro", icon: Banknote },
  { key: "pix", icon: QrCode },
  { key: "debito", icon: CreditCard },
  { key: "credito", icon: CreditCard },
];


function PixPaymentSuccess({
  amount,
  bank,
  onDone,
}: {
  amount: number;
  bank?: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onDone, 2800);
    return () => window.clearTimeout(timeout);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[200] flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#087B3E] px-6 text-white" role="status" aria-live="assertive" aria-label="Pagamento recebido">
      <style>{\`
        @keyframes pixRingIn { 0% { transform: scale(.72); opacity: 0; } 35% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.08); opacity: 0; } }
        @keyframes pixRingPulse { 0%, 100% { transform: scale(.96); opacity: .2; } 50% { transform: scale(1.04); opacity: .55; } }
        @keyframes pixCircle { 0% { stroke-dashoffset: 330; } 58% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; } }
        @keyframes pixCheck { 0% { stroke-dashoffset: 80; opacity: 0; } 55% { stroke-dashoffset: 80; opacity: 0; } 78% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes pixDot { 0% { transform: translateY(12px) scale(.4); opacity: 0; } 35% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-26px) scale(.8); opacity: 0; } }
        @keyframes pixText { 0%, 45% { opacity: 0; transform: translateY(8px); } 72%, 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pixGlow { 0%, 35% { opacity: 0; transform: scale(.7); } 70%, 100% { opacity: 1; transform: scale(1); } }
        .pix-success-ring { animation: pixRingIn 1.15s cubic-bezier(.2,.8,.2,1) both; }
        .pix-success-pulse { animation: pixRingPulse 1.35s ease-in-out .1s infinite; }
        .pix-success-circle { stroke-dasharray: 330; stroke-dashoffset: 330; animation: pixCircle 1.25s cubic-bezier(.65,0,.35,1) .05s both; }
        .pix-success-check { stroke-dasharray: 80; stroke-dashoffset: 80; animation: pixCheck 1.25s cubic-bezier(.65,0,.35,1) .05s both; }
        .pix-success-dot { animation: pixDot 1.25s ease-out .15s both; }
        .pix-success-text { animation: pixText 1.35s ease-out .1s both; }
        .pix-success-glow { animation: pixGlow 1.2s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .pix-success-ring, .pix-success-pulse, .pix-success-circle, .pix-success-check, .pix-success-dot, .pix-success-text, .pix-success-glow {
            animation: none !important; opacity: 1 !important; transform: none !important; stroke-dashoffset: 0 !important;
          }
        }
      \`}</style>
      <div className="relative flex size-[260px] items-center justify-center sm:size-[300px]">
        <div className="pix-success-glow absolute size-[230px] rounded-full bg-emerald-300/20 blur-3xl sm:size-[270px]" />
        <div className="pix-success-pulse absolute size-[205px] rounded-full border border-emerald-200/30 sm:size-[245px]" />
        <div className="pix-success-ring absolute size-[190px] rounded-full border border-emerald-200/20 sm:size-[220px]" />
        <svg viewBox="0 0 140 140" className="relative size-[190px] drop-shadow-[0_0_28px_rgba(134,239,172,.35)] sm:size-[220px]" aria-hidden="true">
          <circle cx="70" cy="70" r="52" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.24)" strokeWidth="2" />
          <circle cx="70" cy="70" r="52" fill="none" stroke="#86EFAC" strokeWidth="8" strokeLinecap="round" className="pix-success-circle" transform="rotate(-90 70 70)" />
          <path d="M43 71.5 61 89 99 51" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" className="pix-success-check" />
        </svg>
        <span className="pix-success-dot absolute left-1/2 top-1/2 size-3 -translate-x-1/2 rounded-full bg-emerald-200 shadow-[0_0_18px_rgba(167,243,208,.9)]" />
      </div>
      <div className="pix-success-text -mt-3 text-center">
        <p className="text-[30px] font-semibold tracking-tight sm:text-[34px]">Pagamento recebido!</p>
        <p className="mt-3 text-[28px] font-medium tracking-tight text-emerald-100">{formatBRL(amount)}</p>
        {bank && <p className="mt-2 text-sm font-medium text-emerald-100/80">{bank}</p>}
        <div className="mt-7 flex items-center justify-center gap-2 text-sm text-emerald-100/80"><Check className="size-4" />Venda confirmada</div>
      </div>
    </div>
  );
}

export function PaymentSheet({
  open,
  onOpenChange,
  total,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (payload: { method: PaymentMethod; paidAmount?: number; change?: number }) => void;
}) {
  const settings = useStore((s) => s.settings);
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [paidRaw, setPaidRaw] = useState("");
  const [pixSuccess, setPixSuccess] = useState<{ amount: number; bank?: string } | null>(null);
  const onConfirmRef = useRef(onConfirm);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  const paidValue = Number(paidRaw.replace(",", "."));
  const paid = paidRaw.trim() === "" || Number.isNaN(paidValue) ? null : paidValue;
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

  useEffect(() => {
    if (!open || method !== "pix" || total <= 0 || pixSuccess) {
      void PixNotification.clearExpectedAmount().catch(() => undefined);
      return;
    }

    let timer: number | undefined;
    let active = true;

    const startMonitor = async () => {
      try {
        await PixNotification.setExpectedAmount({ amount: total });
        const status = await PixNotification.isNotificationAccessGranted();
        if (!status.granted || !active) return;

        timer = window.setInterval(async () => {
          if (!active) return;
          try {
            const payment = await PixNotification.getLastPayment();
            if (!payment.found || payment.amount == null) return;

            if (Math.abs(payment.amount - total) <= 0.009) {
              active = false;
              if (timer !== undefined) window.clearInterval(timer);
              await PixNotification.clearExpectedAmount().catch(() => undefined);
              setPixSuccess({
                amount: payment.amount,
                bank: payment.bank ?? undefined,
              });
            }
          } catch {
            // Native bridge is unavailable in the browser preview.
          }
        }, 900);
      } catch {
        // Native bridge is unavailable in the browser preview.
      }
    };

    void startMonitor();

    return () => {
      active = false;
      if (timer !== undefined) window.clearInterval(timer);
      void PixNotification.clearExpectedAmount().catch(() => undefined);
    };
  }, [open, method, total]);

  const finishPix = () => {
    const success = pixSuccess;
    setPixSuccess(null);
    onConfirmRef.current({ method: "pix" });
    if (success) {
      toast.success("Venda concluída", {
        description: "${formatBRL(success.amount)} · Pix recebido",
      });
    }
  };
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
    <Sheet open={open && !pixSuccess} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-3xl tracking-wide">Pagamento</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <div className="flex items-baseline justify-between rounded-2xl border bg-card p-4">
            <span className="text-sm font-medium text-muted-foreground">Total a pagar</span>
            <span className="font-display text-3xl tracking-wide text-primary">{formatBRL(total)}</span>
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
                  onChange={(e) => setPaidRaw(e.target.value.replace(/[^\d.,]/g, ""))}
                  className="h-12 text-right text-lg font-semibold"
                />
              </div>
              {paid !== null && (
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Troco</span>
                  <span className={`font-display text-2xl tracking-wide ${
                    insufficient ? "text-destructive" : "text-primary"
                  }`}>
                    {insufficient ? `Faltam ${formatBRL(-(change ?? 0))}` : formatBRL(change ?? 0)}
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
                  <p className="rounded-xl bg-secondary p-3 text-center text-sm font-medium text-secondary-foreground">
                    Aguardando Pix recebido...
                  </p>
                  <Button variant="outline" className="h-12 w-full gap-2" onClick={copyPix}>
                    <Copy className="size-5" />
                    Copiar código Pix
                  </Button>
                </>
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma chave Pix cadastrada ainda.</p>
                  <Button asChild variant="outline" className="h-12 w-full">
                    <Link to="/vendas/configuracoes" onClick={() => onOpenChange(false)}>
                      Cadastrar chave Pix
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {(method === "debito" || method === "credito") && (
            <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
              Passe o cartão na maquininha e confirme abaixo para registrar a venda.
            </p>
          )}

          <Button className="h-14 w-full text-lg" onClick={confirm} disabled={insufficient || (method === "pix" && !pixReady)}>
            Confirmar pagamento
          </Button>
        </div>
      </SheetContent>
    </Sheet>

      {pixSuccess && (
        <PixPaymentSuccess
          amount={pixSuccess.amount}
          bank={pixSuccess.bank}
          onDone={finishPix}
        />
      )}
  );
}
