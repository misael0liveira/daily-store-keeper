import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X, QrCode, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { CustomerForm } from "@/components/CustomerForm";
import { CustomerDebtPayment } from "@/components/CustomerDebtPayment";
import { ConfirmAction, RecordList } from "@/components/ManagementUI";
import { PixQr } from "@/components/PixQr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  customerQrPayload,
  downloadCustomerCard,
  downloadCustomerReceipt,
} from "@/lib/customerDocuments";
import {
  canOperate,
  customerBalance,
  customerMatches,
  formatBRL,
  PAYMENT_LABELS,
  useStore,
  type Customer,
} from "@/store/useStore";

export function CustomersPanel() {
  const navigate = useNavigate();
  const state = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("open");
  const [selected, setSelected] = useState<string>();
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [card, setCard] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const customer = state.customers.find((c) => c.id === selected);
  const today = new Date().toLocaleDateString("sv-SE");
  const total = state.receivables.reduce((n, d) => n + d.balance, 0),
    overdue = state.receivables.filter((d) => d.dueAt < today).reduce((n, d) => n + d.balance, 0);
  const download = (fn: () => Promise<void>) =>
    void fn().catch((e) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar o documento."),
    );
  if (creating || (editing && customer))
    return (
      <section className="pos-card space-y-4 customer-panel">
        <h2 className="management-heading">{creating ? "Cadastrar cliente" : "Editar cliente"}</h2>
        <CustomerForm
          customer={creating ? undefined : customer}
          onSaved={(id) => {
            setSelected(id);
            setCreating(false);
            setEditing(false);
          }}
          onCancel={() => {
            setCreating(false);
            setEditing(false);
          }}
        />
      </section>
    );
  if (customer) {
    const debts = state.receivables
      .filter((d) => d.customerId === customer.id)
      .sort((a, b) => b.timestamp - a.timestamp);
    const receipts = new Map<
      string,
      { id: string; timestamp: number; amount: number; method: keyof typeof PAYMENT_LABELS }
    >();
    for (const d of debts)
      for (const r of d.receipts) {
        const old = receipts.get(r.id);
        receipts.set(r.id, { ...r, amount: (old?.amount ?? 0) + r.amount });
      }
    const balance = customerBalance(state, customer.id);
    return (
      <div className="space-y-3 customer-panel">
        <Button
          variant="outline"
          onClick={() => {
            setSelected(undefined);
            setCard(false);
          }}
        >
          Voltar aos clientes
        </Button>
        <section className="pos-card space-y-3">
          <h2 className="management-heading break-words">{customer.name}</h2>
          <p>
            {customer.code} · {customer.contact || "Contato não informado"}
          </p>
          {customer.cpf && (
            <p className="text-sm text-muted-foreground">
              CPF ***.***.***-{customer.cpf.slice(-2)}
            </p>
          )}
          <p className="text-sm">
            {customer.active === false
              ? "Cliente arquivado"
              : customer.creditEnabled === false
                ? "Fiado desabilitado"
                : "Fiado habilitado"}
          </p>
          <p>
            Saldo em aberto <strong>{formatBRL(balance)}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            {customer.creditLimit === undefined
              ? "Limite não definido"
              : `Limite ${formatBRL(customer.creditLimit)} · disponível ${formatBRL(Math.max(0, customer.creditLimit - balance))}`}
          </p>
          {debts.some((d) => d.balance > 0 && d.dueAt < today) && (
            <p className="management-warning">
              Há compras vencidas. Confira o extrato antes de uma nova venda.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={
                customer.active === false ||
                state.pendingPayments.length > 0 ||
                !canOperate(state, "sell")
              }
              onClick={() => {
                try {
                  state.selectCustomer(customer.id);
                  void navigate({ to: "/vender" });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Não foi possível selecionar.");
                }
              }}
            >
              Nova compra
            </Button>
            <Button
              variant="outline"
              disabled={balance <= 0 || !canOperate(state, "cash")}
              onClick={() => setReceiving(true)}
            >
              Receber
            </Button>
            <Button
              variant="outline"
              disabled={!canOperate(state, "sell")}
              onClick={() => setEditing(true)}
            >
              Editar cadastro
            </Button>
          </div>
          <Button variant="outline" onClick={() => setCard((v) => !v)} aria-expanded={card}>
            <QrCode size={18} />
            Cartão do cliente
          </Button>
          {card && (
            <div className="customer-card space-y-3">
              <PixQr
                payload={customerQrPayload(customer)}
                size={220}
                label="QR de identificação do cliente"
              />
              <strong>{customer.code}</strong>
              <Button
                variant="outline"
                onClick={() => download(() => downloadCustomerCard(customer))}
              >
                Salvar cartão em PDF
              </Button>
            </div>
          )}
          <ConfirmAction
            label={customer.active === false ? "Reativar cliente" : "Arquivar cliente"}
            title="Alterar disponibilidade deste cliente?"
            description="Vendas e dívidas permanecem no histórico."
            disabled={!canOperate(state, "sell")}
            onConfirm={() =>
              state.upsertCustomer({ ...customer, active: customer.active === false })
            }
          />
        </section>
        <h2 className="management-heading">Compras e saldo</h2>
        <RecordList empty="Este cliente ainda não tem compras fiadas.">
          {debts.map((d) => {
            const sale = state.sales.find((s) => s.id === d.saleId);
            return (
              <article className="pos-card space-y-2" key={d.id}>
                <h3 className="font-semibold">
                  Compra de {new Date(d.timestamp).toLocaleDateString("pt-BR")}
                </h3>
                <p>
                  Original {formatBRL(d.original)} · saldo <strong>{formatBRL(d.balance)}</strong>
                </p>
                <p
                  className={
                    d.balance === 0
                      ? "text-success"
                      : d.dueAt < today
                        ? "management-error"
                        : "text-muted-foreground"
                  }
                >
                  {d.balance === 0 ? "Quitado · " : ""}Vencimento{" "}
                  {d.dueAt.split("-").reverse().join("/")}
                </p>
                {sale && (
                  <>
                    <details>
                      <summary className="min-h-11 cursor-pointer">Ver itens da compra</summary>
                      <ul className="space-y-2">
                        {sale.items.map((i, n) => (
                          <li key={n}>
                            {i.qty} × {i.name} · {formatBRL(i.qty * i.price)}
                          </li>
                        ))}
                      </ul>
                      <p>Total da compra {formatBRL(sale.total)}</p>
                    </details>
                    <Button
                      variant="outline"
                      onClick={() =>
                        download(() => downloadCustomerReceipt(state, customer, undefined, sale))
                      }
                    >
                      Comprovante da compra
                    </Button>
                  </>
                )}
              </article>
            );
          })}
        </RecordList>
        <h2 className="management-heading">Recebimentos</h2>
        <RecordList empty="Nenhum recebimento registrado.">
          {[...receipts.values()]
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((r) => (
              <article className="pos-card space-y-2" key={r.id}>
                <h3 className="font-semibold">
                  {formatBRL(r.amount)} · {PAYMENT_LABELS[r.method]}
                </h3>
                <p>{new Date(r.timestamp).toLocaleString("pt-BR")}</p>
                <Button
                  variant="outline"
                  onClick={() => download(() => downloadCustomerReceipt(state, customer, r.id))}
                >
                  Recibo do recebimento
                </Button>
              </article>
            ))}
        </RecordList>
        {receiving && (
          <CustomerDebtPayment customer={customer} onClose={() => setReceiving(false)} />
        )}
      </div>
    );
  }
  const list = state.customers.filter(
    (c) =>
      customerMatches(c, query) &&
      (filter === "all" ||
        (filter === "open" && customerBalance(state, c.id) > 0) ||
        (filter === "late" &&
          state.receivables.some(
            (d) => d.customerId === c.id && d.balance > 0 && d.dueAt < today,
          ))),
  );
  return (
    <div className="space-y-3 customer-panel">
      <section className="pos-card customer-totals">
        <div>
          <span>Total a receber</span>
          <strong>{formatBRL(total)}</strong>
        </div>
        <div>
          <span>Vencidos</span>
          <strong className="management-error">{formatBRL(overdue)}</strong>
        </div>
      </section>
      <Button
        className="w-full"
        disabled={!canOperate(state, "sell")}
        onClick={() => setCreating(true)}
      >
        <UserPlus size={18} />
        Cadastrar cliente
      </Button>
      <label className="block text-sm font-medium" htmlFor="fiados-query">
        Buscar cliente
      </label>
      <div className="flex gap-2">
        <Input
          id="fiados-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome, código, CPF ou telefone"
          className="h-12 min-w-0"
        />
        {query && (
          <Button
            variant="outline"
            aria-label="Limpar busca de clientes"
            onClick={() => {
              setQuery("");
              document.getElementById("fiados-query")?.focus();
            }}
          >
            <X size={18} />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Filtrar clientes">
        {[
          ["open", "Com saldo"],
          ["late", "Vencidos"],
          ["all", "Todos os clientes"],
        ].map(([value, label]) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "outline"}
            aria-pressed={filter === value}
            onClick={() => setFilter(value!)}
          >
            {label}
          </Button>
        ))}
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {list.length} clientes encontrados
      </p>
      <RecordList
        empty={
          query
            ? "Nenhum cliente encontrado. Confira a busca."
            : filter === "all"
              ? "Cadastre o primeiro cliente para começar."
              : "Nenhum cliente com saldo neste filtro."
        }
      >
        {list.map((c) => (
          <button
            type="button"
            key={c.id}
            className="pos-card customer-list-item"
            onClick={() => setSelected(c.id)}
            aria-label={`Abrir cliente ${c.name} ${c.code ?? ""}`}
          >
            <span className="min-w-0">
              <strong className="block break-words">{c.name}</strong>
              <span className="block text-sm text-muted-foreground">
                {c.code} · {c.contact || "Sem contato"}
              </span>
              {c.active === false && <span className="block text-sm">Arquivado</span>}
            </span>
            <strong className="shrink-0">{formatBRL(customerBalance(state, c.id))}</strong>
          </button>
        ))}
      </RecordList>
    </div>
  );
}
