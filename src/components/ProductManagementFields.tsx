import { decimal } from "@/lib/managementNumbers";
import { useState } from "react";
import { Choice, Field } from "@/components/ManagementUI";
import { Button } from "@/components/ui/button";
import { canOperate, productId, useStore, type Product } from "@/store/useStore";
export function ProductManagementFields({
  product,
  value,
  onChange,
}: {
  product: Product | undefined;
  value: Partial<Product>;
  onChange: (value: Partial<Product>) => void;
}) {
  const state = useStore();
  const merged = { ...product, ...value };
  const [costText, setCostText] = useState(merged.cost === undefined ? "" : String(merged.cost));
  const [minimumText, setMinimumText] = useState(String(merged.minimumStock ?? 5));
  const [componentText, setComponentText] = useState<Record<string, string>>({});
  const patch = (change: Partial<Product>) => onChange({ ...value, ...change });
  const children = Object.values(state.products).filter(
    (p) =>
      p.active !== false &&
      !p.components?.length &&
      p.stockControlled !== false &&
      productId(p) !== (product ? productId(product) : ""),
  );
  return (
    <details className="management-line">
      <summary className="font-semibold cursor-pointer">Gestão do produto (opcional)</summary>
      <div className="management-form mt-4">
        <Field
          label="Categoria"
          value={merged.category ?? ""}
          onChange={(category) => patch({ category })}
        />
        {canOperate(state, "costs") && (
          <Field
            label="Custo unitário (R$; vazio = não informado)"
            value={costText}
            onChange={(cost) => {
              setCostText(cost);
              patch({ cost: cost.trim() ? decimal(cost) : undefined });
            }}
            inputMode="decimal"
          />
        )}
        <Field
          label="Estoque mínimo para reposição"
          value={minimumText}
          onChange={(text) => {
            setMinimumText(text);
            patch({ minimumStock: decimal(text) });
          }}
          inputMode="decimal"
        />
        <Choice
          label="Unidade de venda"
          value={merged.unit ?? "un"}
          onChange={(unit) => patch({ unit: unit as Product["unit"] })}
          options={[
            { value: "un", label: "Unidade (un)" },
            { value: "kg", label: "Quilograma (kg)" },
            { value: "l", label: "Litro (l)" },
          ]}
        />
        <Choice
          label="Controle de estoque"
          value={merged.stockControlled === false ? "no" : "yes"}
          onChange={(v) => patch({ stockControlled: v === "yes" })}
          options={[
            { value: "yes", label: "Controlar quantidade física" },
            { value: "no", label: "Serviço sem estoque físico" },
          ]}
        />
        <Choice
          label="Fornecedor padrão"
          value={merged.supplierId ?? ""}
          onChange={(supplierId) => patch({ supplierId: supplierId || undefined })}
          options={[
            { value: "", label: "Não definido" },
            ...state.suppliers
              .filter((s) => s.active !== false)
              .map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <fieldset className="management-line">
          <legend>Combo de produtos (opcional)</legend>
          <p className="text-sm text-muted-foreground">
            A venda baixa os componentes. O preço acima é o preço total do combo.
          </p>
          <Choice
            label="Adicionar componente ao combo"
            value=""
            onChange={(child) => {
              if (child)
                patch({ components: [...(merged.components ?? []), { productId: child, qty: 1 }] });
            }}
            options={[
              { value: "", label: "Selecione um componente" },
              ...children
                .filter((p) => !merged.components?.some((c) => c.productId === productId(p)))
                .map((p) => ({ value: productId(p), label: p.name })),
            ]}
          />
          {merged.components?.map((c, index) => (
            <div key={c.productId} className="management-line">
              <Field
                label={`Quantidade de ${children.find((p) => productId(p) === c.productId)?.name ?? "componente"}`}
                value={componentText[c.productId] ?? String(c.qty)}
                onChange={(qty) => {
                  setComponentText((previous) => ({ ...previous, [c.productId]: qty }));
                  patch({
                    components: merged.components?.map((line, n) =>
                      n === index ? { ...line, qty: decimal(qty) } : line,
                    ),
                  });
                }}
                inputMode="decimal"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  patch({ components: merged.components?.filter((_, n) => n !== index) })
                }
              >
                Remover componente
              </Button>
            </div>
          ))}
        </fieldset>
      </div>
    </details>
  );
}
