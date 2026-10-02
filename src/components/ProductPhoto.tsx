import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { getProductPhoto } from "@/lib/productPhotos";

export function ProductPhoto({
  photoId,
  draft,
  alt = "",
  className = "size-12",
}: {
  photoId?: string | undefined;
  draft?: Blob | null | undefined;
  alt?: string;
  className?: string;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    let ownedUrl = "";
    setUrl("");
    const load = async () => {
      try {
        const photo =
          draft === undefined ? (photoId ? await getProductPhoto(photoId) : undefined) : draft;
        if (!active || !photo) return;
        ownedUrl = URL.createObjectURL(photo);
        setUrl(ownedUrl);
      } catch {
        // A missing photo never prevents reading or editing the product.
      }
    };
    void load();
    return () => {
      active = false;
      if (ownedUrl) URL.revokeObjectURL(ownedUrl);
    };
  }, [photoId, draft]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/30 ${className}`}
    >
      {url ? (
        <img src={url} alt={alt} width={160} height={160} className="size-full object-contain" />
      ) : (
        <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  );
}
