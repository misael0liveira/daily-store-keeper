import { createFileRoute } from "@tanstack/react-router";
import {
  Package,
  PackageOpen,
  Save,
  ScanBarcode,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { beep, vibrate } from "@/lib/feedback";
import { formatBRL, useStore } from "@/store/useStore";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — Mini Mercado PDV" },
      {
        name: "description",
        content:
          "Cadastre, edite e exclua produtos do estoque do mini mercado.",
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [search, setSearch] = useState("");

  const existing = barcode.trim() ? products[barcode.trim()] : undefined;
  const list = useMemo(() => {
    const all = Object.values(products).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
    const q = search.trim().toLowerCase();
    return q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;
  }, [products, search]);

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

  const save = () => {
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
    upsertProduct({
      barcode: code,
      name: name.trim(),
      price: priceNum,
      stock: stockNum,
    });
    toast.success(
      existing ? "Produto atualizado!" : "Produto cadastrado!",
      { description: name.trim() }
    );
    setBarcode("");
    setName("");
    setPrice("");
    setStock("");
  };

  const remove = () => {
    if (!existing) return;
    if (window.confirm(`Excluir "${existing.name}" do estoque?`)) {
      deleteProduct(existing.barcode);
      toast.success("Produto excluído", { description: existing.name });
      setBarcode("");
      setName("");
      setPrice("");
      setStock("");
    }
  };

  const loadProduct = (code: string) => {
    const p = products[code];
    if (!p) return;
    setBarcode(p.barcode);
    setName(p.name);
    setPrice(String(p.price));
    setStock(String(p.stock));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      {scannerOpen ? (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      ) : (
        <Button
          variant="outline"
          className="h-14 w-full gap-3 text-lg"
          onClick={() => setScannerOpen(true)}
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
        <Button className="h-14 w-full gap-2 text-lg" onClick={save}>
          <Save className="size-5" />
          {existing ? "Atualizar Produto" : "Cadastrar Produto"}
        </Button>
        {existing && (
          <Button
            variant="destructive"
            className="h-12 w-full gap-2"
            onClick={remove}
          >
            <Trash2 className="size-5" />
            Excluir Produto
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto…"
            className="h-12 pl-10 text-base"
          />
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <PackageOpen className="size-12 text-muted-foreground" />
            <p className="font-display text-2xl tracking-wide text-muted-foreground">
              {search ? "Nenhum produto encontrado" : "Estoque vazio"}
            </p>
            <p className="max-w-56 text-sm text-muted-foreground">
              {search
                ? "Tente outro nome na busca."
                : "Cadastre o primeiro produto usando o formulário acima."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((p) => (
              <li key={p.barcode}>
                <button
                  type="button"
                  onClick={() => loadProduct(p.barcode)}
                  className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Package className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.barcode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {formatBRL(p.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.stock} em estoque
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
