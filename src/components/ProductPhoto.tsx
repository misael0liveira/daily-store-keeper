import { ImageOff, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { readProductPhoto } from "@/lib/productPhotos";

export function ProductPhoto({
  photoId,
  name,
  preview,
  className = "",
}: {
  photoId?: string | undefined;
  name: string;
  preview?: string | undefined;
  className?: string;
}) {
  const [loaded, setLoaded] = useState<{ id: string; url: string }>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    setFailed(false);
    if (photoId && !preview) {
      void readProductPhoto(photoId)
        .then((blob) => {
          if (cancelled) return;
          if (!blob) {
            setFailed(true);
            return;
          }
          url = URL.createObjectURL(blob);
          setLoaded({ id: photoId, url });
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    }
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [photoId, preview]);
  const source = preview || (loaded?.id === photoId ? loaded?.url : undefined);
  return (
    <span className={`product-photo ${className}`}>
      {source && !failed ? (
        <img src={source} alt={`Foto de ${name}`} onError={() => setFailed(true)} />
      ) : failed ? (
        <ImageOff aria-label="Foto indisponível" size={24} />
      ) : (
        <Package aria-label="Produto sem foto" size={24} />
      )}
    </span>
  );
}
