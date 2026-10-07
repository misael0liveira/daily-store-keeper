// Amounts are typed in reais, with an optional comma and at most two decimal digits.
export function editCashAmount(raw: string, key: string): string {
  if (key === "clear") return "";
  if (key === "backspace") return raw.slice(0, -1);
  if (key === "," || key === ".") return raw.includes(",") ? raw : (raw || "0") + ",";
  if (!/^\d$/.test(key)) return raw;
  const [whole = "", cents] = raw.split(",");
  if (cents !== undefined && cents.length >= 2) return raw;
  if (cents === undefined && whole.length >= 7) return raw;
  return raw === "0" ? key : raw + key;
}
export function cashAmount(raw: string, total: number): number {
  return raw === "" ? total : Number(raw.replace(",", "."));
}
