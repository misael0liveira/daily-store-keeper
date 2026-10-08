import { ClientOnly } from "@tanstack/react-router";
import { CameraOff, Flashlight, FlashlightOff } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { configureScannerFocus, scannerCameraErrorMessage } from "@/lib/scannerCamera";
import { closeScannerAfterStart } from "@/lib/scannerLifecycle";

type Props = {
  onScan: (code: string) => void;
  purpose?: "product" | "customer";
};

function ScannerInner({ onScan, purpose = "product" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [flashBusy, setFlashBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const manualActiveRef = useRef(false);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const manualId = useId();
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;
    const container = containerRef.current;

    const start = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled || !container) return;
        scanner = new Html5Qrcode(container.id);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            videoConstraints: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          (decodedText) => {
            if (cancelled || manualActiveRef.current) return;
            const now = Date.now();
            if (decodedText === lastScanRef.current.code && now - lastScanRef.current.at < 1500) {
              return;
            }
            lastScanRef.current = { code: decodedText, at: now };
            onScanRef.current(decodedText);
          },
          () => {},
        );
        if (cancelled) return;
        await configureScannerFocus(scanner);
        if (cancelled) return;
        try {
          const torch = scanner.getRunningTrackCameraCapabilities().torchFeature();
          setFlashSupported(torch.isSupported());
          setFlashOn(torch.value() === true);
        } catch {
          setFlashSupported(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(scannerCameraErrorMessage(err));
      }
    };

    const starting = start();

    return () => {
      cancelled = true;
      scannerRef.current = null;
      if (scanner) {
        void closeScannerAfterStart(scanner, starting, () => {
          const video = container?.querySelector("video");
          const stream = video?.srcObject;
          if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
        });
      }
    };
  }, []);

  const submitManual = () => {
    const code = manualCode.trim();
    if (!code) {
      manualInputRef.current?.focus();
      return;
    }
    lastScanRef.current = { code, at: Date.now() };
    setManualCode("");
    manualInputRef.current?.blur();
    manualActiveRef.current = false;
    onScanRef.current(code);
  };

  const toggleFlash = async () => {
    const activeScanner = scannerRef.current;
    if (!activeScanner || flashBusy) return;

    setFlashBusy(true);
    try {
      const torch = activeScanner.getRunningTrackCameraCapabilities().torchFeature();
      if (!torch.isSupported()) {
        setFlashSupported(false);
        return;
      }
      const next = !flashOn;
      await torch.apply(next);
      setFlashOn(next);
    } catch {
      toast.error("Não foi possível alterar a lanterna da câmera.");
    } finally {
      setFlashBusy(false);
    }
  };

  return (
    <div className="pdv-scanner-card rounded-2xl border bg-card p-3 shadow-sm">
      {error ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CameraOff className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <div className="barcode-scanner-frame relative overflow-hidden rounded-xl">
          <div
            id="barcode-scanner-region"
            ref={containerRef}
            className="barcode-scanner-region w-full"
          />
          {flashSupported && (
            <button
              type="button"
              className="barcode-scanner-flash"
              onClick={() => void toggleFlash()}
              disabled={flashBusy}
              aria-label={flashOn ? "Desligar lanterna" : "Ligar lanterna"}
              aria-pressed={flashOn}
              title={flashOn ? "Desligar lanterna" : "Ligar lanterna"}
            >
              {flashOn ? <FlashlightOff size={16} /> : <Flashlight size={16} />}
            </button>
          )}
          <div className="pdv-scan-guide" aria-hidden="true">
            <div className="pdv-scan-corners">
              <i className="is-top-left" />
              <i className="is-top-right" />
              <i className="is-bottom-left" />
              <i className="is-bottom-right" />
            </div>
            <span />
          </div>
        </div>
      )}
      <div id={manualId} hidden={!error} className="mt-3">
        <form
          noValidate
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitManual();
          }}
        >
          <Label htmlFor={`${manualId}-input`}>
            {purpose === "customer" ? "Código do cliente" : "Código de barras"}
          </Label>
          <div className="flex gap-2">
            <Input
              id={`${manualId}-input`}
              ref={manualInputRef}
              type="text"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              onFocus={() => {
                manualActiveRef.current = true;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault();
              }}
              placeholder={
                purpose === "customer"
                  ? "Digite o código do cliente"
                  : "Digite os números do código"
              }
              inputMode={purpose === "customer" ? "text" : "numeric"}
              enterKeyHint="done"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-12 min-w-0 text-base"
            />
            <Button type="submit" className="h-12 shrink-0 px-4" disabled={!manualCode.trim()}>
              Usar código
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScannerSwitch(props: Props) {
  // Use the embedded WebView camera on Android too so the preview stays inside
  // the approved rectangular Caixa area instead of opening a full-screen native UI.
  return <ScannerInner {...props} />;
}

export function BarcodeScanner(props: Props) {
  return (
    <ClientOnly
      fallback={
        <div className="flex h-48 items-center justify-center rounded-2xl border bg-card text-sm text-muted-foreground">
          Abrindo câmera…
        </div>
      }
    >
      <ScannerSwitch {...props} />
    </ClientOnly>
  );
}
