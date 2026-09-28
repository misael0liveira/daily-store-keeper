import { Capacitor, registerPlugin } from "@capacitor/core";

type OfflineOcrPlugin = {
  recognizeText(options: { imageBase64: string }): Promise<{ text: string }>;
};

const OfflineOcr = registerPlugin<OfflineOcrPlugin>("OfflineOcr");

/** Captures one frame from the already-running stock camera. */
export async function captureStockCameraFrame(): Promise<string> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    throw new Error("A leitura pela câmera está disponível no APK Android.");
  }

  const video = document.querySelector<HTMLVideoElement>("#barcode-scanner-region video");
  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    throw new Error("A câmera ainda não está pronta. Tente novamente em alguns segundos.");
  }

  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!sourceWidth || !sourceHeight) {
    throw new Error("Não foi possível capturar a imagem da câmera.");
  }

  // Keep enough detail for small package labels, including portrait camera frames.
  const maxWidth = 1920;
  const scale = Math.min(1, maxWidth / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem da câmera.");

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageBase64 = canvas.toDataURL("image/jpeg", 0.84).split(",", 2)[1];
  if (!imageBase64) throw new Error("Não foi possível preparar a imagem da câmera.");

  return imageBase64;
}

/** Reads text locally on Android. */
export async function readTextFromStockCamera(): Promise<string> {
  const imageBase64 = await captureStockCameraFrame();
  const result = await OfflineOcr.recognizeText({ imageBase64 });
  return result.text.trim();
}

const PACK_SIZE = /\b(\d{1,4}(?:[.,]\d{1,3})?)\s*(kg|g|mg|l|lt|ml|cl|un(?:idades?)?)\b/i;
const NON_PRODUCT_COPY =
  /\b(ingredientes|informa[cç][aã]o nutricional|tabela nutricional|valor energ[eé]tico|validade|lote|fabricado|fabrica[cç][aã]o|cont[eé]m|conte[uú]do|peso|al[eé]rgicos|conservar|conserva[cç][aã]o|distribu[ií]do|cnpj|ind[uú]stria brasileira|por[cç][aã]o|%\s*vd)\b/i;
const NUTRITION_COPY =
  /\b(tabela|informa[cç][aã]o nutricional|por[cç][aã]o|por[cç][oõ]es|valor energ[eé]tico|calorias|prote[ií]nas?|carboidratos?|gorduras?|s[oó]dio|a cada|valor di[aá]rio|vd)\b/i;

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function normalizeUnit(unit: string): string {
  const normalized = normalizeForMatch(unit);
  if (normalized.startsWith("kg")) return "kg";
  if (normalized === "mg") return "mg";
  if (["l", "lt"].includes(normalized)) return "l";
  if (normalized === "ml") return "ml";
  if (normalized === "cl") return "cl";
  if (normalized.startsWith("un")) return "un";
  return "g";
}

export type ProductTextSuggestions = {
  name?: string;
  packageSize?: string;
};

/** Selects simple product fields from OCR output; the operator always reviews the suggestions. */
export function suggestProductFieldsFromText(text: string): ProductTextSuggestions {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[|_]+/g, " ").replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 2);

  let packageSize: string | undefined;
  const sizes = lines
    .filter((line) => !NUTRITION_COPY.test(line))
    .map((line) => ({
      line,
      match: line.match(PACK_SIZE),
      preferred:
        /\b(peso l[ií]quido|conte[uú]do l[ií]quido|conte[uú]do|peso l[ií]q\.?|peso)\b/i.test(line),
    }))
    .filter((candidate) => candidate.match)
    .sort((a, b) => Number(b.preferred) - Number(a.preferred));

  for (const { match } of sizes) {
    const amountMatch = match?.[1];
    const unitMatch = match?.[2];
    if (amountMatch && unitMatch) {
      const amount = amountMatch.replace(",", ".");
      const unit = normalizeUnit(unitMatch);
      packageSize = `${amount} ${unit}`;
      break;
    }
  }

  const candidates = lines
    .map((line) =>
      line
        .replace(PACK_SIZE, "")
        .replace(/^[\s:–—-]+|[\s:–—-]+$/g, "")
        .trim(),
    )
    .filter((line) => {
      if (
        line.length < 3 ||
        line.length > 64 ||
        NON_PRODUCT_COPY.test(line) ||
        NUTRITION_COPY.test(line)
      )
        return false;
      if (/^\d[\d\s.,/%-]*$/.test(line)) return false;
      return /[A-Za-zÀ-ÿ]{2}/.test(line);
    });

  const name = candidates.slice(0, 2).join(" ").replace(/\s+/g, " ").trim();
  return {
    ...(name ? { name } : {}),
    ...(packageSize ? { packageSize } : {}),
  };
}
