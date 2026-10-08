import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronRight,
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
import { ProductPhoto } from "@/components/ProductPhoto";
import { ProductPhotoEditor } from "@/components/ProductPhotoEditor";
import { ProductPrice } from "@/components/ProductPrice";
import { ProductManagementFields } from "@/components/ProductManagementFields";
import { PromotionManager } from "@/components/PromotionManager";
import { usePricingTime } from "@/hooks/usePricingTime";
import { saveProductPhoto, deleteProductPhoto } from "@/lib/productPhotos";
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
import { isLowStock, useStore, type Product } from "@/store/useStore";

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
  const [promotionsOpen, setPromotionsOpen] = useState(false);
  const [photo, setPhoto] = useState<Blob | null | undefined>();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoCapture, setPhotoCapture] = useState(false);
  const now = usePricingTime();
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [packageSize, setPackageSize] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>();
  const [extra, setExtra] = useState<Partial<Product>>({});
  const [search, setSearch] = useState("");
  const lastScanRef = useRef<string | null>(null);
  const savingRef = useRef(false);

  const existing =
    Object.values(products).find((p) => editingId && p.id === editingId) ??
    (barcode.trim() ? products[barcode.trim()] : undefined);
  const list = useMemo(() => {
    const all = Object.values(products).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const q = search.trim().toLowerCase();
    return all.filter(
      (p) =>
        p.active !== false &&
        (!lowOnly || isLowStock(p)) &&
        (!q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)),
    );
  }, [products, search, lowOnly]);

  const handleScan = useCallback(
    (code: string) => {
      if (lastScanRef.current === code) return;
      lastScanRef.current = code;

      setBarcode(code);
      setPhoto(undefined);
      setPhotoBusy(false);
      const p = products[code];
      setEditingId(p?.id);
      setExtra({});
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
        setName("");
        setBrand("");
        setPackageSize("");
        setPrice("");
        setStock("");
        toast.success("Código lido", {
          description: "Preencha os dados do produto para cadastrá-lo neste aparelho.",
        });
      }
      beep(true);
      vibrate(60);
    },
    [products],
  );

  const save = async () => {
    if (savingRef.current || photoBusy) return;
    const code = barcode.trim();
    const priceNum = Number(String(price).replace(",", "."));
    const stockNum = Number(stock.replace(",", "."));
    if (!code || !name.trim() || !price || !stock) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("Preço inválido");
      return;
    }
    if (
      !Number.isFinite(stockNum) ||
      stockNum < 0 ||
      ((extra.unit ?? existing?.unit ?? "un") === "un" && !Number.isInteger(stockNum))
    ) {
      toast.error("Quantidade inválida");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    let newPhotoId: string | undefined;
    try {
      if (photo) newPhotoId = await saveProductPhoto(photo);
      upsertProduct({
        ...existing,
        ...extra,
        barcode: code,
        name: name.trim(),
        price: priceNum,
        stock: stockNum,
        brand: brand.trim() || undefined,
        packageSize: packageSize.trim() || undefined,
        photoId: photo === undefined ? existing?.photoId : newPhotoId,
      });
      if (existing?.photoId && photo !== undefined)
        void deleteProductPhoto(existing.photoId).catch(() => undefined);
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
      setPhoto(undefined);

      lastScanRef.current = null;
    } catch (error) {
      if (newPhotoId) void deleteProductPhoto(newPhotoId).catch(() => undefined);
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o produto", {
        description: "Confira os dados salvos neste aparelho antes de tentar novamente.",
      });
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  const remove = () => {
    if (!existing) return;
    try {
      deleteProduct(existing.barcode);
      toast.success("Produto arquivado", { description: existing.name });
      setEditorOpen(false);
      setScannerOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível arquivar");
    }
  };

  const loadProduct = (code: string) => {
    const p = products[code];
    if (!p) return;
    setBarcode(p.barcode);
    setEditingId(p.id);
    setExtra({});
    setName(p.name);
    setBrand(p.brand ?? "");
    setPackageSize(p.packageSize ?? "");
    setPrice(String(p.price));
    setStock(String(p.stock));
    setPhoto(undefined);
    setPhotoBusy(false);
    setPhotoCapture(false);
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
            setEditingId(undefined);
            setExtra({});
            setBarcode("");
            setName("");
            setBrand("");
            setPackageSize("");
            setPrice("");
            setStock("");
            setPhoto(undefined);
            setPhotoBusy(false);
            setPhotoCapture(false);

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
      {!promotionsOpen && (
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
      )}
      <div className="pos-filters" aria-label="Filtrar estoque">
        <button
          aria-pressed={!lowOnly && !promotionsOpen}
          onClick={() => {
            setLowOnly(false);
            setPromotionsOpen(false);
          }}
        >
          Todos
        </button>
        <button
          aria-pressed={lowOnly && !promotionsOpen}
          onClick={() => {
            setLowOnly(true);
            setPromotionsOpen(false);
          }}
        >
          Estoque baixo
        </button>
        <button aria-pressed={promotionsOpen} onClick={() => setPromotionsOpen(true)}>
          Promoção
        </button>
      </div>
      {promotionsOpen ? (
        <PromotionManager />
      ) : list.length === 0 ? (
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
                <ProductPhoto photoId={p.photoId} name={p.name} />
                <span className="min-w-0 flex-1">
                  <strong>{p.name}</strong>
                  <span className="pos-stock-detail">
                    <ProductPrice product={p} now={now} /> ·{" "}
                    <span className={isLowStock(p) ? "pos-low-stock" : ""}>
                      {p.components?.length
                        ? "Combo"
                        : p.stockControlled === false
                          ? "Sem estoque físico"
                          : `${p.stock} ${p.unit ?? "un"}`}
                    </span>
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
          if (!saving) {
            setEditorOpen(open);
            if (!open) setScannerOpen(false);
            if (!open) {
              setPhotoCapture(false);
              setPhotoBusy(false);
            }
            if (!open) {
              lastScanRef.current = null;
            }
          }
        }}
      >
        <SheetContent side="bottom" className="pos-product-sheet">
          <SheetHeader>
            <SheetTitle>{existing ? "Editar produto" : "Cadastrar produto"}</SheetTitle>
            <SheetDescription>
              Escaneie ou digite o código de barras e preencha os dados do produto.
            </SheetDescription>
          </SheetHeader>
          {scannerOpen && !photoCapture ? (
            <BarcodeScanner onScan={handleScan} />
          ) : !photoCapture ? (
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
          ) : (
            <p className="text-sm text-muted-foreground">Câmera pausada para tirar a foto.</p>
          )}
          <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm">
            <ProductPhotoEditor
              key={barcode}
              photoId={existing?.photoId}
              name={name}
              value={photo}
              onChange={setPhoto}
              onBusyChange={setPhotoBusy}
              onCaptureChange={setPhotoCapture}
            />
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de barras</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => {
                  const code = e.target.value;
                  setBarcode(code);
                  if (editingId) return;
                  setPhoto(undefined);
                  setPhotoBusy(false);
                  lastScanRef.current = null;

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
                type="text"
                inputMode="numeric"
                enterKeyHint="done"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do produto</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
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
            <ProductManagementFields
              key={existing?.id ?? existing?.barcode ?? "new"}
              product={existing}
              value={extra}
              onChange={setExtra}
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
                    Arquivar produto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Arquivar {existing.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O produto sairá da lista de venda. Histórico, foto e saldo serão preservados.
                    Você pode reativá-lo em Gestão.
                  </AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={remove}>Arquivar produto</AlertDialogAction>
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
