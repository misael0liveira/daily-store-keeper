import { useEffect, useState } from "react";

export function PixQr({ payload, size = 220 }: { payload: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setDataUrl(null);
    void (async () => {
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(payload, {
        width: size * 2,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      if (active) setDataUrl(url);
    })();
    return () => {
      active = false;
    };
  }, [payload, size]);

  return (
    <div
      className="mx-auto flex items-center justify-center rounded-2xl bg-white p-3"
      style={{ width: size + 24, height: size + 24 }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="QR Code do pagamento Pix"
          width={size}
          height={size}
        />
      ) : (
        <span className="text-xs text-slate-500">Gerando QR Code…</span>
      )}
    </div>
  );
}
