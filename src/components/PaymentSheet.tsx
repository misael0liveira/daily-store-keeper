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
  contextTitle,
  successDetail,
  previousMethod,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  pixTxid: string;
  onConfirm: (payload: Confirmation) => boolean | "partial" | "collected";
  contextTitle?: string | undefined;
  successDetail?: string | undefined;
  previousMethod?: PaymentMethod | undefined;
}) {
  const settings = useStore((s) => s.settings);
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [paidRaw, setPaidRaw] = useState("");
  const [success, setSuccess] = useState<{ amount: number; bank: string | undefined } | null>(null);
  const [notificationAccess, setNotificationAccess] = useState<boolean | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [choosing, setChoosing] = useState(!previousMethod);
  const [firstMethod, setFirstMethod] = useState<PaymentMethod | undefined>(previousMethod);
  const choiceAction = useRef<HTMLButtonElement>(null);
  const paymentAction = useRef<HTMLButtonElement>(null);
  const firstAmountInput = useRef<HTMLInputElement>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitRaw, setSplitRaw] = useState("");
  const splitValue = Number(splitRaw.replace(",", "."));
  const amount = splitRaw.trim() ? Math.round(splitValue * 100) / 100 : total;
  const invalidSplit =
    !Number.isFinite(amount) || amount < 0 || (amount === 0 && total > 0) || amount > total;
  const invalidFirstPart =
    invalidSplit || amount >= total || !/^\d+(?:[,.]\d{1,2})?$/.test(splitRaw.trim());
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
    if (locked.current || !open || choosing || payload.method === (firstMethod ?? previousMethod))
      return;
    locked.current = true;
    let result: boolean | "partial" | "collected";
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
    if (result === "collected") {
      locked.current = false;
      onOpenChange(false);
      toast.success("Entrada recebida. Confira e registre o saldo fiado.");
      return;
    }
    if (result === "partial") {
      locked.current = false;
      setPaidRaw("");
      setSplitRaw("");
      setSplitOpen(false);
      setManualOpen(false);
      setFirstMethod(payload.method);
      setMethod(payload.method === "dinheiro" ? "pix" : "dinheiro");
      paymentAction.current?.focus();
      toast.success("Primeira parte recebida. Receba o restante em outro meio.");
      return;
    }
    setSuccess({ amount, bank });
  };

  useEffect(() => {
    if (!open) {
      locked.current = false;
      setPaidRaw("");
      setManualOpen(false);
      setSplitRaw("");
      setSplitOpen(false);
      setChoosing(!previousMethod);
      setFirstMethod(previousMethod);
      setMethod(previousMethod === "dinheiro" ? "pix" : "dinheiro");
    }
  }, [open, previousMethod]);

  useEffect(() => {
    if (open) {
      if (choosing && splitOpen) firstAmountInput.current?.focus();
      else if (choosing) choiceAction.current?.focus();
      else paymentAction.current?.focus();
    }
  }, [choosing, splitOpen, open, method]);

  useEffect(() => {
    setManualOpen(false);
    setNotificationAccess(null);
    if (!open || choosing || method === "dinheiro" || invalidSplit || amount <= 0 || success)
      return;
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
  }, [open, method, amount, effectiveTxid, success, invalidSplit, choosing]);

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
        className={choosing ? "customer-sheet" : `payment-sheet payment-${method}`}
        showCloseButton={false}
        onEscapeKeyDown={(e) => {
          if (locked.current) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (locked.current) e.preventDefault();
        }}
      >
        <SheetTitle className={choosing ? "" : "sr-only"}>{contextTitle || "Pagamento"}</SheetTitle>
        <SheetDescription className={choosing ? "" : "sr-only"}>
          Escolha a forma de pagamento e confirme o recebimento de {formatBRL(total)}.
        </SheetDescription>
        {choosing ? (
          <div className="space-y-4 mt-4">
            <p>
              Valor a receber <strong>{formatBRL(total)}</strong>
            </p>
            {!splitOpen ? (
              <>
                <p>Como o cliente vai pagar?</p>
                <Button
                  ref={choiceAction}
                  className="w-full"
                  onClick={() => {
                    setSplitRaw("");
                    setChoosing(false);
                  }}
                >
                  Um meio de pagamento
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={total < 0.02}
                  onClick={() => setSplitOpen(true)}
                >
                  Dois meios de pagamento
                </Button>
                <p className="text-sm text-muted-foreground">
                  Um meio recebe o total. Dois meios recebe uma parte em cada forma de pagamento.
                </p>
                <Button className="w-full" variant="ghost" onClick={close}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="payment-part">Valor no primeiro meio (R$)</Label>
                  <Input
                    id="payment-part"
                    ref={firstAmountInput}
                    value={splitRaw}
                    onChange={(e) => setSplitRaw(e.target.value)}
                    inputMode="decimal"
                    aria-invalid={splitRaw.trim() !== "" && invalidFirstPart}
                    aria-describedby="payment-part-help"
                  />
                  <p id="payment-part-help" className="text-sm text-muted-foreground">
                    Informe um valor maior que zero e menor que {formatBRL(total)}, com até dois
                    decimais.
                  </p>
                </div>
                <p aria-live="polite">
                  {invalidFirstPart
                    ? "Confira o valor da primeira parte."
                    : `Restante no segundo meio: ${formatBRL(Math.round((total - amount) * 100) / 100)}.`}
                </p>
                <Button
                  ref={choiceAction}
                  className="w-full"
                  disabled={invalidFirstPart}
                  onClick={() => {
                    if (!invalidFirstPart) setChoosing(false);
                  }}
                >
                  Receber primeira parte
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    setSplitOpen(false);
                    setSplitRaw("");
                  }}
                >
                  Voltar
                </Button>
              </>
            )}
          </div>
        ) : success ? (
          <PaymentSuccess
            amount={success.amount}
            bank={success.bank}
            detail={successDetail}
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
                  ref={key === method ? paymentAction : undefined}
                  disabled={key === (firstMethod ?? previousMethod)}
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
              <div className="payment-panel-header">
                <div className="payment-panel-heading" title={contextTitle}>
                  {method === "dinheiro" && (
                    <>
                      <h2>{contextTitle ? "Recebimento" : "Pagamento"}</h2>
                      <p className="payment-subtitle">
                        {firstMethod || previousMethod
                          ? "Segundo meio · Dinheiro"
                          : splitPayment
                            ? "Primeiro meio · Dinheiro"
                            : contextTitle || "Dinheiro"}
                      </p>
                    </>
                  )}
                  {method !== "dinheiro" &&
                    (contextTitle || splitPayment || firstMethod || previousMethod) && (
                      <p className="payment-subtitle">
                        {firstMethod || previousMethod
                          ? "Segundo meio de pagamento"
                          : splitPayment
                            ? "Primeiro meio de pagamento"
                            : contextTitle}
                      </p>
                    )}
                </div>
                <button
                  type="button"
                  className="payment-close"
                  aria-label="Fechar pagamento"
                  onClick={close}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              {method === "dinheiro" ? (
                <>
                  <div className="payment-cash-body">
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
