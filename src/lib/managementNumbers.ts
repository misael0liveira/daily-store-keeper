export const decimal = (value: string) => (value.trim() ? Number(value.replace(",", ".")) : NaN);
