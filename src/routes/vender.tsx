import { createFileRoute } from "@tanstack/react-router";
import { Barcode, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { PaymentSheet } from "@/components/PaymentSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { beep, unlockAudio, vibrate } from "@/lib/feedback";
import {
  PAYMENT_LABELS,
  formatBRL,
  useStore,
  type PaymentMethod,
} from "@/store/useStore";

export const Route = createFileRoute("/vender")({
  head: () => ({
    meta: [
      { title: "Vender — Mini Market POS" },
      {
        name: "description",
        content:
          "Frente de caixa do mini mercado: leia códigos de barras e finalize vendas rápido.",
      },
      { property: "og:title", content: "Vender — Mini Market POS" },
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
  const { products, cart, addToCart, changeQty, removeFromCart, checkout } =
    useStore();
  const [scannerOpen, setScannerOpen] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [query, setQuery] = useState("");

  const addProduct = (code: string) => {
    const product = products[code];
    if (product) {
      addToCart(code);
      beep(true);
      vibrate(60);
      toast.success(`${product.name} adicionado`, {
        description: formatBRL(product.price),
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
          code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
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

  const total = cart.reduce((sum, item) => {
    const p = products[item.barcode];
    return sum + (p ? p.price * item.qty : 0);
  }, 0);

  const confirmPayment = (payload: {
    method: PaymentMethod;
    paidAmount?: number;
    change?: number;
  }) => {
    const sale = checkout(payload);
    if (!sale) return;
    setPayOpen(false);
    beep(true);
    vibrate(120);
    toast.success("Venda registrada!", {
      description:
        sale.change && sale.change > 0
          ? `${PAYMENT_LABELS[sale.method]} · Troco ${formatBRL(sale.change)}`
          : `${PAYMENT_LABELS[sale.method]} · ${formatBRL(sale.total)}`,
    });
  };

  return (
    <div className="pdv-sell-page flex min-h-dvh flex-col">
      <header className="pdv-sell-topbar bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center px-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/75">Frente de caixa</p>
            <h1 className="text-lg font-black">Vender (Caixa)</h1>
          </div>
        </div>
      </header>
      <div className="pdv-sell-content flex-1 space-y-4 px-4 pb-44 pt-4">
        <BarcodeScanner
          onScan={(code) => {
            unlockAudio();
            handleScan(code);
          }}
          onClose={() => setScannerOpen(false)}
        />

        <form
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
            placeholder="Digitar código ou nome do produto"
            className="h-13 rounded-2xl pl-12 text-base"
            inputMode="search"
            aria-label="Digitar código ou nome do produto"
          />
        </form>

        {query.trim() !== "" && (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {suggestions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Nenhum produto encontrado.
              </p>
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
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Cód. {code}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-primary">
                        {formatBRL(p.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="pdv-empty-cart flex flex-col items-center gap-3 py-16 text-center">
            <Barcode className="size-12 text-muted-foreground" />
            <p className="font-display text-2xl tracking-wide text-muted-foreground">
              Carrinho vazio
            </p>
            <p className="max-w-56 text-sm text-muted-foreground">
              Escaneie um produto ou digite o código/nome no campo acima.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cart.map((item) => {
              const p = products[item.barcode];
              if (!p) return null;
              return (
                <li
                  key={item.barcode}
                  className="pdv-cart-item flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatBRL(p.price)} un.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-11"
                      onClick={() => changeQty(item.barcode, -1)}
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="size-5" />
                    </Button>
                    <span className="w-8 text-center text-lg font-semibold">
                      {item.qty}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-11"
                      onClick={() => changeQty(item.barcode, 1)}
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 text-destructive"
                      onClick={() => removeFromCart(item.barcode)}
                      aria-label={`Remover ${p.name}`}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="pdv-checkout-bar fixed inset-x-0 bottom-16 z-20 border-t bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total da compra
          </span>
          <span className="font-display text-3xl tracking-wide text-primary">
            {formatBRL(total)}
          </span>
        </div>
        <Button
          className="h-14 w-full text-lg"
          disabled={cart.length === 0}
          onClick={() => setPayOpen(true)}
        >
          Finalizar Compra
        </Button>
      </div>

      <PaymentSheet
        open={payOpen}
        onOpenChange={setPayOpen}
        total={total}
        onConfirm={confirmPayment}
      />
    </div>
  );
}
