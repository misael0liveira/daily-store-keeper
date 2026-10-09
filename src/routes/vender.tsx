import { CustomerPicker } from "@/components/CustomerPicker";
import { PaymentSuccess } from "@/components/PaymentSuccess";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { downloadCustomerReceipt } from "@/lib/customerDocuments";
import { customerBalance, suggestedDueDate, validLocalDate } from "@/store/useStore";
import { decimal } from "@/lib/managementNumbers";
import { createFileRoute } from "@tanstack/react-router";
import { Barcode, Minus, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { PaymentSheet, type Confirmation } from "@/components/PaymentSheet";
import { Choice, ConfirmAction, Field, LocalForm } from "@/components/ManagementUI";
import { Link } from "@tanstack/react-router";
import { ProductPhoto } from "@/components/ProductPhoto";
import { ProductPrice } from "@/components/ProductPrice";
import { usePricingTime } from "@/hooks/usePricingTime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { beep, unlockAudio, vibrate } from "@/lib/feedback";
import { createPixTxid } from "@/lib/pix";
import {
  formatBRL,
  getProductPricing,
  quoteCart,
  saleItemsTotal,
  useStore,
  type PaymentMethod,
  money,
  type SaleItem,
} from "@/store/useStore";

export const Route = createFileRoute("/vender")({
  head: () => ({
    meta: [
      { title: "Vender — Mercadinho União" },
      {
        name: "description",
        content:
          "Frente de caixa do mini mercado: leia códigos de barras e finalize vendas rápido.",
      },
      { property: "og:title", content: "Vender — Mercadinho União" },
      {
        property: "og:description",
        content: "Frente de caixa mobile com leitura de código de barras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CaixaPage,
});

function CaixaPage() {
  const state = useStore();
  const { products, cart, addToCart, changeQty, checkout } = state;
  const [payOpen, setPayOpen] = useState(false);
  const [pixTxid, setPixTxid] = useState("");
  const [query, setQuery] = useState("");
  const now = usePricingTime();
  const [paymentQuote, setPaymentQuote] = useState<SaleItem[]>([]);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [creditMode, setCreditMode] = useState(false);
  const [entryRaw, setEntryRaw] = useState("0");
  const [entryTarget, setEntryTarget] = useState(0);
  const [creditDone, setCreditDone] = useState<{ paid: number; remaining: number } | null>(null);
  const [creditError, setCreditError] = useState("");
  const customer = state.customers.find((c) => c.id === state.currentCustomerId);

  const addProduct = (code: string) => {
    const product = products[code];
    if (product && product.active !== false) {
      try {
        addToCart(code);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível adicionar.");
        return;
      }
      beep(true);
      vibrate(60);
      toast.success(`${product.name} adicionado`, {
        description: formatBRL(getProductPricing(product).price),
      });
    } else {
      beep(false);
      vibrate([60, 40, 60]);
      toast.error("Produto não cadastrado", {
        description: `Código: ${code}`,
      });
    }
  };

  const handleScan = (code: string) => {
    if (code.startsWith("UNIAO:CLIENTE:")) {
      toast.info("Use Selecionar cliente → Ler QR do cliente para identificar o cadastro.");
      return;
    }
    addProduct(code);
  };

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Object.entries(products)
      .filter(
        ([code, p]) =>
          p.active !== false &&
          (code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, products]);

  const submitQuery = () => {
    const q = query.trim();
    if (!q) return;
    if (products[q]) {
      addProduct(q);
      setQuery("");
    } else {
      const first = suggestions.at(0);
      if (first) {
        addProduct(first[0]);
        setQuery("");
      }
    }
  };

  const total = saleItemsTotal(
    state.pendingPayments.length && state.pendingQuote
      ? state.pendingQuote
      : quoteCart(products, cart, now),
  );
  const received = money(state.pendingPayments.reduce((n, p) => n + p.amount, 0));
  const paymentTotal = creditMode
    ? money(entryTarget - received)
    : money(saleItemsTotal(paymentQuote) - received);

  const confirmPayment = (payload: Confirmation): boolean | "partial" | "collected" => {
    if (paymentTotal > 0)
      state.addPayment(
        {
          id: crypto.randomUUID(),
          method: payload.method,
          amount: payload.amount ?? paymentTotal,
          paidAmount: payload.paidAmount,
          change: payload.change,
          source: payload.source ?? "manual",
          reference: payload.reference,
          bank: payload.bank,
          confirmedAt: Date.now(),
        },
        paymentQuote,
      );
    if (creditMode) {
      const collected = money(
        useStore.getState().pendingPayments.reduce((n, p) => n + p.amount, 0),
      );
      if (collected < entryTarget) return "partial";
      setEntryRaw("0");
      setCreditOpen(true);
      return "collected";
    }
    if (
      money(useStore.getState().pendingPayments.reduce((n, p) => n + p.amount, 0)) <
      saleItemsTotal(paymentQuote)
    )
      return "partial";
    const sale = checkout({
      ...payload,
      quote: paymentQuote,
      ...(payload.method === "pix" ? { pixTxid } : {}),
    });
    if (!sale) {
      toast.error("O carrinho mudou. Feche o pagamento e tente novamente.");
      return false;
    }
    beep(true);
    vibrate(120);
    return true;
  };

  return (
    <div className="pdv-sell-page">
      <header className="pos-header">
        <h1>Caixa</h1>
        <Button
          variant="ghost"
          onClick={() => setOptionsOpen((v) => !v)}
          aria-expanded={optionsOpen}
        >
          Atendimento
        </Button>
      </header>
      <div className="pdv-sell-content space-y-3 px-4">
        {!state.cashOpen && (
          <div className="pos-card management-warning">
            Caixa fechado.{" "}
            <Link to="/gestao" search={{ sec: "caixa" }} className="underline">
              Abrir caixa
            </Link>
          </div>
        )}
        <section className="pos-card space-y-2">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="min-w-0 break-words">
              {customer ? `${customer.name} · ${customer.code ?? ""}` : "Venda sem cliente"}
            </span>
            <Button variant="outline" disabled={received > 0} onClick={() => setPickerOpen(true)}>
              Selecionar cliente
            </Button>
          </div>
          {customer && (
            <>
              <p className="text-sm text-muted-foreground">
                Saldo anterior {formatBRL(customerBalance(state, customer.id))}
                {customer.creditLimit !== undefined
                  ? ` · disponível ${formatBRL(Math.max(0, customer.creditLimit - customerBalance(state, customer.id)))}`
                  : ""}
              </p>
              {received === 0 && (
                <Button variant="ghost" onClick={() => state.selectCustomer()}>
                  Retirar cliente da venda
                </Button>
              )}
            </>
          )}
        </section>
        {optionsOpen && (
          <section className="pos-card space-y-4">
            <h2 className="font-semibold">Atendimento atual</h2>
            <Choice
              label="Cliente desta venda"
              disabled={received > 0}
              value={state.currentCustomerId ?? ""}
              onChange={(id) => {
                try {
                  state.selectCustomer(id || undefined);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Não foi possível selecionar.");
                }
              }}
              options={[
                { value: "", label: "Venda sem cliente" },
                ...state.customers
                  .filter((c) => c.active !== false)
                  .map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <LocalForm
              label="Guardar carrinho"
              disabled={!cart.length || Boolean(received)}
              onSave={() => {
                state.suspendCart(draftName);
                setDraftName("");
              }}
            >
              <Field label="Identificação do carrinho" value={draftName} onChange={setDraftName} />
            </LocalForm>
            <Link to="/gestao" search={{ sec: "atendimentos" }} className="text-primary underline">
              Ver atendimentos guardados
            </Link>
          </section>
        )}
        {received > 0 && (
          <section className="pos-card space-y-3">
            <h2 className="font-semibold">Pagamentos já recebidos: {formatBRL(received)}</h2>
            <p>Restante: {formatBRL(Math.max(0, total - received))}</p>
            {received >= total && (
              <Button
                onClick={() => {
                  try {
                    const sale = state.checkout({
                      method: state.pendingPayments[0]?.method ?? "dinheiro",
                      quote: state.pendingQuote ?? quoteCart(products, cart),
                    });
                    if (sale) toast.success("Venda concluída");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
                  }
                }}
              >
                Concluir venda com pagamentos recebidos
              </Button>
            )}
            <ConfirmAction
              label="Registrar devolução das parcelas"
              title="Os pagamentos foram devolvidos ao cliente?"
              description="Confira a devolução no banco ou em dinheiro. Esta ação registra a devolução local e libera o carrinho; não executa estorno bancário."
              onConfirm={() =>
                state.clearPendingPayment("Devolução conferida das parcelas do carrinho")
              }
            />
          </section>
        )}
        {!pickerOpen && !creditOpen && !creditDone && (
          <BarcodeScanner
            onScan={(code) => {
              unlockAudio();
              if (!payOpen && !pickerOpen && !creditOpen) handleScan(code);
            }}
          />
        )}

        <form
          noValidate
          className="pdv-product-search relative"
          onSubmit={(e) => {
            e.preventDefault();
            submitQuery();
          }}
        >
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome ou código"
            className="pos-search pl-12 pr-11"
            inputMode="search"
            aria-label="Digitar código ou nome do produto"
          />
          {query && (
            <button
              type="button"
              className="pos-search-clear"
              aria-label="Limpar busca"
              onClick={() => setQuery("")}
            >
              <X size={18} />
            </button>
          )}
        </form>

        {query.trim() !== "" && (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {suggestions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
            ) : (
              <ul className="divide-y">
                {suggestions.map(([code, p]) => (
                  <li key={code}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-muted"
                      onClick={() => {
                        addProduct(code);
                        setQuery("");
                      }}
                    >
                      <ProductPhoto photoId={p.photoId} name={p.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Cód. {code}</p>
                      </div>
                      <ProductPrice product={p} now={now} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="pdv-empty-cart flex flex-col items-center gap-3 py-8 text-center">
            <Barcode className="size-12 text-muted-foreground" />
            <p className="font-display text-2xl tracking-wide text-muted-foreground">
              Carrinho vazio
            </p>
            <p className="max-w-56 text-sm text-muted-foreground">
              Escaneie um produto ou digite o código/nome no campo acima.
            </p>
          </div>
        ) : (
          <section aria-label="Produtos da venda">
            <h2 className="mb-2 text-sm font-semibold">
              {cart.length} {cart.length === 1 ? "produto" : "produtos"}
            </h2>
            <ul className="pos-cart-list">
              {cart.map((item) => {
                const p = products[item.barcode];
                if (!p) return null;
                const pricing = getProductPricing(p, now);
                return (
                  <li key={item.barcode} className="pos-cart-row">
                    <ProductPhoto photoId={p.photoId} name={p.name} />
                    <div className="pos-cart-product">
                      <p>{p.name}</p>
                      <ProductPrice product={p} now={now} />
                      <span className="text-xs text-muted-foreground"> / {p.unit ?? "un"}</span>
                    </div>
                    <div className="pos-cart-amount">
                      <strong className="product-current-price">
                        {formatBRL(pricing.price * item.qty)}
                      </strong>
                      <div className="pos-quantity">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              changeQty(item.barcode, -Math.min(item.qty, 1));
                            } catch (e) {
                              toast.error(
                                e instanceof Error ? e.message : "Não foi possível alterar.",
                              );
                            }
                          }}
                          aria-label={item.qty === 1 ? `Remover ${p.name}` : `Diminuir ${p.name}`}
                        >
                          <Minus size={16} />
                        </button>
                        {(p.unit ?? "un") === "un" ? (
                          <span aria-live="polite">{item.qty}</span>
                        ) : (
                          <Input
                            aria-label={`Quantidade de ${p.name}`}
                            defaultValue={String(item.qty)}
                            key={`${item.barcode}-${item.qty}`}
                            inputMode="decimal"
                            className="w-20 h-9"
                            onBlur={(e) => {
                              try {
                                const qty = decimal(e.target.value);
                                if (!Number.isFinite(qty) || qty <= 0)
                                  throw new Error("Quantidade inválida.");
                                changeQty(item.barcode, qty - item.qty);
                              } catch (error) {
                                e.target.value = String(item.qty);
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : "Não foi possível alterar.",
                                );
                              }
                            }}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              changeQty(item.barcode, 1);
                            } catch (e) {
                              toast.error(
                                e instanceof Error ? e.message : "Não foi possível alterar.",
                              );
                            }
                          }}
                          aria-label={`Aumentar ${p.name}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      <div className="pdv-checkout-bar">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="font-display text-2xl font-bold text-primary">{formatBRL(total)}</span>
        </div>
        <Button
          className="pos-primary w-full"
          disabled={cart.length === 0 || !state.cashOpen || (received > 0 && received >= total)}
          onClick={() => {
            const quote =
              state.pendingPayments.length && state.pendingQuote
                ? state.pendingQuote
                : quoteCart(products, cart);
            const txid =
              state.pendingPayments.length && state.pendingPixTxid
                ? state.pendingPixTxid
                : createPixTxid();
            try {
              state.preparePayment(quote, txid);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Não foi possível abrir pagamento.");
              return;
            }
            setCreditMode(false);
            setPaymentQuote(quote);
            setPixTxid(txid);
            setPayOpen(true);
          }}
        >
          Pagamento
        </Button>
        <Button
          variant="outline"
          className="w-full mt-2"
          disabled={!cart.length || !state.cashOpen}
          onClick={() => {
            if (!customer) {
              setPickerOpen(true);
              toast.info("Selecione o cliente antes de registrar fiado.");
              return;
            }
            setEntryRaw("0");
            setDueAt(suggestedDueDate(customer.dueDay));
            setCreditError("");
            setCreditOpen(true);
          }}
        >
          Pagar parte e fiar o restante
        </Button>
      </div>

      <PaymentSheet
        open={payOpen}
        onOpenChange={setPayOpen}
        total={paymentTotal}
        pixTxid={pixTxid}
        onConfirm={confirmPayment}
        previousMethod={!creditMode ? state.pendingPayments.at(-1)?.method : undefined}
        contextTitle={creditMode ? `Entrada da compra · ${customer?.name ?? "Cliente"}` : undefined}
      />
      {pickerOpen && (
        <CustomerPicker
          onClose={() => setPickerOpen(false)}
          onSelect={(c) => {
            try {
              state.selectCustomer(c.id);
              setDueAt(suggestedDueDate(c.dueDay));
              setPickerOpen(false);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Não foi possível selecionar.");
            }
          }}
        />
      )}
      <Sheet
        open={creditOpen && !payOpen}
        onOpenChange={(v) => {
          setCreditOpen(v);
          setCreditError("");
        }}
      >
        <SheetContent side="bottom" className="customer-sheet">
          <SheetTitle>Compra com fiado — {customer?.name}</SheetTitle>
          <SheetDescription>
            Confira a entrada recebida, o vencimento e o saldo antes de registrar a venda.
          </SheetDescription>
          <div className="space-y-4">
            <p>
              Total da compra <strong>{formatBRL(total)}</strong> · pago{" "}
              <strong>{formatBRL(received)}</strong>
            </p>
            <Field
              label="Valor a receber agora (R$)"
              value={entryRaw}
              onChange={setEntryRaw}
              inputMode="decimal"
            />
            <Field
              label="Vencimento do fiado"
              value={dueAt}
              onChange={setDueAt}
              type="date"
              required
            />
            <p>
              Saldo desta compra{" "}
              <strong>
                {formatBRL(
                  money(
                    total - received - (Number.isFinite(decimal(entryRaw)) ? decimal(entryRaw) : 0),
                  ),
                )}
              </strong>
            </p>
            <p>
              Saldo anterior{" "}
              <strong>{formatBRL(customer ? customerBalance(state, customer.id) : 0)}</strong>
            </p>
            <p>
              Novo saldo do cliente{" "}
              <strong>
                {formatBRL(
                  money(
                    (customer ? customerBalance(state, customer.id) : 0) +
                      total -
                      received -
                      (Number.isFinite(decimal(entryRaw)) ? decimal(entryRaw) : 0),
                  ),
                )}
              </strong>
            </p>
            {creditError && (
              <p role="alert" className="management-error">
                {creditError}
              </p>
            )}
            <Button
              className="w-full"
              onClick={() => {
                try {
                  const entry = entryRaw.trim() ? decimal(entryRaw) : 0;
                  const remaining = money(total - received - entry);
                  if (!customer || customer.active === false || customer.creditEnabled === false)
                    throw new Error("Selecione um cliente com fiado habilitado.");
                  if (!Number.isFinite(entry) || entry < 0 || remaining < 0)
                    throw new Error("Confira o valor da entrada.");
                  if (remaining > 0 && !validLocalDate(dueAt))
                    throw new Error("Informe um vencimento válido.");
                  if (
                    customer.creditLimit !== undefined &&
                    money(customerBalance(state, customer.id) + remaining) > customer.creditLimit
                  )
                    throw new Error("O novo saldo ultrapassa o limite de fiado.");
                  const quote =
                    state.pendingPayments.length && state.pendingQuote
                      ? state.pendingQuote
                      : quoteCart(products, cart);
                  if (entry > 0) {
                    const txid =
                      state.pendingPayments.length && state.pendingPixTxid
                        ? state.pendingPixTxid
                        : createPixTxid();
                    state.preparePayment(quote, txid);
                    setPaymentQuote(quote);
                    setPixTxid(txid);
                    setEntryTarget(money(received + entry));
                    setCreditMode(true);
                    setCreditOpen(false);
                    setPayOpen(true);
                    return;
                  }
                  const sale = state.checkout({
                    method: state.pendingPayments[0]?.method ?? "dinheiro",
                    quote,
                    payments: state.pendingPayments,
                    customerId: customer.id,
                    creditDueAt: dueAt,
                  });
                  if (!sale) throw new Error("Carrinho mudou. Confira os itens.");
                  setCreditOpen(false);
                  setCreditDone({ paid: received, remaining });
                  void downloadCustomerReceipt(
                    useStore.getState(),
                    customer,
                    undefined,
                    sale,
                  ).catch(() =>
                    toast.info(
                      "Venda salva. O comprovante pode ser gerado pelo extrato do cliente.",
                    ),
                  );
                } catch (e) {
                  setCreditError(e instanceof Error ? e.message : "Não foi possível registrar.");
                }
              }}
            >
              {entryRaw.trim() && decimal(entryRaw) > 0
                ? "Receber entrada"
                : money(total - received) > 0
                  ? "Registrar venda com fiado"
                  : "Registrar venda paga"}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setCreditOpen(false)}>
              Voltar ao carrinho
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      {creditDone && (
        <Sheet open>
          <SheetContent
            side="bottom"
            className="payment-sheet"
            showCloseButton={false}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <SheetTitle className="sr-only">Venda registrada</SheetTitle>
            <SheetDescription className="sr-only">
              O saldo foi registrado no extrato do cliente.
            </SheetDescription>
            <PaymentSuccess
              amount={creditDone.paid}
              bank={undefined}
              heading="Venda registrada"
              detail={
                creditDone.remaining > 0
                  ? `${formatBRL(creditDone.remaining)} em aberto`
                  : "Compra totalmente paga"
              }
              onDone={() => setCreditDone(null)}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
