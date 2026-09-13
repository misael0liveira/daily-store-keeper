export type PeriodKey = "semanal" | "quinzenal" | "mensal" | "personalizado" | "tudo";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  personalizado: "Período",
  tudo: "Tudo",
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export function periodRange(
  period: PeriodKey,
  from?: string,
  to?: string
): { start: number; end: number } {
  const now = new Date();
  const end = endOfDay(now).getTime();
  if (period === "tudo") return { start: 0, end };
  if (period === "personalizado") {
    const start = from ? startOfDay(new Date(`${from}T00:00:00`)).getTime() : 0;
    const stop = to ? endOfDay(new Date(`${to}T00:00:00`)).getTime() : end;
    return { start, end: stop };
  }
  const days = period === "semanal" ? 7 : period === "quinzenal" ? 15 : 30;
  const start = startOfDay(
    new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  ).getTime();
  return { start, end };
}

export const formatDateTime = (ts: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));

export const formatDate = (ts: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ts));
