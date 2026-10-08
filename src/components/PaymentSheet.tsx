import { Link } from "@tanstack/react-router";
import { Banknote, Copy, CreditCard, Delete, QrCode, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PaymentSuccess } from "@/components/PaymentSuccess";
import { PixQr } from "@/components/PixQr";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { buildPixPayload, createPixTxid } from "@/lib/pix";
import { PixNotification } from "@/lib/pix-notification";
import { editCashAmount, cashAmount } from "@/lib/cash-keypad";
import { PAYMENT_LABELS, formatBRL, useStore, type PaymentMethod } from "@/store/useStore";

const methods: { key: PaymentMethod; icon: typeof Banknote }[] = [
  { key: "dinheiro", icon: Banknote },
  { key: "pix", icon: QrCode },
  { key: "debito", icon: CreditCard },
  { key: "credito", icon: CreditCard },
];
const keys = ["1", "2", "3", "backspace", "4", "5", "6", "clear", "7", "8", "9", "0"];
export type Confirmation = {
  method: PaymentMethod;
  paidAmount?: number;
  change?: number;
  amount?: number;
  source?: "manual" | "notification";
  reference?: string;
  bank?: string | undefined;
};

export function PaymentSheet({
  open,
  onOpenChange,
  total,
  pixTxid,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  pixTxid: string;
  onConfirm: (payload: Confirmation) => boolean | "partial";
}) {
  const settings = useStore((s) => s.settings);
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [paidRaw, setPaidRaw] = useState("");
  const [success, setSuccess] = useState<{ amount: number; bank: string | undefined } | null>(null);
  const [notificationAccess, setNotificationAccess] = useState<boolean | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitRaw, setSplitRaw] = useState("");
  const splitValue = Number(splitRaw.replace(",", "."));
  const amount = splitRaw.trim() ? Math.round(splitValue * 100) / 100 : total;
  const invalidSplit =
    !Number.isFinite(amount) || amount < 0 || (amount === 0 && total > 0) || amount > total;
  const splitPayment = splitRaw.trim().length > 0;
  const effectiveTxid = useMemo(
    () => (splitPayment ? createPixTxid() : pixTxid),
    [splitPayment, pixTxid],
  );
  const locked = useRef(false);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const paid = cashAmount(paidRaw, amount);
  const change = Math.round((paid - amount) * 100) / 100;
  const insufficient = change < 0;
  const pixReady = settings.pixKey.trim().length > 0;
  const pixPayload =
    pixReady && pixTxid
      ? buildPixPayload({
          key: settings.pixKey,
          merchantName: settings.merchantName || settings.storeName,
          city: settings.city,
          amount,
          txid: effectiveTxid,
        })
      : "";

  // Save before displaying success; the receipt cannot disappear if Android interrupts the animation.
  const acceptRef = useRef<(payload: Confirmation, bank?: string) => void>(() => {});
  acceptRef.current = (payload, bank) => {
    if (locked.current || !open) return;
    locked.current = true;
    let result: boolean | "partial";
    try {
      result = onConfirmRef.current({
        ...payload,
        amount,
        source: payload.source ?? "manual",
        ...(payload.method === "pix" ? { reference: effectiveTxid } : {}),
        bank,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível registrar o pagamento.",
      );
      locked.current = false;
      return;
    }
    if (!result) {
      locked.current = false;
      return;
    }
    if (result === "partial") {
      locked.current = false;
      setPaidRaw("");
      setSplitRaw("");
      setSplitOpen(false);
      setManualOpen(false);
      toast.success("Parcela recebida. Escolha como pagar o restante.");
      return;
    }
    setSuccess({ amount: total, bank });
  };

  useEffect(() => {
    if (!open) {
      locked.current = false;
      setPaidRaw("");
      setMethod("dinheiro");
      setManualOpen(false);
      setSplitRaw("");
      setSplitOpen(false);
    }
  }, [open]);

  useEffect(() => {
    setManualOpen(false);
    setNotificationAccess(null);
    if (!open || method === "dinheiro" || invalidSplit || amount <= 0 || success) return;
    const monitorId = `${effectiveTxid}:${method}:${crypto.randomUUID()}`;
    let active = true;
    let polling = false;
    let timer: number | undefined;
    const startMonitor = async () => {
      try {
        const { startedAt } = await PixNotification.setExpectedAmount({
          amount,
          method,
          monitorId,
        });
        if (!active) {
          await PixNotification.clearExpectedAmount({ monitorId });
          return;
        }
        const status = await PixNotification.isNotificationAccessGranted();
        if (!active) return;
        setNotificationAccess(status.granted);
        timer = window.setInterval(async () => {
          if (!active || polling || locked.current) return;
          polling = true;
          try {
            const payment = await PixNotification.getLastPayment({ monitorId });
            if (
              !active ||
              !payment.found ||
              payment.amount == null ||
              payment.monitorId !== monitorId ||
              payment.method !== method ||
              !payment.timestamp ||
              payment.timestamp < startedAt ||
              Math.abs(payment.amount - amount) > 0.009
            )
              return;
            acceptRef.current({ method, source: "notification" }, payment.bank);
          } catch {
            /* The native service may temporarily be unavailable. */
          } finally {
            polling = false;
          }
        }, 400);
      } catch {
        if (active) setNotificationAccess(false);
      }
    };
    void startMonitor();
    return () => {
      active = false;
      if (timer !== undefined) window.clearInterval(timer);
      void PixNotification.clearExpectedAmount({ monitorId }).catch(() => undefined);
    };
  }, [open, method, amount, effectiveTxid, success, invalidSplit]);

  const confirm = () => {
    if (invalidSplit) return;
    if (method === "dinheiro" && insufficient) return;
    if (method === "pix" && !pixReady) return;
    acceptRef.current({ method, ...(method === "dinheiro" ? { paidAmount: paid, change } : {}) });
  };
  const edit = (key: string) => setPaidRaw((raw) => editCashAmount(raw, key));
  const close = () => {
    if (!locked.current) onOpenChange(false);
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
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!locked.current) onOpenChange(next);
      }}
    >
      <SheetContent
        side="bottom"
        className={`payment-sheet payment-${method}`}
        showCloseButton={false}
        onEscapeKeyDown={(e) => {
          if (locked.current) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (locked.current) e.preventDefault();
        }}
      >
        <SheetTitle className="sr-only">Pagamento</SheetTitle>
        <SheetDescription className="sr-only">
          Escolha a forma de pagamento e confirme a venda de {formatBRL(total)}.
        </SheetDescription>
        {success ? (
          <PaymentSuccess
            amount={success.amount}
            bank={success.bank}
            onDone={() => {
              setSuccess(null);
              locked.current = false;
              onOpenChange(false);
            }}
          />
        ) : (
          <>
            <div className="payment-brand">
              <img src="/brand/mercadinho-uniao-logo.png" alt="Mercadinho União" />
            </div>
            <div className="payment-methods" role="group" aria-label="Forma de pagamento">
              {methods.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={method === key}
                  onClick={() => setMethod(key)}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>
                    {key === "debito"
                      ? "Débito"
                      : key === "credito"
                        ? "Crédito"
                        : PAYMENT_LABELS[key]}
                  </span>
                </button>
              ))}
            </div>
            <section className="payment-panel">
              <button
                type="button"
                className="payment-split-toggle"
                aria-expanded={splitOpen}
                onClick={() => setSplitOpen((v) => !v)}
              >
                Dividir
              </button>
              {splitOpen && (
                <div className="payment-split-editor">
                  <Label htmlFor="payment-part">Valor desta parcela (R$)</Label>
                  <Input
                    id="payment-part"
                    value={splitRaw}
                    onChange={(e) => setSplitRaw(e.target.value)}
                    inputMode="decimal"
                    placeholder={String(total)}
                  />
                  <p>
                    Saldo: {formatBRL(total)}
                    {invalidSplit ? " · Confira o valor." : ""}
                  </p>
                  <Button variant="outline" onClick={() => setSplitOpen(false)}>
                    Usar valor da parcela
                  </Button>
                </div>
              )}
              <button
                type="button"
                className="payment-close"
                aria-label="Fechar pagamento"
                onClick={close}
              >
                <X aria-hidden="true" />
              </button>
              {method === "dinheiro" ? (
                <>
                  <div className="payment-cash-body">
                    <h2>Pagamento</h2>
                    <p className="payment-subtitle">Dinheiro</p>
                    <div className="payment-cash-row">
                      <span>Total a pagar</span>
                      <strong>{formatBRL(amount)}</strong>
                    </div>
                    <label className="payment-cash-row">
                      <span>Valor Recebido</span>
                      <input
                        aria-label="Valor pago pelo cliente"
                        readOnly
                        inputMode="none"
                        value={formatBRL(paid)}
                        onKeyDown={(e) => {
                          if (
                            /^\d$/.test(e.key) ||
                            [",", ".", "Backspace", "Delete"].includes(e.key)
                          ) {
                            e.preventDefault();
                            edit(
                              e.key === "Backspace"
                                ? "backspace"
                                : e.key === "Delete"
                                  ? "clear"
                                  : e.key,
                            );
                          }
                          if (e.key === "Enter") {
                            e.preventDefault();
                            confirm();
                          }
                        }}
                      />
                    </label>
                    <div
                      className={`payment-cash-row ${insufficient ? "payment-insufficient" : ""}`}
                      aria-live="polite"
                    >
                      <span>{insufficient ? "Faltam" : "Troco"}</span>
                      <strong>{formatBRL(Math.abs(change))}</strong>
                    </div>
                  </div>
                  <div className="payment-keypad" aria-label="Teclado numérico">
                    {keys.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => edit(key)}
                        aria-label={
                          key === "backspace"
                            ? "Apagar último dígito"
                            : key === "clear"
                              ? "Limpar valor"
                              : key
                        }
                      >
                        {key === "backspace" ? (
                          <Delete aria-hidden="true" />
                        ) : key === "clear" ? (
                          "C"
                        ) : (
                          key
                        )}
                      </button>
                    ))}
                    <button
                      className="payment-paid"
                      type="button"
                      onClick={confirm}
                      disabled={insufficient || invalidSplit}
                    >
                      PAGO
                    </button>
                    <button type="button" onClick={() => edit(",")} aria-label="Vírgula">
                      ,
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="payment-wait-body">
                    {method === "pix" ? (
                      pixReady ? (
                        <>
                          <div className="payment-qr">
                            <PixQr payload={pixPayload} size={280} />
                          </div>
                          <p className="payment-pix-instruction">
                            O cliente escaneia o código para pagar {formatBRL(amount)}.
                          </p>
                          <div className="payment-waiting" role="status">
                            AGUARDANDO PIX{" "}
                            <span className="payment-dots" aria-hidden="true">
                              <i />
                              <i />
                              <i />
                            </span>
                          </div>
                          <button className="payment-copy" type="button" onClick={copyPix}>
                            <Copy size={17} aria-hidden="true" />
                            Copiar código Pix
                          </button>
                        </>
                      ) : (
                        <div className="payment-missing-pix">
                          <p>Nenhuma chave Pix cadastrada ainda.</p>
                          <Link
                            to="/vendas/configuracoes"
                            className={buttonVariants({ variant: "outline" })}
                            onClick={close}
                          >
                            Cadastrar chave Pix
                          </Link>
                        </div>
                      )
                    ) : (
                      <>
                        <h2>Receber</h2>
                        <strong className="payment-card-amount">{formatBRL(amount)}</strong>
                        <p className="payment-card-method">{PAYMENT_LABELS[method]}</p>
                        <img
                          className="payment-terminal"
                          src="/brand/payment-terminal.png"
                          alt="Maquininha com cartão"
                        />
                        <div className="payment-waiting" role="status">
                          Aguardando Pagamento
                        </div>
                      </>
                    )}
                  </div>
                  {(method !== "pix" || pixReady) && (
                    <div className="payment-fallback">
                      {notificationAccess === false && (
                        <p>
                          A confirmação automática precisa do acesso às notificações no Android.
                        </p>
                      )}
                      <button
                        type="button"
                        className="payment-manual-toggle"
                        aria-expanded={manualOpen}
                        onClick={() => setManualOpen(!manualOpen)}
                      >
                        Confirmar manualmente
                      </button>
                      {manualOpen && (
                        <div className="payment-manual">
                          <p>Confira o recebimento no aplicativo antes de confirmar.</p>
                          <Button type="button" onClick={confirm}>
                            Confirmar pagamento
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
