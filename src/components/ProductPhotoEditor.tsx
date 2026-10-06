import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { prepareProductPhoto } from "@/lib/productPhotos";
import { ProductPhoto } from "@/components/ProductPhoto";

export function ProductPhotoEditor({
  photoId,
  name,
  value,
  onChange,
  onBusyChange,
  onCaptureChange,
}: {
  photoId?: string | undefined;
  name: string;
  value: Blob | null | undefined;
  onChange: (blob: Blob | null | undefined) => void;
  onBusyChange: (busy: boolean) => void;
  onCaptureChange: (capturing: boolean) => void;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const alive = useRef(true);
  const [file, setFile] = useState<File>();
  const [white, setWhite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string>();
  useEffect(() => {
    const input = camera.current;
    const cancel = () => onCaptureChange(false);
    input?.addEventListener("cancel", cancel);
    return () => input?.removeEventListener("cancel", cancel);
  }, [onCaptureChange]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!value) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);
  const process = async (next: File, whiten: boolean) => {
    const id = ++requestId.current;
    setBusy(true);
    onBusyChange(true);
    try {
      const result = await prepareProductPhoto(next, whiten);
      if (!alive.current || requestId.current !== id) return;
      onChange(result.blob);
      if (whiten && !result.whitened)
        toast.info("Foto preparada", {
          description:
            "O fundo é variado e foi preservado. Use um fundo liso para substituir por branco.",
        });
    } catch (error) {
      if (alive.current && requestId.current === id)
        toast.error(error instanceof Error ? error.message : "Não foi possível carregar a foto.");
    } finally {
      if (alive.current && requestId.current === id) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  };
  const pick = (input: HTMLInputElement) => {
    const next = input.files?.[0];
    input.value = "";
    onCaptureChange(false);
    if (next) {
      setFile(next);
      void process(next, white);
    }
  };
  const openPicker = (input: HTMLInputElement | null, capture = false) => {
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") input.showPicker();
      else input.click();
      if (capture) onCaptureChange(true);
    } catch {
      input.click();
      if (capture) onCaptureChange(true);
    }
  };
  return (
    <div className="product-photo-editor">
      <ProductPhoto
        photoId={value === undefined ? photoId : undefined}
        preview={preview}
        name={name || "produto"}
        className="product-photo-preview"
      />
      <div className="min-w-0 space-y-2">
        <p className="font-medium">Foto do produto</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => openPicker(camera.current, true)}
          >
            <Camera size={17} />
            Tirar foto
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => openPicker(fileInput.current)}
          >
            <ImagePlus size={17} />
            Carregar foto
          </Button>
          {(photoId || value) && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              aria-label="Remover foto"
              onClick={() => {
                setFile(undefined);
                onChange(null);
              }}
            >
              <Trash2 size={17} />
            </Button>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={white}
            disabled={busy}
            onChange={(event) => {
              const next = event.target.checked;
              setWhite(next);
              if (file) void process(file, next);
            }}
          />
          Aplicar fundo branco
        </label>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {busy
            ? "Preparando foto…"
            : "Funciona melhor com fundo liso. A foto fica salva no aparelho."}
        </p>
      </div>
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Tirar foto do produto"
        onChange={(event) => pick(event.target)}
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Carregar foto do produto"
        onChange={(event) => pick(event.target)}
      />
    </div>
  );
}
