import { useState } from "react";
import { Field, LocalForm } from "@/components/ManagementUI";
import { Button } from "@/components/ui/button";
import { canOperate, useStore, type Customer } from "@/store/useStore";
import { decimal } from "@/lib/managementNumbers";
export function CustomerForm({
  customer,
  onSaved,
  onCancel,
}: {
  customer?: Customer | undefined;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const state = useStore();
  const [name, setName] = useState(customer?.name ?? "");
  const [contact, setContact] = useState(customer?.contact ?? "");
  const [cpf, setCpf] = useState(customer?.cpf ?? "");
  const [enabled, setEnabled] = useState(customer?.creditEnabled ?? Boolean(customer));
  const [limit, setLimit] = useState(
    customer?.creditLimit === undefined ? "" : String(customer.creditLimit),
  );
  const [day, setDay] = useState(customer?.dueDay === undefined ? "" : String(customer.dueDay));
  const manage = canOperate(state, "manage");
  return (
    <LocalForm
      label="Salvar cliente"
      onSave={() => {
        const id = customer?.id ?? crypto.randomUUID();
        state.upsertCustomer({
          ...customer,
          id,
          name,
          contact,
          cpf,
          creditEnabled: enabled,
          creditLimit: limit.trim() ? decimal(limit) : undefined,
          dueDay: day.trim() ? Number(day) : undefined,
        });
        onSaved(id);
      }}
    >
      <Field label="Nome completo do cliente" value={name} onChange={setName} required />
      <Field
        label="Telefone / WhatsApp (opcional)"
        value={contact}
        onChange={setContact}
        type="tel"
      />
      <Field label="CPF (opcional)" value={cpf} onChange={setCpf} inputMode="numeric" />
      <fieldset disabled={!manage} className="space-y-3">
        <legend className="font-semibold mb-2">Compras fiadas</legend>
        <label className="flex items-center gap-3 min-h-11">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="size-5"
          />
          Permitir compras fiadas
        </label>
        <Field
          label="Limite de fiado (R$; vazio sem limite)"
          value={limit}
          onChange={setLimit}
          inputMode="decimal"
        />
        <Field
          label="Dia habitual de vencimento (1 a 31; opcional)"
          value={day}
          onChange={setDay}
          inputMode="numeric"
        />
      </fieldset>
      {!manage && (
        <p className="text-sm text-muted-foreground">
          Proprietário ou gerente configura a autorização e o limite.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Código gerado automaticamente. Dados usados localmente para identificar compras e
        recebimentos.
      </p>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar cadastro
      </Button>
    </LocalForm>
  );
}
