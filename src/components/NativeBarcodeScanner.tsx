import { CameraOff, ScanLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onScan: (code: string) => void;
  onClose: () => void;
};

/**
 * Android (Capacitor) scanner.
 *
 * Uses the native ML Kit barcode reader instead of the WebView camera: it is
 * faster, handles EAN/UPC reliably and asks for the Android camera permission
 * through the system dialog. Manual typing stays available as a fallback.
 */
export function NativeBarcodeScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const activeRef = useRef(true);

  const runScan = useCallback(async () => {
    if (!activeRef.current) return;
    setError(null);
    setScanning(true);
    try {
      const { BarcodeScanner } = await import(
        "@capacitor-mlkit/barcode-scanning"
      );

      const permission = await BarcodeScanner.checkPermissions();
      let granted = permission.camera === "granted";
      if (!granted) {
        const asked = await BarcodeScanner.requestPermissions();
        granted = asked.camera === "granted";
      }
      if (!granted) {
        if (activeRef.current) {
          setError(
            "Permissão da câmera negada. Libere a câmera nas configurações do app ou digite o código abaixo."
          );
        }
        return;
      }

      const supported = await BarcodeScanner.isSupported();
      if (!supported.supported) {
        if (activeRef.current) {
          setError(
            "Este aparelho não suporta a leitura por câmera. Digite o código abaixo."
          );
        }
        return;
      }

      const { barcodes } = await BarcodeScanner.scan();
      if (!activeRef.current) return;
      const code = barcodes[0]?.rawValue?.trim();
      if (code) {
        onScan(code);
      }
    } catch (err) {
      if (!activeRef.current) return;
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
      // The user closing the native scanner is not an error.
      if (/cancel/i.test(message)) return;
      setError("Não foi possível abrir a câmera. Digite o código abaixo.");
    } finally {
      if (activeRef.current) setScanning(false);
    }
  }, [onScan]);

  useEffect(() => {
    activeRef.current = true;
    void runScan();
    return () => {
      activeRef.current = false;
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
    <div className="rounded-2xl border bg-card p-3 shadow-sm">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        {error ? (
          <CameraOff className="size-10 text-destructive" />
        ) : (
          <ScanLine className="size-10 text-primary" />
        )}
        <p className="text-sm text-muted-foreground">
          {error ??
            (scanning
              ? "Aponte a câmera para o código de barras…"
              : "Toque em Ler código para abrir a câmera.")}
        </p>
        <Button className="h-12 w-full" onClick={() => void runScan()}>
          Ler código
        </Button>
        <div className="flex w-full gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
            placeholder="Digite o código de barras"
            inputMode="numeric"
            className="h-12 text-base"
          />
          <Button variant="secondary" className="h-12 px-5" onClick={submitManual}>
            OK
          </Button>
        </div>
      </div>
      <Button variant="outline" className="mt-1 h-12 w-full" onClick={onClose}>
        Fechar câmera
      </Button>
    </div>
  );
}
