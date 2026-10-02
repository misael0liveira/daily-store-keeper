const DATABASE = "pdv-product-photos";
const STORE = "photos";

async function openPhotos(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    throw new Error("O armazenamento de fotos não está disponível neste aparelho.");
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    let blocked = false;
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else resolve(request.result);
    };
    request.onerror = () => reject(new Error("Não foi possível abrir as fotos salvas."));
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Feche outras telas do app e tente novamente."));
    };
  });
}

async function photoRequest<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openPhotos();
  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => {
        database.close();
        resolve(request.result);
      };
      transaction.onabort = transaction.onerror = () => {
        database.close();
        reject(new Error("Não foi possível salvar a foto. Confira o espaço livre no aparelho."));
      };
    } catch {
      database.close();
      reject(new Error("Não foi possível acessar as fotos neste aparelho."));
    }
  });
}

export async function saveProductPhoto(photo: Blob): Promise<string> {
  const id = crypto.randomUUID();
  await photoRequest("readwrite", (store) => store.put(photo, id));
  return id;
}

export async function getProductPhoto(id: string): Promise<Blob | undefined> {
  const photo = await photoRequest<unknown>("readonly", (store) => store.get(id));
  return photo instanceof Blob ? photo : undefined;
}

export async function deleteProductPhoto(id: string): Promise<void> {
  await photoRequest("readwrite", (store) => store.delete(id));
}

/** Resize and re-encode locally; no image or product data is uploaded. */
export async function prepareProductPhoto(file: Blob): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Escolha uma foto JPG, PNG ou WebP.");
  }
  if (file.size > 12 * 1024 * 1024) throw new Error("Escolha uma foto de até 12 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Não foi possível abrir essa imagem. Escolha outra."));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("A imagem está vazia.");
    const scale = Math.min(1, 960 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a foto.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (photo) =>
          photo ? resolve(photo) : reject(new Error("Não foi possível preparar a foto.")),
        "image/jpeg",
        0.82,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function productImageSearchUrl(fields: {
  barcode: string;
  name: string;
  brand: string;
  packageSize: string;
}): string | null {
  const query = [fields.barcode, fields.name, fields.brand, fields.packageSize]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");
  if (!query) return null;
  const url = new URL("https://www.google.com/search");
  url.searchParams.set("tbm", "isch");
  url.searchParams.set("q", query);
  return url.toString();
}
