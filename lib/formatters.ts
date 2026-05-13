import { format } from "date-fns";

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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
