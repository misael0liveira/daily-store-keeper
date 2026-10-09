import { useState } from "react";
import { Field, LocalForm } from "@/components/ManagementUI";
import { canOperate, useStore } from "@/store/useStore";

export function ReplenishmentSettings() {
  const state = useStore();
  const [cycle, setCycle] = useState(String(state.settings.wholesaleCycleDays ?? 7));
  const [safety, setSafety] = useState(String(state.settings.stockSafetyDays ?? 2));
  return (
    <details className="pos-card">
      <summary className="cursor-pointer font-semibold">Configurar reposição</summary>
      <p className="mt-3 text-sm text-muted-foreground">
        A média usa as vendas registradas nos últimos 30 dias. Os dias abaixo valem para toda a
        loja.
      </p>
      <LocalForm
        label="Salvar dias de reposição"
        success="Dias de reposição salvos"
        disabled={!canOperate(state, "manage")}
        onSave={() =>
          state.setSettings({
            wholesaleCycleDays: cycle.trim() ? Number(cycle) : NaN,
            stockSafetyDays: safety.trim() ? Number(safety) : NaN,
          })
        }
      >
        <Field
          label="Ciclo de ida ao atacado (dias)"
          value={cycle}
          onChange={setCycle}
          inputMode="numeric"
          invalid={
            Boolean(cycle.trim()) &&
            (!Number.isInteger(Number(cycle)) || Number(cycle) < 1 || Number(cycle) > 365)
          }
          required
        />
        <Field
          label="Margem de segurança (dias)"
          value={safety}
          onChange={setSafety}
          inputMode="numeric"
          invalid={
            Boolean(safety.trim()) &&
            (!Number.isInteger(Number(safety)) || Number(safety) < 0 || Number(safety) > 365)
          }
          required
        />
        <p className="text-xs text-muted-foreground">
          Ciclo: 1 a 365 dias. Segurança: 0 a 365 dias, sem frações.
        </p>
        {!canOperate(state, "manage") && (
          <p className="management-warning">
            Identifique o proprietário ou gerente em Gestão → Equipe para alterar os dias.
          </p>
        )}
      </LocalForm>
    </details>
  );
}
