import { CustomersPanel } from "@/components/CustomersPanel";
import { decimal } from "@/lib/managementNumbers";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Archive,
  ClipboardList,
  Download,
  PackagePlus,
  Receipt,
  Shield,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Choice,
  ConfirmAction,
  Field,
  LocalForm,
  RecordCard,
  RecordList,
} from "@/components/ManagementUI";
import {
  createBackup,
  downloadFile,
  previewBackup,
  restoreBackup,
  type BackupPreview,
} from "@/lib/managementBackup";
import { csvTemplate, exportProductsCsv, previewCsv } from "@/lib/managementCsv";
import { formatDateTime } from "@/lib/periods";
import { generateLabelsPdf } from "@/lib/receipts";
import { readProductPhoto } from "@/lib/productPhotos";
import {
  PAYMENT_LABELS,
  canOperate,
  cashExpected,
  formatBRL,
  isLowStock,
  money,
  operator,
  productId,
  saleNet,
  useStore,
  type PaymentMethod,
  type Permission,
  type Staff,
} from "@/store/useStore";

const sections = [
  {
    key: "recebimentos",
    label: "Entrada de mercadoria",
    description: "Fornecedor, embalagens, custos e lotes",
    icon: PackagePlus,
    permission: "inventory",
  },
  {
    key: "fornecedores",
    label: "Fornecedores",
    description: "Cadastro e histórico de recebimentos",
    icon: Users,
    permission: "inventory",
  },
  {
    key: "movimentos",
    label: "Movimentos e inventário",
    description: "Entradas, saídas, perdas e contagem",
    icon: ClipboardList,
    permission: "inventory",
  },
  {
    key: "caixa",
    label: "Caixa e despesas",
    description: "Abertura, sangria, suprimento e fechamento",
    icon: Wallet,
    permission: "cash",
  },
  {
    key: "relatorios",
    label: "Relatórios de gestão",
    description: "Custos, margem, reposição e perdas",
    icon: Receipt,
    permission: "costs",
  },
  {
    key: "clientes",
    label: "Clientes e fiado",
    description: "Clientes, vencimentos e recebimentos",
    icon: Users,
    permission: "sell",
  },
  {
    key: "atendimentos",
    label: "Atendimentos guardados",
    description: "Retomar carrinhos sem duplicar vendas",
    icon: Archive,
    permission: "sell",
  },
  {
    key: "dados",
    label: "Backup e planilhas",
    description: "Fotos, restauração e importação CSV",
    icon: Download,
    permission: "backup",
  },
  {
    key: "equipe",
    label: "Equipe",
    description: "Operadores e permissões opcionais",
    icon: Shield,
    permission: undefined,
  },
] as const;
export const Route = createFileRoute("/gestao")({
  validateSearch: (search: Record<string, unknown>) => ({
    sec:
      typeof search["sec"] === "string" && sections.some((s) => s.key === search["sec"])
        ? search["sec"]
        : "",
  }),
  head: () => ({ meta: [{ title: "Gestão — Mercadinho União" }] }),
  component: ManagementPage,
});
const methods = Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label }));
const uid = () => crypto.randomUUID();
function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
function ManagementPage() {
  const { sec } = Route.useSearch();
  const navigate = useNavigate({ from: "/gestao" });
  const state = useStore();
  const selected = sections.find((s) => s.key === sec);
  const allowed = !selected?.permission || canOperate(state, selected.permission as Permission);
  return (
    <div className="pos-page management-page">
      <header className="pos-header">
        <Link
          to={sec ? "/gestao" : "/mais"}
          search={sec ? { sec: "" } : {}}
          aria-label={sec ? "Voltar para gestão" : "Voltar para ajustes"}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft aria-hidden="true" />
        </Link>
        <h1>{selected?.label ?? "Gestão"}</h1>
      </header>
      {!sec ? (
        <>
          <EmptyHint>Controles salvos neste aparelho. Operação sem internet.</EmptyHint>
          <div className="management-menu">
            {sections.map((s) => (
              <button
                type="button"
                key={s.key}
                onClick={() => void navigate({ search: { sec: s.key } })}
                className="pos-card management-menu-item"
              >
                <s.icon aria-hidden="true" className="text-primary shrink-0" />
                <span>
                  <strong>{s.label}</strong>
                  <small>{s.description}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : !allowed ? (
        <section className="pos-card space-y-3">
          <h2 className="font-semibold">Operador autorizado necessário</h2>
          <EmptyHint>Identifique um operador com acesso a esta área.</EmptyHint>
          <Button onClick={() => void navigate({ search: { sec: "equipe" } })}>
            Identificar operador
          </Button>
        </section>
      ) : (
        <>
          {sec === "recebimentos" && <ReceivingPanel />}
          {sec === "fornecedores" && <SuppliersPanel />}
          {sec === "movimentos" && <InventoryPanel />}
          {sec === "caixa" && <CashPanel />}
          {sec === "relatorios" && <ReportsPanel />}
          {sec === "clientes" && <CustomersPanel />}
          {sec === "atendimentos" && <DraftsPanel />}
          {sec === "dados" && <DataPanel />}
          {sec === "equipe" && <StaffPanel />}
        </>
      )}
    </div>
  );
}
function SuppliersPanel() {
  const state = useStore();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [editId, setEditId] = useState("");
  return (
    <>
      <section className="pos-card">
        <h2 className="management-heading">
          {editId ? "Editar fornecedor" : "Cadastrar fornecedor"}
        </h2>
        <LocalForm
          onSave={() => {
            state.upsertSupplier({ id: editId || uid(), name, contact });
            setName("");
            setContact("");
            setEditId("");
          }}
          label="Salvar fornecedor"
        >
          <Field label="Nome do fornecedor" value={name} onChange={setName} required />
          <Field label="Contato (opcional)" value={contact} onChange={setContact} />
          {editId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditId("");
                setName("");
                setContact("");
              }}
            >
              Cancelar edição
            </Button>
          )}
        </LocalForm>
      </section>
      <RecordList>
        {state.suppliers.map((s) => (
          <RecordCard key={s.id} title={s.name}>
            <EmptyHint>
              {s.contact || "Contato não informado"} · {s.active === false ? "Arquivado" : "Ativo"}
            </EmptyHint>
            <p>
              {state.receivings.filter((r) => r.supplierId === s.id).length} recebimentos ·{" "}
              {formatBRL(
                state.receivings
                  .filter((r) => r.supplierId === s.id)
                  .reduce((n, r) => n + r.total, 0),
              )}
            </p>
            <div className="management-actions">
              <Button
                variant="outline"
                onClick={() => {
                  setEditId(s.id);
                  setName(s.name);
                  setContact(s.contact ?? "");
                }}
              >
                Editar
              </Button>
              <ConfirmAction
                label={s.active === false ? "Reativar" : "Arquivar"}
                title={`${s.active === false ? "Reativar" : "Arquivar"} ${s.name}?`}
                description="Os recebimentos anteriores serão preservados."
                onConfirm={() => state.upsertSupplier({ ...s, active: s.active === false })}
              />
            </div>
          </RecordCard>
        ))}
      </RecordList>
    </>
  );
}
type ReceiptLine = {
  barcode: string;
  packs: string;
  units: string;
  cost: string;
  lot: string;
  expiry: string;
};
const newLine = (): ReceiptLine => ({
  barcode: "",
  packs: "1",
  units: "1",
  cost: "",
  lot: "",
  expiry: "",
});
function ReceivingPanel() {
  const state = useStore();
  const [supplier, setSupplier] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<ReceiptLine[]>([newLine()]);
  const requestId = useRef(uid());
  const productOptions = [
    { value: "", label: "Selecione o produto" },
    ...Object.values(state.products)
      .filter((p) => p.active !== false && p.stockControlled !== false && !p.components?.length)
      .map((p) => ({ value: p.barcode, label: `${p.name} · ${p.barcode}` })),
  ];
  const update = (index: number, key: keyof ReceiptLine, value: string) =>
    setLines((old) => old.map((line, n) => (n === index ? { ...line, [key]: value } : line)));
  return (
    <>
      <section className="pos-card">
        <h2 className="management-heading">Novo recebimento</h2>
        <EmptyHint>Confirme quando a mercadoria chegar. Rascunho não aumenta o estoque.</EmptyHint>
        <LocalForm
          label="Registrar recebimento"
          success="Mercadoria recebida e estoque atualizado"
          onSave={() => {
            state.receive({
              id: requestId.current,
              supplierId: supplier,
              reference,
              items: lines.map((l) => ({
                barcode: l.barcode,
                packs: decimal(l.packs),
                unitsPerPack: decimal(l.units),
                packCost: decimal(l.cost),
                lotName: l.lot,
                expiresAt: l.expiry || undefined,
              })),
            });
            requestId.current = uid();
            setLines([newLine()]);
            setReference("");
          }}
        >
          <Choice
            label="Fornecedor"
            value={supplier}
            onChange={setSupplier}
            options={[
              { value: "", label: "Selecione o fornecedor" },
              ...state.suppliers
                .filter((s) => s.active !== false)
                .map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          <Field
            label="Referência da compra (opcional)"
            value={reference}
            onChange={setReference}
          />
          {lines.map((l, index) => (
            <fieldset key={index} className="management-line">
              <legend>Produto {index + 1}</legend>
              <Choice
                label={`Produto recebido ${index + 1}`}
                value={l.barcode}
                onChange={(v) => update(index, "barcode", v)}
                options={productOptions}
              />
              <div className="management-grid">
                <Field
                  label={`Embalagens ${index + 1}`}
                  value={l.packs}
                  onChange={(v) => update(index, "packs", v)}
                  inputMode="decimal"
                  required
                />
                <Field
                  label={`Unidades por embalagem ${index + 1}`}
                  value={l.units}
                  onChange={(v) => update(index, "units", v)}
                  inputMode="decimal"
                  required
                />
              </div>
              <Field
                label={`Custo da embalagem ${index + 1} (R$)`}
                value={l.cost}
                onChange={(v) => update(index, "cost", v)}
                inputMode="decimal"
                required
              />
              <div className="management-grid">
                <Field
                  label={`Lote ${index + 1} (opcional)`}
                  value={l.lot}
                  onChange={(v) => update(index, "lot", v)}
                />
                <Field
                  label={`Validade ${index + 1} (opcional)`}
                  value={l.expiry}
                  onChange={(v) => update(index, "expiry", v)}
                  type="date"
                />
              </div>
              {lines.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLines((old) => old.filter((_, n) => n !== index))}
                >
                  Remover produto {index + 1}
                </Button>
              )}
              <EmptyHint>
                {Number.isFinite(decimal(l.packs) * decimal(l.units))
                  ? `${decimal(l.packs) * decimal(l.units)} unidades recebidas`
                  : "Confira a quantidade"}
              </EmptyHint>
            </fieldset>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setLines((old) => [...old, newLine()])}
          >
            Adicionar outro produto
          </Button>
          <p className="font-semibold">
            Total:{" "}
            {formatBRL(
              lines.reduce(
                (n, l) =>
                  n +
                  (Number.isFinite(decimal(l.packs) * decimal(l.cost))
                    ? decimal(l.packs) * decimal(l.cost)
                    : 0),
                0,
              ),
            )}
          </p>
        </LocalForm>
      </section>
      <h2 className="management-heading">Recebimentos registrados</h2>
      <RecordList>
        {state.receivings.map((r) => (
          <RecordCard
            key={r.id}
            title={state.suppliers.find((s) => s.id === r.supplierId)?.name ?? "Fornecedor"}
          >
            <EmptyHint>
              {formatDateTime(r.timestamp)} · {r.reference || "Sem referência"}
            </EmptyHint>
            {r.items.map((i, n) => (
              <p key={n}>
                {i.name}: {i.qty} · {formatBRL(i.total)}
              </p>
            ))}
            <strong>{formatBRL(r.total)}</strong>
          </RecordCard>
        ))}
      </RecordList>
    </>
  );
}
function InventoryPanel() {
  const state = useStore();
  const [barcode, setBarcode] = useState("");
  const [kind, setKind] = useState("count");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const p = state.products[barcode];
  const movements = state.movements.filter(
    (m) =>
      !search ||
      `${m.name} ${m.barcode} ${m.reason}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <section className="pos-card">
        <h2 className="management-heading">Conferência e ajuste</h2>
        <LocalForm
          label="Registrar ajuste"
          onSave={() => {
            if (!p) throw new Error("Selecione o produto.");
            const n = decimal(value);
            state.adjustStock(
              barcode,
              kind === "count" ? money(n - p.stock) : kind === "loss" ? -n : n,
              reason,
              kind === "loss",
            );
            setValue("");
            setReason("");
          }}
        >
          <Choice
            label="Produto do ajuste"
            value={barcode}
            onChange={setBarcode}
            options={[
              { value: "", label: "Selecione o produto" },
              ...Object.values(state.products)
                .filter(
                  (p) => p.active !== false && !p.components?.length && p.stockControlled !== false,
                )
                .map((p) => ({ value: p.barcode, label: p.name })),
            ]}
          />
          {p && (
            <p>
              Saldo registrado: {p.stock} {p.unit ?? "un"}
            </p>
          )}
          <Choice
            label="Tipo de ajuste"
            value={kind}
            onChange={setKind}
            options={[
              { value: "count", label: "Contagem: substituir pelo saldo contado" },
              { value: "loss", label: "Perda: retirar quantidade" },
              { value: "add", label: "Correção: acrescentar quantidade" },
            ]}
          />
          <Field
            label={kind === "count" ? "Quantidade contada" : "Quantidade do ajuste"}
            value={value}
            onChange={setValue}
            inputMode="decimal"
            required
          />
          <Field label="Motivo do ajuste" value={reason} onChange={setReason} required />
        </LocalForm>
      </section>
      <section className="pos-card">
        <h2 className="management-heading">Lotes e validade</h2>
        <EmptyHint>
          A baixa prioriza o vencimento mais próximo. Lotes vencidos não ficam disponíveis para
          venda. Devoluções entram sem validade definida para nova conferência.
        </EmptyHint>
        <RecordList empty="Nenhum lote registrado. Informe o lote na entrada de mercadoria.">
          {state.lots.map((l) => (
            <div key={l.id} className="management-line">
              <strong>
                {state.products[
                  Object.keys(state.products).find(
                    (code) => productId(state.products[code]!) === l.productId,
                  ) ?? ""
                ]?.name ?? "Produto"}{" "}
                · {l.name}
              </strong>
              <p>
                {l.available} disponíveis · Validade{" "}
                {l.expiresAt ? l.expiresAt.split("-").reverse().join("/") : "não informada"}
              </p>
            </div>
          ))}
        </RecordList>
      </section>
      <div className="relative">
        <Input
          aria-label="Buscar movimentações"
          placeholder="Produto, código ou motivo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-12"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            aria-label="Limpar busca de movimentações"
            onClick={() => setSearch("")}
          >
            <X />
          </Button>
        )}
      </div>
      <h2 className="management-heading">Histórico de estoque</h2>
      <RecordList empty="Nenhum movimento encontrado.">
        {movements.map((m) => (
          <RecordCard key={m.id} title={`${m.delta > 0 ? "+" : ""}${m.delta} · ${m.name}`}>
            <p>{m.reason}</p>
            <EmptyHint>
              {formatDateTime(m.timestamp)} · {m.before} → {m.after}
            </EmptyHint>
          </RecordCard>
        ))}
      </RecordList>
      <section className="pos-card">
        <h2 className="management-heading">Produtos arquivados</h2>
        <RecordList empty="Nenhum produto arquivado.">
          {Object.values(state.products)
            .filter((p) => p.active === false)
            .map((p) => (
              <div key={p.barcode} className="management-line">
                <p>
                  {p.name} · {p.barcode}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    try {
                      state.upsertProduct({ ...p, active: true });
                      toast.success("Produto reativado");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Não foi possível reativar.");
                    }
                  }}
                >
                  Reativar produto
                </Button>
              </div>
            ))}
        </RecordList>
      </section>
    </>
  );
}
function CashPanel() {
  const state = useStore();
  const current = state.cashSessions.find((s) => !s.closedAt);
  const [opening, setOpening] = useState("");
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState("supply");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [method, setMethod] = useState("dinheiro");
  const expenseId = useRef(uid());
  return (
    <>
      <section className="pos-card">
        <h2 className="management-heading">{current ? "Caixa aberto" : "Abrir caixa"}</h2>
        {current ? (
          <>
            <p>Aberto em {formatDateTime(current.openedAt)}</p>
            <EmptyHint>{current.note}</EmptyHint>
            <p>Fundo inicial: {formatBRL(current.opening)}</p>
            <p className="management-total">
              Dinheiro esperado: {formatBRL(cashExpected(state, current))}
            </p>
            <EmptyHint>Pix e cartão não entram como dinheiro físico.</EmptyHint>
            <LocalForm
              label="Fechar caixa"
              success="Caixa fechado"
              onSave={() => {
                state.closeCash(decimal(counted), note);
                setCounted("");
                setNote("");
              }}
            >
              <Field
                label="Dinheiro contado (R$)"
                value={counted}
                onChange={setCounted}
                inputMode="decimal"
                required
              />
              <Field label="Observação do fechamento" value={note} onChange={setNote} />
            </LocalForm>
          </>
        ) : (
          <LocalForm
            label="Abrir caixa"
            success="Caixa aberto"
            onSave={() => {
              state.openCash(decimal(opening), note);
              setOpening("");
              setNote("");
            }}
          >
            <Field
              label="Fundo inicial de troco (R$)"
              value={opening}
              onChange={setOpening}
              inputMode="decimal"
              required
            />
            <Field label="Observação da abertura" value={note} onChange={setNote} />
          </LocalForm>
        )}
      </section>
      {current && (
        <section className="pos-card">
          <h2 className="management-heading">Movimentar dinheiro</h2>
          <LocalForm
            label="Registrar movimento de caixa"
            onSave={() => {
              state.recordCash(type as "supply" | "withdrawal", decimal(amount), reason);
              setAmount("");
              setReason("");
            }}
          >
            <Choice
              label="Movimento"
              value={type}
              onChange={setType}
              options={[
                { value: "supply", label: "Suprimento: adicionar dinheiro" },
                { value: "withdrawal", label: "Sangria: retirar dinheiro" },
              ]}
            />
            <Field
              label="Valor do movimento (R$)"
              value={amount}
              onChange={setAmount}
              inputMode="decimal"
              required
            />
            <Field label="Motivo do movimento" value={reason} onChange={setReason} required />
          </LocalForm>
        </section>
      )}
      <section className="pos-card">
        <h2 className="management-heading">Registrar despesa paga</h2>
        <LocalForm
          label="Registrar despesa"
          onSave={() => {
            state.addExpense({
              id: expenseId.current,
              category,
              description,
              amount: decimal(expenseAmount),
              method: method as PaymentMethod,
            });
            expenseId.current = uid();
            setDescription("");
            setExpenseAmount("");
          }}
        >
          <Field label="Categoria da despesa" value={category} onChange={setCategory} required />
          <Field
            label="Descrição da despesa"
            value={description}
            onChange={setDescription}
            required
          />
          <Field
            label="Valor da despesa (R$)"
            value={expenseAmount}
            onChange={setExpenseAmount}
            inputMode="decimal"
            required
          />
          <Choice
            label="Pagamento da despesa"
            value={method}
            onChange={setMethod}
            options={methods}
          />
        </LocalForm>
      </section>
      <h2 className="management-heading">Turnos de caixa</h2>
      <RecordList>
        {state.cashSessions.map((s) => (
          <RecordCard key={s.id} title={s.closedAt ? "Caixa fechado" : "Caixa aberto"}>
            <EmptyHint>
              {formatDateTime(s.openedAt)}
              {s.closedAt ? ` a ${formatDateTime(s.closedAt)}` : ""}
            </EmptyHint>
            <p>
              Inicial {formatBRL(s.opening)} · Esperado{" "}
              {formatBRL(s.expected ?? cashExpected(state, s))}
            </p>
            {s.closedAt && (
              <p>
                Contado {formatBRL(s.counted ?? 0)} · Diferença {formatBRL(s.difference ?? 0)}
              </p>
            )}
          </RecordCard>
        ))}
      </RecordList>
      <h2 className="management-heading">Movimentos financeiros</h2>
      <RecordList>
        {state.cashMovements.map((m) => (
          <RecordCard key={m.id} title={m.reason}>
            <p>
              {formatBRL(m.amount)} · {PAYMENT_LABELS[m.method]}
            </p>
            <EmptyHint>
              {formatDateTime(m.timestamp)} ·{" "}
              {
                {
                  supply: "Suprimento",
                  withdrawal: "Sangria",
                  expense: "Despesa",
                  refund: "Reembolso registrado",
                  debt: "Recebimento",
                }[m.type]
              }
            </EmptyHint>
          </RecordCard>
        ))}
      </RecordList>
    </>
  );
}
function ReportsPanel() {
  const state = useStore();
  const [month, setMonth] = useState(new Date().toLocaleDateString("sv-SE").slice(0, 7));
  const [range, setRange] = useState("month");
  const start =
    range === "all"
      ? 0
      : range === "30"
        ? Date.now() - 30 * 86400000
        : new Date(`${month}-01T00:00:00`).getTime();
  const date = new Date(`${month}-01T00:00:00`);
  const end =
    range === "month"
      ? new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime() - 1
      : Date.now();
  const sales = state.sales.filter(
    (s) => s.timestamp >= start && s.timestamp <= end && s.status !== "cancelled",
  );
  const net = sales.reduce((n, s) => n + saleNet(s), 0);
  let cost = 0,
    unknown = 0;
  const items = new Map<
    string,
    { name: string; category: string; qty: number; revenue: number; cost: number; unknown: boolean }
  >();
  for (const s of sales)
    for (const i of s.items) {
      const qty = i.qty - (i.returnedQty ?? 0);
      if (qty <= 0) continue;
      const key = i.productId ?? i.barcode;
      const p =
        Object.values(state.products).find((p) => productId(p) === i.productId) ??
        state.products[i.barcode];
      const old = items.get(key) ?? {
        name: i.name,
        category: p?.category ?? "Sem categoria",
        qty: 0,
        revenue: 0,
        cost: 0,
        unknown: false,
      };
      old.qty += qty;
      old.revenue += i.price * qty;
      if (i.cost === undefined && qty > 0) {
        old.unknown = true;
        unknown++;
      } else {
        old.cost += (i.cost ?? 0) * qty;
        cost += (i.cost ?? 0) * qty;
      }
      items.set(key, old);
    }
  const expenses = state.expenses
    .filter((e) => e.timestamp >= start && e.timestamp <= end)
    .reduce((n, e) => n + e.amount, 0);
  const products = Object.values(state.products).filter(
    (p) => p.active !== false && p.stockControlled !== false && !p.components?.length,
  );
  const categories = new Map<string, number>();
  for (const i of items.values())
    categories.set(i.category, (categories.get(i.category) ?? 0) + i.revenue);
  return (
    <>
      <section className="pos-card">
        <h2 className="management-heading">Período dos relatórios</h2>
        <div className="management-form">
          <Choice
            label="Período da gestão"
            value={range}
            onChange={setRange}
            options={[
              { value: "month", label: "Mês fechado" },
              { value: "30", label: "Últimos 30 dias" },
              { value: "all", label: "Todo o histórico" },
            ]}
          />
          {range === "month" && (
            <Field label="Mês do relatório" type="month" value={month} onChange={setMonth} />
          )}
        </div>
      </section>
      <section className="pos-card space-y-2">
        <h2 className="management-heading">Resultado estimado</h2>
        <p>
          Vendas líquidas: <strong>{formatBRL(net)}</strong>
        </p>
        <p>Custo conhecido vendido: {formatBRL(cost)}</p>
        <p>Despesas pagas: {formatBRL(expenses)}</p>
        {unknown ? (
          <p className="management-warning">
            {unknown} linhas sem custo. Margem total indisponível.
          </p>
        ) : (
          <>
            <p>Ganho bruto: {formatBRL(net - cost)}</p>
            <p>Resultado após despesas registradas: {formatBRL(net - cost - expenses)}</p>
            <p>Margem bruta: {net > 0 ? (((net - cost) / net) * 100).toFixed(2) : "0,00"}%</p>
          </>
        )}
        <EmptyHint>
          Estimativa com os custos e despesas cadastrados. Taxas e impostos não informados não são
          presumidos.
        </EmptyHint>
        <Link to="/vendas" className="text-primary underline">
          Conferir vendas no histórico
        </Link>
      </section>
      <section className="pos-card">
        <h2 className="management-heading">Estoque e reposição</h2>
        <p>
          Valor a custo conhecido:{" "}
          {formatBRL(products.reduce((n, p) => n + p.stock * (p.cost ?? 0), 0))}
        </p>
        <EmptyHint>
          {products.filter((p) => p.cost === undefined).length} produtos sem custo informado.
        </EmptyHint>
        <RecordList empty="Nenhum produto precisa de reposição.">
          {products.filter(isLowStock).map((p) => (
            <div className="management-line" key={p.barcode}>
              <strong>{p.name}</strong>
              <p>
                Saldo {p.stock} · Mínimo {p.minimumStock ?? 5}
              </p>
            </div>
          ))}
        </RecordList>
        <Link to="/estoque" className="text-primary underline">
          Conferir produtos
        </Link>
      </section>
      <h2 className="management-heading">Produtos vendidos</h2>
      <RecordList>
        {[...items.entries()]
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .map(([key, i]) => (
            <RecordCard key={key} title={i.name}>
              <p>
                {i.qty} vendidos · {formatBRL(i.revenue)}
              </p>
              <EmptyHint>
                {i.category} ·{" "}
                {i.unknown ? "Margem indisponível" : `Ganho bruto ${formatBRL(i.revenue - i.cost)}`}
              </EmptyHint>
            </RecordCard>
          ))}
      </RecordList>
      <section className="pos-card">
        <h2 className="management-heading">Vendas por categoria</h2>
        {[...categories].map(([name, total]) => (
          <p key={name}>
            {name}: {formatBRL(total)}
          </p>
        ))}
      </section>
      <section className="pos-card">
        <h2 className="management-heading">Perdas registradas</h2>
        <RecordList empty="Nenhuma perda neste período.">
          {state.movements
            .filter((m) => m.type === "loss" && m.timestamp >= start && m.timestamp <= end)
            .map((m) => (
              <div className="management-line" key={m.id}>
                <strong>
                  {m.name}: {Math.abs(m.delta)}
                </strong>
                <p>{m.reason}</p>
                <EmptyHint>{formatDateTime(m.timestamp)}</EmptyHint>
              </div>
            ))}
        </RecordList>
      </section>
    </>
  );
}
function DraftsPanel() {
  const state = useStore();
  const [name, setName] = useState("");
  return (
    <>
      <section className="pos-card">
        <h2 className="management-heading">Guardar carrinho atual</h2>
        <LocalForm
          label="Guardar atendimento"
          disabled={!state.cart.length}
          onSave={() => {
            state.suspendCart(name);
            setName("");
          }}
        >
          <Field label="Identificação do atendimento" value={name} onChange={setName} />
          <EmptyHint>
            {state.cart.length} produtos no carrinho. Guardar não registra venda nem baixa estoque.
          </EmptyHint>
        </LocalForm>
      </section>
      <RecordList empty="Nenhum atendimento guardado.">
        {state.drafts.map((d) => (
          <RecordCard key={d.id} title={d.name}>
            <EmptyHint>
              {formatDateTime(d.timestamp)} · {d.cart.length} produtos
            </EmptyHint>
            <div className="management-actions">
              <Button
                onClick={() => {
                  try {
                    state.resumeCart(d.id);
                    toast.success("Atendimento retomado no Caixa");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Não foi possível retomar.");
                  }
                }}
              >
                Retomar atendimento
              </Button>
              <ConfirmAction
                label="Descartar"
                title={`Descartar ${d.name}?`}
                description="Este carrinho não foi vendido. Seu estoque não será alterado."
                onConfirm={() => state.discardDraft(d.id)}
              />
            </div>
          </RecordCard>
        ))}
      </RecordList>
      <Link to="/vender" className="text-primary underline">
        Voltar ao Caixa
      </Link>
    </>
  );
}
function DataPanel() {
  const state = useStore();
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [csv, setCsv] = useState<ReturnType<typeof previewCsv> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <section className="pos-card space-y-4">
        <h2 className="management-heading">Backup completo</h2>
        <EmptyHint>
          Produtos, vendas, movimentos, pagamentos, configurações e fotos. Equipe e PINs devem ser
          recadastrados em outro aparelho.
        </EmptyHint>
        <Button
          className="w-full"
          disabled={busy}
          onClick={() =>
            void run(async () =>
              downloadFile(
                await createBackup(),
                `mercadinho-backup-${new Date().toISOString().slice(0, 10)}.json`,
              ),
            )
          }
        >
          {busy ? "Preparando…" : "Exportar backup com fotos"}
        </Button>
        <label className="management-file">
          Escolher backup para conferir (até 50 MB)
          <Input
            type="file"
            accept=".json,application/json"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                void run(async () => {
                  setPreview(await previewBackup(file));
                });
              e.target.value = "";
            }}
          />
        </label>
        {localStorage.getItem("pdv-before-restore")?.startsWith("photo-") && (
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const photoId = localStorage.getItem("pdv-before-restore");
                const snapshot = photoId ? await readProductPhoto(photoId) : undefined;
                if (!snapshot)
                  throw new Error("A cópia anterior não está disponível neste aparelho.");
                setPreview(
                  await previewBackup(
                    new File([snapshot], "copia-anterior.json", { type: "application/json" }),
                  ),
                );
              })
            }
          >
            Conferir cópia anterior à restauração
          </Button>
        )}
        {preview && (
          <div className="management-line">
            <h3 className="font-semibold">Prévia da restauração</h3>
            <p>
              {Object.keys(preview.data.products).length} produtos · {preview.data.sales.length}{" "}
              vendas · {Object.keys(preview.photos).length} fotos
            </p>
            <EmptyHint>
              Criado em {preview.createdAt}. Substitui os dados deste aparelho. Uma cópia anterior
              será preservada.
            </EmptyHint>
            <ConfirmAction
              label="Restaurar backup"
              title="Substituir os dados deste aparelho?"
              description="Produtos, vendas e fotos virão do arquivo conferido. Operadores locais serão preservados. Exporte seu backup atual antes de prosseguir."
              onConfirm={async () => {
                await restoreBackup(preview);
                setPreview(null);
                toast.success("Backup restaurado");
              }}
            />
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Cancelar restauração
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="management-error">
            {error}
          </p>
        )}
      </section>
      <section className="pos-card space-y-4">
        <h2 className="management-heading">Planilha de produtos</h2>
        <EmptyHint>
          CSV de até 5 MB. Estoque significa saldo contado; campos vazios em atualizações preservam
          o valor anterior. Todo o arquivo é validado antes de salvar.
        </EmptyHint>
        <div className="management-actions">
          <Button
            variant="outline"
            onClick={() =>
              downloadFile(new Blob([csvTemplate], { type: "text/csv" }), "modelo-produtos.csv")
            }
          >
            Baixar modelo CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadFile(new Blob([exportProductsCsv()], { type: "text/csv" }), "produtos.csv")
            }
          >
            Exportar produtos CSV
          </Button>
        </div>
        <label className="management-file">
          Conferir CSV de produtos
          <Input
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                void run(async () => {
                  if (file.size > 5 * 1024 * 1024) throw new Error("CSV maior que 5 MB.");
                  setCsv(previewCsv(await file.text()));
                });
              e.target.value = "";
            }}
          />
        </label>
        {csv && (
          <div className="management-line">
            <p>
              {csv.created} novos · {csv.updated} atualizados · {csv.errors.length} erros
            </p>
            {csv.errors.slice(0, 10).map((e, n) => (
              <p key={n} className="management-error">
                {e}
              </p>
            ))}
            <ConfirmAction
              disabled={Boolean(csv.errors.length) || !csv.products.length}
              label="Importar produtos"
              title="Aplicar esta planilha?"
              description="O saldo informado será registrado como contagem. Fotos e promoções existentes serão preservadas quando não alteradas."
              onConfirm={() => {
                state.importProducts(csv.products);
                setCsv(null);
                toast.success("Produtos importados");
              }}
            />
          </div>
        )}
      </section>
      <section className="pos-card space-y-3">
        <h2 className="management-heading">Etiquetas de preço</h2>
        <EmptyHint>PDF com nome, preço vigente, unidade e código de cada produto ativo.</EmptyHint>
        <Button
          variant="outline"
          onClick={() =>
            void run(async () =>
              generateLabelsPdf(
                Object.values(state.products).filter((p) => p.active !== false),
                state.settings.storeName,
              ),
            )
          }
        >
          Gerar etiquetas PDF
        </Button>
      </section>
    </>
  );
}
function StaffPanel() {
  const state = useStore();
  const [name, setName] = useState("");
  const [role, setRole] = useState("owner");
  const [pin, setPin] = useState("");
  const [member, setMember] = useState("");
  const [unlockPin, setUnlockPin] = useState("");
  const [show, setShow] = useState(false);
  const current = state.staff.find((s) => s.id === operator());
  return (
    <>
      <section className="pos-card">
        <h2 className="management-heading">Operador atual</h2>
        <p>
          {state.staff.length
            ? (current?.name ?? "Operador não identificado")
            : "Proprietário — modo sem equipe"}
        </p>
        {state.staff.length > 0 && (
          <LocalForm
            label="Identificar operador"
            success="Operador identificado"
            onSave={async () => {
              await state.unlockStaff(member, unlockPin);
              setUnlockPin("");
            }}
          >
            <Choice
              label="Operador"
              value={member}
              onChange={setMember}
              options={[
                { value: "", label: "Selecione o operador" },
                ...state.staff.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <Field
              label="PIN do operador"
              value={unlockPin}
              onChange={setUnlockPin}
              type={show ? "text" : "password"}
              inputMode="numeric"
              required
            />
            <Button
              type="button"
              variant="outline"
              aria-pressed={show}
              onClick={() => setShow((v) => !v)}
            >
              {show ? "Ocultar PIN" : "Mostrar PIN"}
            </Button>
            {current && (
              <Button type="button" variant="outline" onClick={() => state.lockStaff()}>
                Encerrar identificação
              </Button>
            )}
          </LocalForm>
        )}
      </section>
      {canOperate(state, "manage") && (
        <section className="pos-card">
          <h2 className="management-heading">
            {state.staff.length ? "Adicionar operador" : "Ativar equipe opcional"}
          </h2>
          <EmptyHint>
            O primeiro operador é proprietário. A abertura do app continua sem senha; operações
            exigem identificação quando a equipe está ativa. Os controles são locais ao aparelho.
          </EmptyHint>
          <LocalForm
            label="Salvar operador"
            onSave={async () => {
              await state.saveStaff(
                { id: uid(), name, role: role as Staff["role"], active: true },
                pin,
              );
              setName("");
              setPin("");
            }}
          >
            <Field label="Nome do operador" value={name} onChange={setName} required />
            <Choice
              label="Perfil do operador"
              value={role}
              onChange={setRole}
              options={[
                { value: "owner", label: "Proprietário: administração completa" },
                { value: "manager", label: "Gerente: estoque, caixa e devoluções" },
                { value: "cashier", label: "Caixa: vendas e clientes" },
              ]}
            />
            <Field
              label="Novo PIN (4 a 12 dígitos)"
              value={pin}
              onChange={setPin}
              type={show ? "text" : "password"}
              inputMode="numeric"
              required
            />
            <Button
              type="button"
              variant="outline"
              aria-pressed={show}
              onClick={() => setShow((v) => !v)}
            >
              {show ? "Ocultar novo PIN" : "Mostrar novo PIN"}
            </Button>
          </LocalForm>
        </section>
      )}
      <RecordList>
        {state.staff.map((s) => (
          <RecordCard key={s.id} title={s.name}>
            <p>
              {{ owner: "Proprietário", manager: "Gerente", cashier: "Caixa" }[s.role]} ·{" "}
              {s.active ? "Ativo" : "Inativo"}
            </p>
          </RecordCard>
        ))}
      </RecordList>
    </>
  );
}
