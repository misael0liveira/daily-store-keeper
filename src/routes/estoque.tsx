import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Plus, PackageOpen, Save, ScanBarcode, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { beep, unlockAudio, vibrate } from "@/lib/feedback";
import { syncPendingSales } from "@/lib/sync";
import { formatBRL, useStore } from "@/store/useStore";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — Mini Mercado PDV" },
      {
        name: "description",
        content: "Cadastre, edite e exclua produtos do estoque do mini mercado.",
      },
      { property: "og:title", content: "Estoque — Mini Mercado PDV" },
      {
        property: "og:description",
        content: "Gestão de produtos com leitura de código de barras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstoquePage,
});

function EstoquePage() {
  const { products, upsertProduct, deleteProduct } = useStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [lowOnly, setLowOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [search, setSearch] = useState("");

  const existing = barcode.trim() ? products[barcode.trim()] : undefined;
  const list = useMemo(() => {
    const all = Object.values(products).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const q = search.trim().toLowerCase();
    return all.filter(
      (p) =>
        (!lowOnly || p.stock <= 5) &&
        (!q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)),
    );
  }, [products, search, lowOnly]);

  const handleScan = (code: string) => {
    setBarcode(code);
    const p = products[code];
    if (p) {
      setName(p.name);
      setPrice(String(p.price));
      setStock(String(p.stock));
      toast.info("Produto já cadastrado", {
        description: "Os dados atuais foram carregados para edição.",
      });
    } else {
      setName("");
      setPrice("");
      setStock("");
      toast.success("Novo código lido", { description: code });
    }
    beep(true);
    vibrate(60);
    setScannerOpen(false);
  };

  const save = async () => {
    if (saving) return;
    const code = barcode.trim();
    const priceNum = Number(String(price).replace(",", "."));
    const stockNum = Number(stock);
    if (!code || !name.trim() || !price || !stock) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("Preço inválido");
      return;
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      toast.error("Quantidade inválida");
      return;
    }

    setSaving(true);
    try {
      upsertProduct({ barcode: code, name: name.trim(), price: priceNum, stock: stockNum });

      // Persistimos localmente primeiro e, logo depois, enviamos o estado atualizado para o Supabase.
      const state = useStore.getState();
      const result = await syncPendingSales(state.sales, state.products);
      if (result.status === "error") {
        toast.warning("Produto salvo neste aparelho", {
          description:
            "Não foi possível sincronizar agora. Tentaremos novamente quando houver conexão.",
        });
      } else if (result.status === "offline") {
        toast.info("Produto salvo offline", {
          description: "Será sincronizado quando a conexão voltar.",
        });
      } else {
        toast.success(
          existing ? "Produto atualizado e sincronizado!" : "Produto cadastrado e sincronizado!",
          { description: name.trim() },
        );
      }

      setEditorOpen(false);
      setScannerOpen(false);
      setBarcode("");
      setName("");
      setPrice("");
      setStock("");
    } catch {
      toast.error("Não foi possível concluir o envio", {
        description: "Confira os dados salvos neste aparelho antes de tentar novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!existing) return;
    {
      deleteProduct(existing.barcode);
      toast.success("Produto excluído", { description: existing.name });
      setEditorOpen(false);
      setScannerOpen(false);
    }
  };

  const loadProduct = (code: string) => {
    const p = products[code];
    if (!p) return;
    setBarcode(p.barcode);
    setName(p.name);
    setPrice(String(p.price));
    setStock(String(p.stock));
    setEditorOpen(true);
  };

  return (
    <div className="pos-page pos-stock">
      <header className="pos-header">
        <h1>Estoque</h1>
        <Button
          variant="ghost"
          className="text-primary px-0"
          onClick={() => {
            setBarcode("");
            setName("");
            setPrice("");
            setStock("");
            setEditorOpen(true);
          }}
        >
          <Plus size={18} />
          Cadastrar
        </Button>
      </header>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome ou código"
          aria-label="Buscar no estoque"
          className="pos-search pl-10"
        />
      </div>
      <div className="pos-filters" aria-label="Filtrar estoque">
        <button aria-pressed={!lowOnly} onClick={() => setLowOnly(false)}>
          Todos
        </button>
        <button aria-pressed={lowOnly} onClick={() => setLowOnly(true)}>
          Estoque baixo
        </button>
      </div>
      {list.length === 0 ? (
        <div className="pos-empty py-12 text-center">
          <PackageOpen className="mx-auto mb-3 size-9" />
          <p>
            {search ? "Nenhum produto encontrado" : lowOnly ? "Estoque em dia" : "Estoque vazio"}
          </p>
          <p className="text-sm">
            {search
              ? "Tente outro nome ou código."
              : lowOnly
                ? "Nenhum produto precisa de reposição."
                : "Toque em Cadastrar para começar."}
          </p>
        </div>
      ) : (
        <ul className="pos-stock-list">
          {list.map((p) => (
            <li key={p.barcode}>
              <button onClick={() => loadProduct(p.barcode)}>
                <span>
                  <strong>{p.name}</strong>
                  <span className="pos-stock-detail">
                    {formatBRL(p.price)} ·{" "}
                    <span className={p.stock <= 5 ? "pos-low-stock" : ""}>{p.stock} un.</span>
                  </span>
                </span>
                <ChevronRight size={19} className="text-muted-foreground shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Sheet
        open={editorOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setEditorOpen(open);
            if (!open) setScannerOpen(false);
          }
        }}
      >
        <SheetContent side="bottom" className="pos-product-sheet">
          <SheetHeader>
            <SheetTitle>{existing ? "Editar produto" : "Cadastrar produto"}</SheetTitle>
            <SheetDescription>Informe o código, preço e quantidade em estoque.</SheetDescription>
          </SheetHeader>
          {scannerOpen ? (
            <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
          ) : (
            <Button
              variant="outline"
              className="h-14 w-full gap-3 text-lg"
              onClick={() => {
                unlockAudio();
                setScannerOpen(true);
              }}
            >
              <ScanBarcode className="size-6" />
              Ler produto com a câmera
            </Button>
          )}
          <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de barras</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => {
                  const code = e.target.value;
                  setBarcode(code);
                  const p = products[code.trim()];
                  if (p) {
                    setName(p.name);
                    setPrice(String(p.price));
                    setStock(String(p.stock));
                  }
                }}
                placeholder="Ex.: 7891234567890"
                inputMode="numeric"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do produto</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Arroz 5kg"
                className="h-12 text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Quantidade</Label>
                <Input
                  id="stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                  className="h-12 text-base"
                />
              </div>
            </div>
            <Button className="h-14 w-full gap-2 text-lg" disabled={saving} onClick={save}>
              <Save className="size-5" />
              {saving ? "Salvando…" : existing ? "Atualizar produto" : "Cadastrar produto"}
            </Button>
            {existing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={saving} variant="destructive" className="h-12 w-full gap-2">
                    <Trash2 className="size-5" />
                    Excluir produto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Excluir {existing.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O produto será removido do estoque e do carrinho. Esta ação não pode ser
                    desfeita.
                  </AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={remove}>Excluir produto</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
