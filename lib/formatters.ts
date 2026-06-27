import { format } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import type { CurrencyCode } from "./currency/fx";

interface FormatCurrencyOptions {
  stored?: CurrencyCode;
  display?: CurrencyCode;
  locale?: string;
}

const dateLocaleMap = { en: enUS, id: idLocale } as const;

export function formatCurrency(
  value: number,
  displayOrOptions: CurrencyCode | FormatCurrencyOptions = "IDR"
): string {
  const options: FormatCurrencyOptions =
    typeof displayOrOptions === "string"
      ? { display: displayOrOptions }
      : displayOrOptions;

  const display = options.display ?? "IDR";
  const locale = options.locale ?? "en";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: display,
    minimumFractionDigits: display === "USD" ? 2 : 0,
    maximumFractionDigits: display === "USD" ? 2 : 0,
  }).format(value);
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