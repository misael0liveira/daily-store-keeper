import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";
import { Camera, Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { captureStockCameraFrame } from "@/lib/offlineOcr";
import { ProductVision, type VisionStatus } from "@/lib/productVision";
import { parseProductVisionResult, type ProductVisionSuggestion } from "@/lib/productVisionResult";

export function ProductVisionAssistant({
  onApply,
}: {
  onApply: (value: ProductVisionSuggestion) => void;
}) {
  const [status, setStatus] = useState<VisionStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState("");
  const [suggestion, setSuggestion] = useState<ProductVisionSuggestion | null>(null);
  const active = useRef(false);
  const running = useRef(false);
  const isAndroid = Capacitor.getPlatform() === "android";

  useEffect(() => {
    active.current = true;
    if (!isAndroid)
      return () => {
        active.current = false;
      };
    let polling = false;
    const refresh = async () => {
      if (polling) return;
      polling = true;
      try {
        const value = await ProductVision.getStatus();
        if (active.current) setStatus(value);
      } catch {
        if (active.current)
          setError("Não foi possível verificar a IA. Feche e abra o aplicativo e tente novamente.");
      } finally {
        polling = false;
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 1000);
    return () => {
      active.current = false;
      window.clearInterval(interval);
      if (running.current) void ProductVision.cancel().catch(() => {});
    };
  }, [isAndroid]);

  const run = async (download: boolean) => {
    if (running.current || status?.busy) return;
    running.current = true;
    setBusy(true);
    setCancelling(false);
    setError("");
    setSuggestion(null);
    try {
      if (download) {
        await ProductVision.downloadModel();
      } else {
        const imageBase64 = await captureStockCameraFrame();
        if (!active.current) return;
        setPhoto(`data:image/jpeg;base64,${imageBase64}`);
        const result = await ProductVision.analyze({ imageBase64 });
        if (active.current) setSuggestion(parseProductVisionResult(result.text));
      }
    } catch (err) {
      if (active.current)
        setError(
          err instanceof Error ? err.message : "Não foi possível concluir. Tente novamente.",
        );
    } finally {
      running.current = false;
      if (active.current) {
        setBusy(false);
        setCancelling(false);
        void ProductVision.getStatus()
          .then(setStatus)
          .catch(() => {});
      }
    }
  };

  const isBusy = busy || status?.busy;
  const progress = status ? Math.min(100, Math.floor((status.bytes / status.totalBytes) * 100)) : 0;
  const phaseLabel = cancelling
    ? "Cancelando…"
    : status?.phase === "verifying"
      ? "Conferindo o download…"
      : status?.phase === "downloading"
        ? `Baixando IA: ${progress}%`
        : status?.phase === "analyzing"
          ? "Lendo a embalagem na foto…"
          : "Preparando a IA…";

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4" aria-labelledby="vision-title">
      <div>
        <h3 id="vision-title" className="font-semibold">
          Preencher pela foto · IA local
        </h3>
        <p className="text-sm text-muted-foreground">
          Fotografe a frente da embalagem. Confira nome, marca e peso antes de aplicar.
        </p>
      </div>
      {!isAndroid ? (
        <p className="text-sm text-muted-foreground">Disponível no APK Android de teste.</p>
      ) : status?.supported === false ? (
        <p role="status" className="text-sm text-muted-foreground">
          Esta IA precisa de Android 8 ou superior e sistema de 64 bits. Use a leitura de texto ou o
          cadastro manual neste aparelho.
        </p>
      ) : (
        <>
          {!status?.ready && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Instalação única do Gemma 4 E2B: <strong>2,6 GB</strong>. Use Wi-Fi e mantenha o app
                aberto. Depois, as fotos são analisadas offline, sem cobrança por uso.
              </p>
              <p>
                Recomendado: 8 GB de RAM.{" "}
                {status && status.ramBytes < 7.5 * 1024 ** 3
                  ? "Este aparelho tem menos memória; o teste pode ficar lento ou não iniciar."
                  : "O tempo de leitura depende do aparelho."}
              </p>
              <a
                className="text-primary underline"
                href="https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm"
                target="_blank"
                rel="noreferrer"
              >
                Modelo e licença Apache 2.0
              </a>
            </div>
          )}
          <Button
            type="button"
            className="min-h-11 w-full gap-2"
            disabled={!status || isBusy || !status.supported}
            onClick={() => void run(!status?.ready)}
            aria-busy={Boolean(isBusy)}
          >
            {isBusy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : status?.ready ? (
              <Camera className="size-4" />
            ) : (
              <Download className="size-4" />
            )}
            {isBusy
              ? phaseLabel
              : status?.ready
                ? "Fotografar e analisar"
                : status && status.bytes > 0
                  ? "Retomar instalação da IA"
                  : "Baixar IA · 2,6 GB"}
          </Button>
          {isBusy && (
            <div className="space-y-2" role="status" aria-live="polite">
              {status?.phase === "downloading" && (
                <progress
                  className="w-full"
                  value={progress}
                  max={100}
                  aria-label="Download da IA"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {status?.ready
                  ? "A primeira análise pode levar alguns minutos. A foto fica somente neste aparelho."
                  : "Se a conexão cair, retome a instalação sem baixar tudo novamente."}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={cancelling}
                onClick={() => {
                  setCancelling(true);
                  void ProductVision.cancel().catch(() => {
                    setCancelling(false);
                    setError("Não foi possível cancelar. Aguarde a operação terminar.");
                  });
                }}
              >
                {cancelling
                  ? "Cancelando…"
                  : status?.ready
                    ? "Cancelar análise"
                    : "Pausar download"}
              </Button>
            </div>
          )}
          {photo && (
            <img
              src={photo}
              alt="Foto da embalagem enviada à IA local"
              className="max-h-48 w-full rounded-xl object-contain"
            />
          )}
          {suggestion && (
            <div className="space-y-3" aria-live="polite">
              <p className="text-sm font-medium">
                Confira as sugestões. Campo vazio significa que a IA não conseguiu ler.
              </p>
              {(
                [
                  ["name", "Nome"],
                  ["brand", "Marca"],
                  ["packageSize", "Peso ou volume"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`vision-${key}`}>{label}</Label>
                  <Input
                    id={`vision-${key}`}
                    value={suggestion[key] ?? ""}
                    placeholder="Não identificado"
                    onChange={(event) =>
                      setSuggestion({ ...suggestion, [key]: event.target.value })
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full"
                disabled={isBusy || !Object.values(suggestion).some((value) => value?.trim())}
                onClick={() => {
                  onApply({
                    name: suggestion.name?.trim() || null,
                    brand: suggestion.brand?.trim() || null,
                    packageSize: suggestion.packageSize?.trim() || null,
                  });
                  setSuggestion(null);
                  setPhoto("");
                }}
              >
                Aplicar ao cadastro
              </Button>
            </div>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
