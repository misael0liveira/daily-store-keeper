export type ProductVisionSuggestion = {
  name: string | null;
  brand: string | null;
  packageSize: string | null;
};

/** Treat generated text as untrusted data: only these three editable fields are accepted. */
export function parseProductVisionResult(text: string): ProductVisionSuggestion {
  const clean = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let data: unknown;
  try {
    data = JSON.parse(clean);
  } catch {
    throw new Error(
      "A IA não conseguiu organizar a leitura. Enquadre melhor o nome e o peso e tente outra foto.",
    );
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("A IA não retornou dados do produto. Tente outra foto.");
  }
  const fields = data as Record<string, unknown>;
  const field = (key: string, max: number) => {
    const value = fields[key];
    if (typeof value !== "string") return null;
    const result = Array.from(value, (char) => (char.charCodeAt(0) < 32 ? " " : char))
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (
      !result ||
      result.length > max ||
      /^(null|unknown|desconhecid[oa]|ileg[ií]vel|n\/a)$/i.test(result)
    )
      return null;
    return result;
  };
  const size = field("packageSize", 40);
  const result: ProductVisionSuggestion = {
    name: field("name", 120),
    brand: field("brand", 80),
    packageSize:
      size &&
      /^(?:\d+\s*[x×]\s*)?\d+(?:[.,]\d+)?\s*(?:kg|g|mg|ml|l|cl|un|unidades?)\.?$/i.test(size)
        ? size
        : null,
  };
  if (!result.name && !result.brand && !result.packageSize) {
    throw new Error(
      "A IA não conseguiu ler nome, marca ou peso com clareza. Aproxime a frente da embalagem e tente novamente.",
    );
  }
  return result;
}
