import { format } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import type { CurrencyCode } from "./currency/fx";

interface FormatCurrencyOptions {
  stored?: CurrencyCode;
  display?: CurrencyCode;
  locale?: string;
  rate?: number;
}

const FALLBACK_USD_TO_IDR = 15500;

const dateLocaleMap = { en: enUS, id: idLocale } as const;

export function formatCurrency(
  value: number,
  displayOrOptions: CurrencyCode | FormatCurrencyOptions = "IDR"
): string {
  const options: FormatCurrencyOptions =
    typeof displayOrOptions === "string"
      ? { display: displayOrOptions }
      : displayOrOptions;

  const stored = options.stored ?? "IDR";
  const display = options.display ?? "IDR";
  const locale = options.locale ?? "en";

  let converted = value;
  if (stored !== display) {
    const rate = options.rate ?? FALLBACK_USD_TO_IDR;
    converted = stored === "USD" ? value * rate : value / rate;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: display,
    minimumFractionDigits: display === "USD" ? 2 : 0,
    maximumFractionDigits: display === "USD" ? 2 : 0,
  }).format(converted);
}

export function formatPercent(value: number, locale = "en"): string {
  const formatted = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);

  return value > 0 ? `+${formatted}%` : `${formatted}%`;
}

export function formatDate(
  date: Date | string | number,
  locale: string = "en"
): string {
  return format(new Date(date), "dd MMM yyyy", {
    locale: dateLocaleMap[locale as "en" | "id"] ?? enUS,
  });
}

export function formatDateLong(
  date: Date | string | number,
  locale: string = "en"
): string {
  return format(new Date(date), "dd MMMM yyyy", {
    locale: dateLocaleMap[locale as "en" | "id"] ?? enUS,
  });
}

export function formatDateShort(
  date: Date | string | number,
  locale: string = "en"
): string {
  return format(new Date(date), "dd MMM yy", {
    locale: dateLocaleMap[locale as "en" | "id"] ?? enUS,
  });
}