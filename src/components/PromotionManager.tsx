import { Camera, Check, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ProductPhoto } from "@/components/ProductPhoto";
import { ProductPrice } from "@/components/ProductPrice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePricingTime } from "@/hooks/usePricingTime";
import { beep, unlockAudio, vibrate } from "@/lib/feedback";
import { formatBRL, getProductPricing, useStore, type Promotion } from "@/store/useStore";

type Draft = {
  price: string;
  discount: string;
  mode: Promotion["mode"];
  start: string;
  end: string;
};
function dateField(timestamp = Date.now()) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function PromotionManager() {
  const { products, applyPromotions, removePromotion } = useStore();
  const now = usePricingTime();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastScan = useRef("");
  const query = search.trim().toLowerCase();
  const matches = Object.values(products)
    .filter(
      (p) =>
        query && (p.name.toLowerCase().includes(query) || p.barcode.toLowerCase().includes(query)),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .slice(0, 20);
  const promotionProducts = Object.values(products)
    .filter((p) => p.promotion)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const add = (barcode: string) => {
    if (!products[barcode]) {
      toast.error("Produto não cadastrado", { description: `Código: ${barcode}` });
      return;
    }
    if (selected.includes(barcode)) {
      toast.info("Produto já selecionado");
      return;
    }
    setSelected((previous) => [...previous, barcode]);
    setSearch("");
  };
  const proceed = () => {
    if (!selected.length) return;
    setError("");
    setDrafts(
      Object.fromEntries(
        selected
          .filter((code) => products[code])
          .map((code) => {
            const product = products[code]!;
            const promotion = product.promotion;
            return [
              code,
              {
                price: String(product.price),
                discount: promotion ? String(promotion.discountPercent) : "",
                mode: promotion?.mode ?? "stock",
                start: dateField(promotion?.startsAt),
                end: promotion?.endsAt ? dateField(promotion.endsAt - 1) : "",
              },
            ];
          }),
      ),
    );
    setConfigOpen(true);
  };
  const update = (code: string, changes: Partial<Draft>) => {
    setDrafts((previous) =>
      previous[code] ? { ...previous, [code]: { ...previous[code]!, ...changes } } : previous,
    );
    setError("");
  };
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const updates = selected.map((barcode) => {
        const draft = drafts[barcode];
        if (!draft) throw new Error("Confira os produtos selecionados.");
        const start = new Date(`${draft.start}T00:00:00`);
        const end = new Date(`${draft.end}T00:00:00`);
        end.setDate(end.getDate() + 1);
        return {
          barcode,
          price: Number(draft.price.replace(",", ".")),
          promotion: {
            mode: draft.mode,
            discountPercent: Number(draft.discount.replace(",", ".")),
            ...(draft.mode === "period"
              ? { startsAt: start.getTime(), endsAt: end.getTime() }
              : {}),
          },
        };
      });
      applyPromotions(updates);
      toast.success(updates.length === 1 ? "Promoção salva" : "Promoções salvas", {
        description: "Os descontos serão aplicados no Caixa durante a validade.",
      });
      setConfigOpen(false);
      setSelected([]);
      setDrafts({});
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar. Confira o armazenamento do aparelho.",
      );
      const message = caught instanceof Error ? caught.message : "";
      const index = selected.findIndex((code) => {
        const product = products[code];
        return product && message.includes(product.name);
      });
      if (index >= 0) {
        const field = message.includes("desconto")
          ? "discount"
          : message.includes("preço")
            ? "price"
            : "end";
        modalRef.current?.querySelector<HTMLInputElement>(`#promotion-${index}-${field}`)?.focus();
      }
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };
  return (
    <section className="space-y-4" aria-label="Promoções do estoque">
      <div className="relative promotion-search">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={searchRef}
          className="pos-search pl-10 pr-24"
          aria-label="Buscar produto para promoção"
          placeholder="Nome ou código de barras"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search && (
          <button
            type="button"
            className="pos-search-clear"
            aria-label="Limpar busca de promoção"
            onClick={() => {
              setSearch("");
              searchRef.current?.focus();
            }}
          >
            <X size={18} />
          </button>
        )}
        <button
          type="button"
          className="promotion-camera"
          aria-label="Escanear código para promoção"
          onClick={() => {
            lastScan.current = "";
            unlockAudio();
            setScannerOpen(true);
          }}
        >
          <Camera size={21} />
        </button>
      </div>
      {query && (
        <div className="promotion-results">
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum produto encontrado. Tente outro nome ou código.
            </p>
          ) : (
            matches.map((product) => (
              <button
                type="button"
                className="promotion-product"
                key={product.barcode}
                disabled={selected.includes(product.barcode)}
                onClick={() => add(product.barcode)}
              >
                <ProductPhoto photoId={product.photoId} name={product.name} />
                <span className="min-w-0 flex-1">
                  <strong className="block break-words">{product.name}</strong>
                  <span className="text-xs text-muted-foreground">
                    {product.barcode} · {formatBRL(product.price)}
                  </span>
                </span>
                {selected.includes(product.barcode) ? (
                  <Check size={19} aria-label="Selecionado" />
                ) : (
                  <Plus size={19} aria-hidden="true" />
                )}
              </button>
            ))
          )}
        </div>
      )}
      {selected.length ? (
        <>
          <h2 className="text-sm font-semibold" aria-live="polite">
            {selected.length}{" "}
            {selected.length === 1 ? "produto selecionado" : "produtos selecionados"}
          </h2>
          <ul className="space-y-2">
            {selected.map((code) => {
              const product = products[code];
              return (
                <li key={code} className="promotion-product rounded-2xl border bg-card">
                  <ProductPhoto
                    photoId={product?.photoId}
                    name={product?.name ?? "Produto removido"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium">{product?.name ?? "Produto removido"}</p>
                    {product && <span className="text-sm">{formatBRL(product.price)}</span>}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Retirar ${product?.name ?? code} da promoção`}
                    onClick={() =>
                      setSelected((previous) => previous.filter((item) => item !== code))
                    }
                  >
                    <X size={18} />
                  </Button>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-center">
            <Button type="button" className="h-12 min-w-40" onClick={proceed}>
              Prosseguir
            </Button>
          </div>
        </>
      ) : (
        <div className="pos-empty py-5 text-center">
          <Tag className="mx-auto mb-2" />
          <p>Selecione os produtos da promoção</p>
          <p className="text-sm">Busque pelo nome ou leia o código de barras.</p>
        </div>
      )}
      {promotionProducts.length > 0 && (
        <section aria-label="Promoções cadastradas">
          <h2 className="mb-2 text-sm font-semibold">Promoções cadastradas</h2>
          <ul className="space-y-2">
            {promotionProducts.map((product) => {
              const pricing = getProductPricing(product, now);
              const promotion = product.promotion!;
              const status = pricing.active
                ? "Ativa"
                : promotion.startsAt && now < promotion.startsAt
                  ? "Agendada"
                  : "Encerrada";
              return (
                <li key={product.barcode} className="promotion-product rounded-2xl border bg-card">
                  <ProductPhoto photoId={product.photoId} name={product.name} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium">{product.name}</p>
                    <ProductPrice product={product} now={now} />
                    <p className="text-xs text-muted-foreground">
                      {status} · {promotion.discountPercent}% ·{" "}
                      {promotion.mode === "stock"
                        ? "Enquanto durar o estoque"
                        : `${new Date(promotion.startsAt!).toLocaleDateString("pt-BR")} a ${new Date(promotion.endsAt! - 1).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Encerrar promoção de ${product.name}`}
                    onClick={() => {
                      removePromotion(product.barcode);
                      toast.success("Promoção encerrada", { description: product.name });
                    }}
                  >
                    <Trash2 size={18} />
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent
          className="promotion-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Ler código de barras</DialogTitle>
            <DialogDescription>Escaneie um produto cadastrado para selecioná-lo.</DialogDescription>
          </DialogHeader>
          {scannerOpen && (
            <BarcodeScanner
              onScan={(code) => {
                if (lastScan.current === code) return;
                lastScan.current = code;
                if (!products[code]) {
                  toast.error("Produto não cadastrado", { description: code });
                  return;
                }
                add(code);
                beep(true);
                vibrate(60);
                setScannerOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={configOpen}
        onOpenChange={(open) => {
          if (!saving) setConfigOpen(open);
        }}
      >
        <DialogContent ref={modalRef} className="promotion-dialog">
          <DialogHeader>
            <DialogTitle>Aplicar promoção</DialogTitle>
            <DialogDescription>
              {selected.length === 1
                ? "Defina o desconto e a duração da promoção."
                : "Defina o preço, desconto e duração para cada produto."}
            </DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={save} className="space-y-4">
            {selected.map((code, index) => {
              const product = products[code];
              const draft = drafts[code];
              if (!draft) return null;
              const id = `promotion-${index}`;
              const final =
                Number(draft.price.replace(",", ".")) *
                (1 - Number(draft.discount.replace(",", ".")) / 100);
              return (
                <div
                  key={code}
                  className={`promotion-editor-card ${selected.length > 1 ? "is-multiple" : ""}`}
                >
                  <ProductPhoto
                    photoId={product?.photoId}
                    name={product?.name ?? "Produto removido"}
                  />
                  <div className="promotion-fields">
                    <h3 className="mb-3 break-words font-semibold">
                      {product?.name ?? "Produto removido"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`${id}-price`}>Valor (R$)</Label>
                        <Input
                          id={`${id}-price`}
                          inputMode="decimal"
                          value={draft.price}
                          onChange={(event) => update(code, { price: event.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${id}-discount`}>Desconto (%)</Label>
                        <Input
                          id={`${id}-discount`}
                          inputMode="decimal"
                          value={draft.discount}
                          placeholder="Ex.: 10"
                          onChange={(event) => update(code, { discount: event.target.value })}
                        />
                      </div>
                    </div>
                    {draft.discount && Number.isFinite(final) && final >= 0 && (
                      <p className="product-current-price mt-2 text-sm" aria-live="polite">
                        Com desconto: {formatBRL(Math.round((final + Number.EPSILON) * 100) / 100)}
                      </p>
                    )}
                    <fieldset className="mt-3 space-y-2">
                      <legend className="mb-2 text-sm font-medium">Duração da promoção</legend>
                      <label className="promotion-radio">
                        <input
                          type="radio"
                          name={`${id}-mode`}
                          checked={draft.mode === "period"}
                          onChange={() => update(code, { mode: "period" })}
                        />
                        Data de começo e fim
                      </label>
                      <label className="promotion-radio">
                        <input
                          type="radio"
                          name={`${id}-mode`}
                          checked={draft.mode === "stock"}
                          onChange={() => update(code, { mode: "stock" })}
                        />
                        Enquanto durar o estoque
                      </label>
                      {draft.mode === "period" && (
                        <div className="promotion-dates grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`${id}-start`}>Começo</Label>
                            <Input
                              type="date"
                              id={`${id}-start`}
                              value={draft.start}
                              onChange={(event) => update(code, { start: event.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${id}-end`}>Fim</Label>
                            <Input
                              type="date"
                              id={`${id}-end`}
                              value={draft.end}
                              onChange={(event) => update(code, { end: event.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </fieldset>
                  </div>
                </div>
              );
            })}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setConfigOpen(false)}
              >
                Voltar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Aplicar promoção"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
