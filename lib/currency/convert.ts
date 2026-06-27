import { getEffectiveRate, type CurrencyCode } from "./fx";

export async function convertCurrency(
  value: number,
  from: CurrencyCode,
  to: CurrencyCode,
  overrideRate?: number | null
): Promise<number> {
  if (from === to) return value;
  const rate = await getEffectiveRate(overrideRate);
  return from === "USD" ? value * rate : value / rate;
}