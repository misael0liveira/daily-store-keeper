import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductPhoto } from "@/components/ProductPhoto";
import { captureStockCameraFrame } from "@/lib/offlineOcr";
import { prepareProductPhoto, productImageSearchUrl } from "@/lib/productPhotos";
import { isNativeApp } from "@/lib/platform";

export function ProductPhotoEditor({
  barcode,
  name,
  brand,
  packageSize,
  photoId,
  value,
  onChange,
  onBusyChange,
  disabled,
  scannerOpen,
}: {
  barcode: string;
  name: string;
  brand: string;
  packageSize: string;
  photoId?: string | undefined;
  value: Blob | null | undefined;
  onChange: (photo: Blob | null) => void;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
  scannerOpen: boolean;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const searchUrl = productImageSearchUrl({ barcode, name, brand, packageSize });
  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );

  const select = async (source: () => Promise<Blob>) => {
    const id = ++request.current;
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      const prepared = await prepareProductPhoto(await source());
      if (id !== request.current) return;
      onChange(prepared);
    } catch (failure) {
      if (id === request.current)
        setError(
          failure instanceof Error ? failure.message : "Não foi possível selecionar a foto.",
        );
    } finally {
      if (id === request.current) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  };

  return (
    <section
      className="space-y-3 rounded-2xl border bg-card p-4"
      aria-labelledby="product-photo-title"
    >
      <div className="flex items-center gap-3">
        <ProductPhoto
          photoId={photoId}
          draft={value}
          alt={`Foto de ${name || "produto"}`}
          className="size-20"
        />
        <div className="min-w-0 flex-1">
          <h3 id="product-photo-title" className="font-semibold">
            Foto do produto{" "}
            <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A foto será salva neste aparelho e ficará disponível sem internet.
          </p>
        </div>
        {(value instanceof Blob || (value === undefined && photoId)) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remover foto do produto"
            disabled={disabled || busy}
            onClick={() => onChange(null)}
          >
            <X size={18} aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => picker.current?.click()}
        >
          <ImagePlus size={16} aria-hidden="true" />
          Escolher foto
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || busy || !scannerOpen}
          onClick={() =>
            void select(async () => {
              const base64 = await captureStockCameraFrame();
              const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
              return new Blob([bytes], { type: "image/jpeg" });
            })
          }
        >
          <Camera size={16} aria-hidden="true" />
          Capturar foto
        </Button>
      </div>
      <input
        ref={picker}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label="Escolher foto do produto"
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void select(async () => file);
        }}
      />
      {searchUrl && !disabled && !busy ? (
        <a
          href={searchUrl}
          target={isNativeApp() ? "_self" : "_blank"}
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", className: "w-full gap-2" })}
          onClick={(event) => {
            if (navigator.onLine === false) {
              event.preventDefault();
              toast.info("A busca de fotos precisa de internet", {
                description: "Você pode escolher ou capturar uma foto sem conexão.",
              });
            }
          }}
        >
          <Search size={16} aria-hidden="true" />
          Buscar foto na internet
        </a>
      ) : (
        <Button type="button" variant="outline" className="w-full gap-2" disabled>
          <Search size={16} aria-hidden="true" />
          Buscar foto na internet
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        A busca abre no navegador usando código, nome, marca e embalagem. Salve a imagem escolhida,
        volte ao app e toque em Escolher foto. Confira se é o mesmo produto.
      </p>
      {!searchUrl && (
        <p className="text-xs text-muted-foreground">Preencha o código ou o nome para pesquisar.</p>
      )}
      <div role={error ? "alert" : "status"} aria-live="polite">
        {busy && <p className="text-sm text-muted-foreground">Preparando foto…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </section>
  );
}
