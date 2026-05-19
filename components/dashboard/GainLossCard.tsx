"use client";

import { Card, CardContent } from "@/components/ui/card";
import { GainLossBadge } from "@/components/shared/GainLossBadge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface GainLossCardProps {
  nominal: number;
  percent: number;
  label?: string;
}

export function GainLossCard({ nominal, percent, label = "Total Return" }: GainLossCardProps) {
  const isPositive = nominal > 0;
  const isNegative = nominal < 0;  
  return (
    <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card to-card/50 shadow-sm transition-all hover:shadow-md rounded-xl px-2 py-0">
      {/* Decorative gradient accents (dynamically colored based on gain/loss status) */}
      <div className={cn(
        "absolute -right-8 -top-8 size-32 rounded-full blur-2xl",
        isPositive ? "bg-emerald-500/10" : 
        isNegative ? "bg-red-500/10" : 
        "bg-slate-500/10"
      )} />
      <div className={cn(
        "absolute -bottom-8 -left-8 size-32 rounded-full blur-2xl",
        isPositive ? "bg-emerald-500/5" : 
        isNegative ? "bg-red-500/5" : 
        "bg-slate-500/5"
      )} />

      <CardContent className="relative z-10 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
          <div className={cn(
            "flex size-7 items-center justify-center rounded",
            isPositive ? "bg-emerald-500/10 text-emerald-600" : 
            isNegative ? "bg-red-500/10 text-red-600" : 
            "bg-muted text-muted-foreground"
          )}>
            {isPositive ? <TrendingUp size={14} /> : 
             isNegative ? <TrendingDown size={14} /> : 
             <Minus size={14} />}
          </div>
        </div>
        
        <div className="flex items-baseline gap-3 mt-1">
          <GainLossBadge 
            nominal={nominal} 
            percent={percent} 
            variant="text" 
            className="text-2xl font-bold tracking-tight"
            showPercent={false}
          />
        </div>

        <div className="flex items-center justify-between text-xs border-t border-border/50 pt-3 mt-2">
          <span className="text-muted-foreground">Persentase</span>
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
