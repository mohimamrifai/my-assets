"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  value: number;
  className?: string;
}

export function CurrencyDisplay({ value, className }: CurrencyDisplayProps) {
  const { currency, fxRate } = useCurrency();
  return (
    <span className={cn("tabular-nums", className)}>
      {formatCurrency(value, { display: currency, rate: fxRate })}
    </span>
  );
}
