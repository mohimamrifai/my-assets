import { getEffectiveRate, type CurrencyCode } from "./currency/fx";

export async function formatCurrencyWithConversion(
  value: number,
  stored: CurrencyCode,
  display: CurrencyCode,
  overrideRate?: number | null,
  locale: string = "en"
): Promise<string> {
  if (stored === display) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: display,
      minimumFractionDigits: display === "USD" ? 2 : 0,
      maximumFractionDigits: display === "USD" ? 2 : 0,
    }).format(value);
  }

  const rate = await getEffectiveRate(overrideRate);
  const converted = stored === "USD" ? value * rate : value / rate;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: display,
    minimumFractionDigits: display === "USD" ? 2 : 0,
    maximumFractionDigits: display === "USD" ? 2 : 0,
  }).format(converted);
}

export async function formatPercentWithLocale(
  value: number,
  locale: string = "en"
): Promise<string> {
  const formatted = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);

  return value > 0 ? `+${formatted}%` : `${formatted}%`;
}