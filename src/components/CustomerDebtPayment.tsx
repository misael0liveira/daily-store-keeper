import { useRef, useState } from "react";
import { toast } from "sonner";
import { PaymentSheet, type Confirmation } from "@/components/PaymentSheet";
import { Choice, Field, LocalForm } from "@/components/ManagementUI";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createPixTxid } from "@/lib/pix";
import { decimal } from "@/lib/managementNumbers";
import {
  canOperate,
  customerBalance,
  formatBRL,
  money,
  useStore,
  type Customer,
} from "@/store/useStore";

export function CustomerDebtPayment({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const state = useStore();
  const [debtId, setDebtId] = useState("");
  const [raw, setRaw] = useState("");
  const [target, setTarget] = useState(0);
  const [received, setReceived] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [txid, setTxid] = useState("");
  const receiptId = useRef(crypto.randomUUID());
  const debts = state.receivables.filter((d) => d.customerId === customer.id && d.balance > 0);
  const available = debtId
    ? (debts.find((d) => d.id === debtId)?.balance ?? 0)
    : customerBalance(state, customer.id);
  const confirm = (payment: Confirmation): boolean | "partial" => {
    const amount = payment.amount ?? money(target - received);
    state.collectCustomerDebt(
      customer.id,
      amount,
      payment.method,
      receiptId.current,
      debtId || undefined,
      { reference: payment.reference, source: payment.source, bank: payment.bank },
    );
    receiptId.current = crypto.randomUUID();
    const next = money(received + amount);
    setReceived(next);
    return next < target ? "partial" : true;
  };
  return (
    <>
      <Sheet
        open={!payOpen}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <SheetContent side="bottom" className="customer-sheet">
          <SheetTitle>Receber fiado — {customer.name}</SheetTitle>
          <SheetDescription>
            Saldo em aberto {formatBRL(customerBalance(state, customer.id))}. Confira o recebimento
            antes de registrar.
          </SheetDescription>
          {!canOperate(state, "cash") ? (
            <p role="alert">Identifique um operador autorizado em Gestão → Equipe.</p>
          ) : !state.cashOpen ? (
            <p role="alert">Abra o caixa em Ajustes → Gestão antes de receber.</p>
          ) : (
            <LocalForm
              label="Escolher forma de pagamento"
              onSave={() => {
                const value = raw.trim() ? decimal(raw) : available;
                if (!Number.isFinite(value) || value <= 0 || value > available)
                  throw new Error("Informe um valor maior que zero e até o saldo disponível.");
                setTarget(money(value));
                setReceived(0);
                setTxid(createPixTxid());
                setPayOpen(true);
              }}
            >
              <Choice
                label="Abater o recebimento"
                value={debtId}
                onChange={(v) => {
                  setDebtId(v);
                  setRaw("");
                }}
                options={[
                  { value: "", label: "Vencimentos mais antigos primeiro" },
                  ...debts.map((d) => ({
                    value: d.id,
                    label: `${d.dueAt.split("-").reverse().join("/")} · ${formatBRL(d.balance)}`,
                  })),
                ]}
              />
              <Field
                label="Valor a receber (R$)"
                value={raw}
                onChange={setRaw}
                inputMode="decimal"
                placeholder={available.toFixed(2).replace(".", ",")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setRaw(available.toFixed(2).replace(".", ","))}
              >
                Quitar saldo selecionado
              </Button>
              <p className="text-sm text-muted-foreground">
                Vazio recebe o saldo selecionado. Um pagamento parcial mantém o restante em aberto.
              </p>
            </LocalForm>
          )}
        </SheetContent>
      </Sheet>
      <PaymentSheet
        open={payOpen}
        onOpenChange={(v) => {
          setPayOpen(v);
          if (!v) onClose();
        }}
        total={money(target - received)}
        pixTxid={txid}
        onConfirm={confirm}
        contextTitle={`Recebimento de fiado · ${customer.name}`}
        successDetail="Recebimento registrado no extrato"
      />
    </>
  );
}
