"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/components/providers/CurrencyProvider";

interface GainLossBadgeProps {
  nominal: number;
  percent: number;
  className?: string;
  showNominal?: boolean;
  showPercent?: boolean;
  variant?: "badge" | "text";
}

export function GainLossBadge({
  nominal,
  percent,
  className,
  showNominal = true,
  showPercent = true,
  variant = "badge"
}: GainLossBadgeProps) {
  const { currency, fxRate } = useCurrency();
  const isPositive = nominal >= 0;

  const content = (
    <>
      {isPositive ? (
        <TrendingUp size={16} className="mr-1" aria-hidden="true" />
      ) : (
        <TrendingDown size={16} className="mr-1" aria-hidden="true" />
      )}
      <span className="tabular-nums">
        {showNominal && formatCurrency(Math.abs(nominal), { display: currency, rate: fxRate })}
        {showNominal && showPercent && " ("}
        {showPercent && formatPercent(percent)}
        {showNominal && showPercent && ")"}
      </span>
    </>
  );

  if (variant === "text") {
    return (
      <div
        className={cn(
          "flex items-center font-medium",
          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
          className
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border-transparent",
        isPositive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400",
        className
      )}
    >
      {content}
    </Badge>
  );
}