import { format } from "date-fns";

export function formatCurrency(value: number, currency: "IDR" | "USD" = "IDR"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Keep formatIDR for backward compatibility if needed, but prefer formatCurrency
export function formatIDR(value: number): string {
  return formatCurrency(value, "IDR");
}

export function formatPercent(value: number): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
  
  return value > 0 ? `+${formatted}%` : `${formatted}%`;
}

export function formatDate(date: Date | string | number): string {
  return format(new Date(date), "dd MMM yyyy");
}
