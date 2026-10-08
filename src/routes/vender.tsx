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
  const paymentTotal = money(saleItemsTotal(paymentQuote) - received);

  const confirmPayment = (payload: Confirmation): boolean | "partial" => {
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
        {optionsOpen && (
          <section className="pos-card space-y-4">
            <h2 className="font-semibold">Atendimento atual</h2>
            <Choice
              label="Cliente desta venda"
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
            <LocalForm
              label="Registrar saldo como fiado"
              disabled={!cart.length || !state.currentCustomerId}
              success="Venda registrada com saldo a receber"
              onSave={() => {
                const quote = state.pendingQuote ?? quoteCart(products, cart);
                const sale = state.checkout({
                  method: state.pendingPayments[0]?.method ?? "dinheiro",
                  quote,
                  payments: state.pendingPayments,
                  customerId: state.currentCustomerId,
                  creditDueAt: dueAt,
                });
                if (!sale) throw new Error("Carrinho mudou. Confira os itens.");
                setDueAt("");
              }}
            >
              <Field
                label="Vencimento do fiado"
                value={dueAt}
                onChange={setDueAt}
                type="date"
                required
              />
              <p className="text-sm text-muted-foreground">
                Exige cliente. O saldo não recebido fica registrado como dívida.
              </p>
            </LocalForm>
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
        <BarcodeScanner
          onScan={(code) => {
            unlockAudio();
            if (!payOpen) handleScan(code);
          }}
        />

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
            setPaymentQuote(quote);
            setPixTxid(txid);
            setPayOpen(true);
          }}
        >
          Ir para pagamento
        </Button>
      </div>

      <PaymentSheet
        open={payOpen}
        onOpenChange={setPayOpen}
        total={paymentTotal}
        pixTxid={pixTxid}
        onConfirm={confirmPayment}
      />
    </div>
  );
}
