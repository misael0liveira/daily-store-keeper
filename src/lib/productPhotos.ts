const databaseName = "mercadinho-product-photos";
const storeName = "photos";
let database: Promise<IDBDatabase> | undefined;

function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        database = undefined;
      };
      resolve(request.result);
    };
    request.onerror = () => {
      database = undefined;
      reject(request.error);
    };
  });
  return database;
}

async function photoTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Armazenamento indisponível."));
  });
}

export async function saveProductPhoto(blob: Blob) {
  const id = `photo-${crypto.randomUUID()}`;
  await photoTransaction("readwrite", (store) => store.put(blob, id));
  return id;
}
export const readProductPhoto = (id: string) =>
  photoTransaction<Blob | undefined>("readonly", (store) => store.get(id));
export const deleteProductPhoto = (id: string) =>
  photoTransaction("readwrite", (store) => store.delete(id));

// Replace only a connected, uniform background. Never send the image to a remote service.
export function whitenUniformBackground(pixels: Uint8ClampedArray, width: number, height: number) {
  const corners = [0, width - 1, (height - 1) * width, width * height - 1];
  const distance = (a: number, b: number) =>
    Math.max(
      ...[0, 1, 2].map((channel) => Math.abs(pixels[a * 4 + channel]! - pixels[b * 4 + channel]!)),
    );
  const seed = corners.find(
    (corner) => corners.filter((other) => distance(corner, other) <= 35).length >= 3,
  );
  if (seed === undefined) return false;
  const color = Array.from(pixels.slice(seed * 4, seed * 4 + 3));
  const matches = (index: number) =>
    pixels[index * 4 + 3]! < 20 ||
    color.every((value, channel) => Math.abs(pixels[index * 4 + channel]! - value) <= 45);
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const enqueue = (index: number) => {
    if (seen[index]) return;
    seen[index] = 1;
    if (matches(index)) queue[tail++] = index;
  };
  for (let x = 0; x < width; x++) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++]!;
    pixels[index * 4] = pixels[index * 4 + 1] = pixels[index * 4 + 2] = 255;
    pixels[index * 4 + 3] = 255;
    if (index % width > 0) enqueue(index - 1);
    if (index % width < width - 1) enqueue(index + 1);
    if (index >= width) enqueue(index - width);
    if (index < width * (height - 1)) enqueue(index + width);
  }
  return tail > 0;
}

export async function prepareProductPhoto(file: File, whiteBackground: boolean) {
  if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024)
    throw new Error("Escolha uma imagem de até 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const source = document.createElement("canvas");
    source.width = width;
    source.height = height;
    const context = source.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Não foi possível preparar a foto.");
    context.drawImage(image, 0, 0, width, height);
    let whitened = false;
    if (whiteBackground) {
      const pixels = context.getImageData(0, 0, width, height);
      whitened = whitenUniformBackground(pixels.data, width, height);
      context.putImageData(pixels, 0, 0);
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const output = canvas.getContext("2d");
    if (!output) throw new Error("Não foi possível preparar a foto.");
    output.fillStyle = "#ffffff";
    output.fillRect(0, 0, 512, 512);
    output.drawImage(source, (512 - width) / 2, (512 - height) / 2);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value ? resolve(value) : reject(new Error("Não foi possível preparar a foto.")),
        "image/jpeg",
        0.82,
      ),
    );
    return { blob, whitened };
  } finally {
    URL.revokeObjectURL(url);
  }
}
