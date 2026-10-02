import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronRight,
  LoaderCircle,
  Plus,
  PackageOpen,
  Save,
  ScanBarcode,
  ScanText,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ProductPhoto } from "@/components/ProductPhoto";
import { ProductPhotoEditor } from "@/components/ProductPhotoEditor";
import { deleteProductPhoto, saveProductPhoto } from "@/lib/productPhotos";
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
import { readTextFromStockCamera, suggestProductFieldsFromText } from "@/lib/offlineOcr";
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
  const [photoDraft, setPhotoDraft] = useState<Blob | null | undefined>(undefined);
  const [photoBusy, setPhotoBusy] = useState(false);
  const savingRef = useRef(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [packageSize, setPackageSize] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [search, setSearch] = useState("");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "found" | "empty" | "error">(
    "idle",
  );
  const [ocrError, setOcrError] = useState("");
  const ocrRequestRef = useRef(0);
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

  const readPackageText = useCallback(async () => {
    const requestId = ++ocrRequestRef.current;
    setOcrStatus("loading");
    setOcrError("");
    try {
      const text = await readTextFromStockCamera();
      if (requestId !== ocrRequestRef.current) return;
      if (!text) {
        setOcrStatus("empty");
        return;
      }

      const suggestions = suggestProductFieldsFromText(text);
      if (suggestions.name) setName(suggestions.name);
      if (suggestions.packageSize) setPackageSize(suggestions.packageSize);
      if (!suggestions.name && !suggestions.packageSize) {
        setOcrStatus("empty");
        return;
      }

      setOcrStatus("found");
      toast.success("Texto lido", { description: "Confira as sugestões antes de salvar." });
    } catch (error) {
      if (requestId !== ocrRequestRef.current) return;
      setOcrError(
        error instanceof Error
          ? error.message
          : "Não foi possível ler o texto. Tente novamente ou continue manualmente.",
      );
      setOcrStatus("error");
    }
  }, []);

  const handleScan = useCallback(
    (code: string) => {
      if (savingRef.current || lastScanRef.current === code) return;
      setPhotoDraft(undefined);
      setPhotoBusy(false);
      lastScanRef.current = code;
      ocrRequestRef.current += 1;
      setOcrStatus("idle");
      setOcrError("");
      setBarcode(code);
      const p = products[code];
      if (p) {
        setName(p.name);
        setBrand(p.brand ?? "");
        setPackageSize(p.packageSize ?? "");
        setPrice(String(p.price));
        setStock(String(p.stock));
        toast.info("Produto já cadastrado", {
          description: "Os dados atuais foram carregados para edição.",
        });
      } else {
        setOcrStatus("loading");
        setOcrError("");
        setName("");
        setBrand("");
        setPackageSize("");
        setPrice("");
        setStock("");
        toast.success("Código lido", {
          description:
            "A câmera vai tentar ler o nome e o peso. Confira as sugestões antes de salvar.",
        });
        const requestId = ocrRequestRef.current;
        window.setTimeout(() => {
          if (requestId === ocrRequestRef.current) void readPackageText();
        }, 700);
      }
      beep(true);
      vibrate(60);
    },
    [products, readPackageText],
  );

  const save = async () => {
    if (savingRef.current || photoBusy) return;
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

    savingRef.current = true;
    setSaving(true);
    ocrRequestRef.current += 1;
    let newPhotoId: string | undefined;
    try {
      const photoId =
        photoDraft instanceof Blob
          ? (newPhotoId = await saveProductPhoto(photoDraft))
          : photoDraft === null
            ? undefined
            : existing?.photoId;
      upsertProduct({
        barcode: code,
        name: name.trim(),
        price: priceNum,
        stock: stockNum,
        ...(photoId ? { photoId } : {}),
        ...(brand.trim() ? { brand: brand.trim() } : {}),
        ...(packageSize.trim() ? { packageSize: packageSize.trim() } : {}),
      });
      if (existing?.photoId && existing.photoId !== photoId) {
        void deleteProductPhoto(existing.photoId).catch(() => {});
      }
      setPhotoDraft(undefined);
      setPhotoBusy(false);
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
      setOcrStatus("idle");
      setOcrError("");
      ocrRequestRef.current += 1;
      lastScanRef.current = null;
    } catch (error) {
      if (newPhotoId && useStore.getState().products[code]?.photoId !== newPhotoId) {
        void deleteProductPhoto(newPhotoId).catch(() => {});
      }
      toast.error("Não foi possível salvar o produto", {
        description:
          error instanceof Error ? error.message : "Confira o espaço livre e tente novamente.",
      });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const remove = () => {
    if (!existing) return;
    {
      deleteProduct(existing.barcode);
      if (existing.photoId) void deleteProductPhoto(existing.photoId).catch(() => {});
      setPhotoDraft(undefined);
      setPhotoBusy(false);
      toast.success("Produto excluído", { description: existing.name });
      setEditorOpen(false);
      setScannerOpen(false);
    }
  };

  const loadProduct = (code: string) => {
    const p = products[code];
    if (!p) return;
    setPhotoDraft(undefined);
    setPhotoBusy(false);
    setBarcode(p.barcode);
    setName(p.name);
    setBrand(p.brand ?? "");
    setPackageSize(p.packageSize ?? "");
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
            setPhotoDraft(undefined);
            setPhotoBusy(false);
            setBarcode("");
            setName("");
            setBrand("");
            setPackageSize("");
            setPrice("");
            setStock("");
            setOcrStatus("idle");
            setOcrError("");
            ocrRequestRef.current += 1;
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
              <button onClick={() => loadProduct(p.barcode)} className="gap-3">
                {p.photoId && <ProductPhoto photoId={p.photoId} />}
                <span className="min-w-0 flex-1">
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
          if (!savingRef.current) {
            setEditorOpen(open);
            if (!open) setScannerOpen(false);
            if (!open) {
              setPhotoDraft(undefined);
              setPhotoBusy(false);
              ocrRequestRef.current += 1;
              lastScanRef.current = null;
            }
          }
        }}
      >
        <SheetContent side="bottom" className="pos-product-sheet">
          <SheetHeader>
            <SheetTitle>{existing ? "Editar produto" : "Cadastrar produto"}</SheetTitle>
            <SheetDescription>
              Escaneie o código para tentar ler o nome e o peso da embalagem. Confira o resultado;
              preço e quantidade continuam manuais.
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
          {scannerOpen && !existing && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full gap-2"
                disabled={saving || ocrStatus === "loading"}
                onClick={() => void readPackageText()}
                aria-busy={ocrStatus === "loading"}
              >
                {ocrStatus === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <ScanText className="size-4" />
                )}
                {ocrStatus === "loading" ? "Lendo texto no aparelho…" : "Ler novamente"}
              </Button>
              <div aria-live="polite" role={ocrStatus === "error" ? "alert" : "status"}>
                {ocrStatus === "found" && (
                  <p className="text-sm text-muted-foreground">
                    Sugestões preenchidas pela câmera. Confira e corrija antes de salvar.
                  </p>
                )}
                {ocrStatus === "empty" && (
                  <p className="text-sm text-muted-foreground">
                    Não encontramos texto legível. Aproxime o nome e o peso da câmera e tente
                    novamente.
                  </p>
                )}
                {ocrStatus === "error" && <p className="text-sm text-destructive">{ocrError}</p>}
              </div>
            </div>
          )}
          <fieldset
            disabled={saving}
            className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm"
          >
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de barras</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => {
                  const code = e.target.value;
                  setPhotoDraft(undefined);
                  setPhotoBusy(false);
                  setBarcode(code);
                  lastScanRef.current = null;
                  setOcrStatus("idle");
                  setOcrError("");
                  ocrRequestRef.current += 1;
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do produto</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  ocrRequestRef.current += 1;
                  setOcrStatus("idle");
                  setOcrError("");
                  setName(e.target.value);
                }}
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
                  onChange={(e) => {
                    ocrRequestRef.current += 1;
                    setOcrStatus("idle");
                    setOcrError("");
                    setPackageSize(e.target.value);
                  }}
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
            <ProductPhotoEditor
              key={barcode}
              barcode={barcode}
              name={name}
              brand={brand}
              packageSize={packageSize}
              photoId={existing?.photoId}
              value={photoDraft}
              onChange={setPhotoDraft}
              onBusyChange={setPhotoBusy}
              disabled={saving}
              scannerOpen={scannerOpen}
            />
            <Button
              className="h-14 w-full gap-2 text-lg"
              disabled={saving || photoBusy}
              onClick={() => void save()}
            >
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
          </fieldset>
        </SheetContent>
      </Sheet>
    </div>
  );
}
