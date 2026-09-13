import { createFileRoute } from "@tanstack/react-router";
import { Barcode, Minus, Plus, ScanBarcode, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { beep, vibrate } from "@/lib/feedback";
import { formatBRL, useStore } from "@/store/useStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caixa — Mini Mercado PDV" },
      {
        name: "description",
        content:
          "Frente de caixa do mini mercado: leia códigos de barras e finalize vendas rápido.",
      },
      { property: "og:title", content: "Caixa — Mini Mercado PDV" },
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [paidRaw, setPaidRaw] = useState("");

  const paidValue = Number(paidRaw.replace(",", "."));
  const paid = paidRaw.trim() === "" || Number.isNaN(paidValue) ? null : paidValue;

  const handleScan = (code: string) => {
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

  const total = cart.reduce((sum, item) => {
    const p = products[item.barcode];
    return sum + (p ? p.price * item.qty : 0);
  }, 0);

  const finish = () => {
    if (cart.length === 0) return;
    checkout();
    beep(true);
    vibrate(120);
    toast.success("Compra finalizada!", {
      description: `Total: ${formatBRL(total)}`,
    });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 space-y-4 px-4 pb-48 pt-4">
        {scannerOpen ? (
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setScannerOpen(false)}
          />
        ) : (
          <Button
            className="h-14 w-full gap-3 text-lg"
            onClick={() => setScannerOpen(true)}
          >
            <ScanBarcode className="size-6" />
            Abrir leitor de código
          </Button>
        )}

        {cart.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Barcode className="size-12 text-muted-foreground" />
            <p className="font-display text-2xl tracking-wide text-muted-foreground">
              Carrinho vazio
            </p>
            <p className="max-w-56 text-sm text-muted-foreground">
              Abra o leitor e escaneie um produto para começar a venda.
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
                  className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm"
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

      <div className="fixed inset-x-0 bottom-16 z-20 border-t bg-card/95 px-4 py-3 backdrop-blur">
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
          onClick={finish}
        >
          Finalizar Compra
        </Button>
      </div>
    </div>
  );
}
