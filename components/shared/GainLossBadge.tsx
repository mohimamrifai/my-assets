import { TrendingDown, TrendingUp } from "lucide-react";
import { formatIDR, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  const isPositive = nominal >= 0;
  
  const content = (
    <>
      {isPositive ? (
        <TrendingUp size={16} data-icon="inline-start" className="mr-1" aria-hidden="true" />
      ) : (
        <TrendingDown size={16} data-icon="inline-start" className="mr-1" aria-hidden="true" />
      )}
      <span>
        {showNominal && formatIDR(Math.abs(nominal))}
        {showNominal && showPercent && " ("}
        {showPercent && formatPercent(percent)}
        {showNominal && showPercent && ")"}
      </span>
    </>
  );

  if (variant === "text") {
    return (
      <div className={cn(
        "flex items-center font-medium",
        isPositive ? "text-[#22C55E]" : "text-[#EF4444]",
        className
      )}>
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
          ? "bg-[#22C55E]/10 text-[#22C55E]" 
          : "bg-[#EF4444]/10 text-[#EF4444]",
        className
      )}
    >
      {content}
    </Badge>
  );
}
