"use client";

import { Card, CardContent } from "@/components/ui/card";
import { GainLossBadge } from "@/components/shared/GainLossBadge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface GainLossCardProps {
  nominal: number;
  percent: number;
  label?: string;
}

export function GainLossCard({ nominal, percent, label }: GainLossCardProps) {
  const isPositive = nominal > 0;
  const isNegative = nominal < 0;
  const t = useTranslations("dashboard");
  const displayLabel = label ?? t("totalReturn");

  return (
    <Card className="border border-border bg-card rounded-xl shadow-sm">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {displayLabel}
          </span>
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-md",
              isPositive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              isNegative && "bg-red-500/10 text-red-600 dark:text-red-400",
              !isPositive && !isNegative && "bg-muted text-muted-foreground"
            )}
          >
            {isPositive ? (
              <TrendingUp size={14} strokeWidth={2.25} />
            ) : isNegative ? (
              <TrendingDown size={14} strokeWidth={2.25} />
            ) : (
              <Minus size={14} strokeWidth={2.25} />
            )}
          </div>
        </div>

        <GainLossBadge
          nominal={nominal}
          percent={percent}
          variant="text"
          showPercent={false}
          className="text-3xl font-bold tracking-tight"
        />

        <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
          <span className="text-muted-foreground">{t("percent")}</span>
          <GainLossBadge
            nominal={nominal}
            percent={percent}
            showNominal={false}
            className="px-2 py-0.5 text-xs rounded-md font-semibold"
          />
        </div>
      </CardContent>
    </Card>
  );
}