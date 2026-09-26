import { createFileRoute } from "@tanstack/react-router";
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  ChevronRight,
  LoaderCircle,
  Plus,
  PackageOpen,
  Save,
  ScanBarcode,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { lookupFoodProductByBarcode } from "@/lib/openFoodFacts";
import { formatBRL, useStore } from "@/store/useStore";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — Mercadinho União" },
      {
        name: "description",
        content: "Cadastre, edite e exclua produtos do estoque do mini mercado.",
      },
      { property: "og:title", content: "Estoque — Mercadinho União" },
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
  const [brand, setBrand] = useState("");
  const [packageSize, setPackageSize] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [search, setSearch] = useState("");
  const [lookupStatus, setLookupStatus] = useState<
    "idle" | "loading" | "found" | "not-found" | "error"
  >("idle");
  const lookupRequestRef = useRef(0);
  const lastScanRef = useRef<string | null>(null);

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

  const lookupProduct = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      setLookupStatus("error");
      return;
    }

    const requestId = ++lookupRequestRef.current;
    setLookupStatus("loading");

    try {
      const result = await lookupFoodProductByBarcode(code);
      if (requestId !== lookupRequestRef.current) return;
      if (!result) {
        setLookupStatus("not-found");
        return;
      }

      setName(result.name);
      setBrand(result.brand ?? "");
      setPackageSize(result.packageSize ?? "");
      setLookupStatus("found");
    } catch {
      if (requestId === lookupRequestRef.current) setLookupStatus("error");
    }
  }, []);

  const handleScan = useCallback(
    (code: string) => {
      if (lastScanRef.current === code) return;
      lastScanRef.current = code;
      lookupRequestRef.current += 1;
      setLookupStatus("idle");
      setBarcode(code);
      const p = products[code];
      if (p) {
        setName(p.name);
        setBrand(p.brand ?? "");
        setPackageSize(p.packageSize ?? "");
        setPrice(String(p.price));
        setStock(String(p.stock));
        setLookupStatus("idle");
        toast.info("Produto já cadastrado", {
          description: "Os dados atuais foram carregados para edição.",
        });
      } else {
        setName("");
        setBrand("");
        setPackageSize("");
        setPrice("");
        setStock("");
        toast.success("Novo código lido", { description: code });
        void lookupProduct(code);
      }
      beep(true);
      vibrate(60);
    },
    [lookupProduct, products],
  );

  const save = () => {
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
      upsertProduct({
        barcode: code,
        name: name.trim(),
        price: priceNum,
        stock: stockNum,
        ...(brand.trim() ? { brand: brand.trim() } : {}),
        ...(packageSize.trim() ? { packageSize: packageSize.trim() } : {}),
        ...(lookupStatus === "found" || existing?.catalogSource === "open-food-facts"
          ? { catalogSource: "open-food-facts" as const }
          : {}),
      });
      toast.success(existing ? "Produto atualizado" : "Produto cadastrado", {
        description: `${name.trim()} foi salvo neste aparelho.`,
      });

      setEditorOpen(false);
      setScannerOpen(false);
      setBarcode("");
      setName("");
      setBrand("");
      setPackageSize("");
      setPrice("");
      setStock("");
      setLookupStatus("idle");
      lookupRequestRef.current += 1;
      lastScanRef.current = null;
    } catch {
      toast.error("Não foi possível salvar o produto", {
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
      lookupRequestRef.current += 1;
    }
  };

  const loadProduct = (code: string) => {
    const p = products[code];
    if (!p) return;
    setBarcode(p.barcode);
    setName(p.name);
    setBrand(p.brand ?? "");
    setPackageSize(p.packageSize ?? "");
    setPrice(String(p.price));
    setStock(String(p.stock));
    setLookupStatus("idle");
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
            setBrand("");
            setPackageSize("");
            setPrice("");
            setStock("");
            setLookupStatus("idle");
            lookupRequestRef.current += 1;
            lastScanRef.current = null;
            unlockAudio();
            setScannerOpen(true);
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
          className="pos-search pl-10 pr-11"
        />
        {search && (
          <button
            type="button"
            className="pos-search-clear"
            aria-label="Limpar busca"
            onClick={() => setSearch("")}
          >
            <X size={18} />
          </button>
        )}
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
            {search
              ? "Nenhum produto encontrado"
              : Object.keys(products).length === 0
                ? "Nenhum produto cadastrado"
                : "Nenhum produto com estoque baixo"}
          </p>
          <p className="text-sm">
            {search
              ? "Tente outro nome ou código."
              : Object.keys(products).length === 0
                ? "Toque em Cadastrar para começar."
                : "Nenhum produto precisa de reposição."}
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
                  {(p.brand || p.packageSize) && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {[p.brand, p.packageSize].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  {p.catalogSource === "open-food-facts" && (
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      Dados: Open Food Facts
                    </span>
                  )}
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
            if (!open) {
              lookupRequestRef.current += 1;
              lastScanRef.current = null;
            }
          }
        }}
      >
        <SheetContent side="bottom" className="pos-product-sheet">
          <SheetHeader>
            <SheetTitle>{existing ? "Editar produto" : "Cadastrar produto"}</SheetTitle>
            <SheetDescription>
              Escaneie para buscar nome, marca e embalagem. Preço e quantidade continuam manuais.
            </SheetDescription>
          </SheetHeader>
          {scannerOpen ? (
            <BarcodeScanner onScan={handleScan} />
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
                  lookupRequestRef.current += 1;
                  lastScanRef.current = null;
                  setLookupStatus("idle");
                  const p = products[code.trim()];
                  if (p) {
                    setName(p.name);
                    setBrand(p.brand ?? "");
                    setPackageSize(p.packageSize ?? "");
                    setPrice(String(p.price));
                    setStock(String(p.stock));
                  } else {
                    setName("");
                    setBrand("");
                    setPackageSize("");
                    setPrice("");
                    setStock("");
                  }
                }}
                placeholder="Ex.: 7891234567890"
                inputMode="numeric"
                className="h-12 text-base"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full gap-2"
                disabled={!barcode.trim() || lookupStatus === "loading"}
                onClick={() => void lookupProduct(barcode)}
              >
                {lookupStatus === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                {lookupStatus === "loading"
                  ? "Consultando produto…"
                  : lookupStatus === "not-found" || lookupStatus === "error"
                    ? "Buscar novamente"
                    : "Buscar dados online"}
              </Button>
              <div aria-live="polite" role={lookupStatus === "error" ? "alert" : "status"}>
                {lookupStatus === "found" && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      Dados encontrados. Confira nome, marca e embalagem antes de salvar. Fonte:
                      Open Food Facts.
                    </span>
                  </p>
                )}
                {lookupStatus === "not-found" && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CircleHelp className="mt-0.5 size-4 shrink-0" />
                    Produto não encontrado. Você pode preencher os dados manualmente.
                  </p>
                )}
                {lookupStatus === "error" && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                    Não foi possível consultar. Confira a conexão ou continue manualmente.
                  </p>
                )}
              </div>
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
                <Label htmlFor="brand">Marca (opcional)</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex.: União"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageSize">Embalagem (opcional)</Label>
                <Input
                  id="packageSize"
                  value={packageSize}
                  onChange={(e) => setPackageSize(e.target.value)}
                  placeholder="Ex.: 1 kg"
                  className="h-12 text-base"
                />
              </div>
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
