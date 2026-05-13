import { formatIDR } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  value: number;
  className?: string;
}

export function CurrencyDisplay({ value, className }: CurrencyDisplayProps) {
  return (
    <span className={cn("tabular-nums", className)}>
      {formatIDR(value)}
    </span>
  );
}
