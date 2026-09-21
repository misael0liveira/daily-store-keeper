import { ClientOnly } from "@tanstack/react-router";
import { CameraOff, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onScan: (code: string) => void;
  onClose: () => void;
};

function ScannerInner({ onScan, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;

    const start = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled || !containerRef.current) return;
      const id = containerRef.current.id;
      scanner = new Html5Qrcode(id);
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 150 } },
          (decodedText) => {
            const now = Date.now();
            if (
              decodedText === lastScanRef.current.code &&
              now - lastScanRef.current.at < 1500
            ) {
              return;
            }
            lastScanRef.current = { code: decodedText, at: now };
            onScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        if (cancelled) return;
        const name =
          err && typeof err === "object" && "name" in err
            ? String((err as { name: unknown }).name)
            : "";
        setError(
          name === "NotAllowedError"
            ? "Permissão da câmera negada. Digite o código de barras manualmente."
            : "Não foi possível abrir a câmera. Digite o código manualmente."
        );
      }
    };

    start();

    return () => {
      cancelled = true;
      if (scanner) {
        void scanner
          .stop()
          .catch(() => {})
          .finally(() => scanner?.clear());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitManual = () => {
    const code = manualCode.trim();
    if (code) {
      onScan(code);
      setManualCode("");
    }
  };

  return (
    <div className="pdv-scanner-card rounded-2xl border bg-card p-3 shadow-sm">
      {error ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CameraOff className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex w-full gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitManual()}
              placeholder="Digite o código de barras"
              inputMode="numeric"
              className="h-12 text-base"
            />
            <Button className="h-12 px-5" onClick={submitManual}>
              OK
            </Button>
          </div>
        </div>
      ) : (
        <div className="barcode-scanner-frame relative overflow-hidden rounded-xl">
          <div id="barcode-scanner-region" ref={containerRef} className="barcode-scanner-region w-full" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-28 w-64 rounded-lg border-2 border-primary/80">
              <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-destructive/80" />
              <ScanLine className="absolute -top-6 left-1/2 size-5 -translate-x-1/2 text-primary-foreground drop-shadow" />
            </div>
          </div>
        </div>
      )}
      <Button
        variant="outline"
        className="pdv-scanner-close mt-3 h-12 w-full"
        onClick={onClose}
      >
        Fechar câmera
      </Button>
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
