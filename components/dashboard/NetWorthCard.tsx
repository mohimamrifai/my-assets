"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";
import { Wallet } from "lucide-react";

interface NetWorthCardProps {
  netWorth: number;
  totalModal: number;
}

export function NetWorthCard({ netWorth, totalModal }: NetWorthCardProps) {
  const { currency } = useCurrency();

  return (
    <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card to-card/50 shadow-sm transition-all hover:shadow-md rounded-xl px-2 py-0">
      {/* Decorative gradient accents */}
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-emerald-500/5 blur-2xl" />
      
      <CardContent className="relative z-10 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Net Worth</span>
          <div className="flex size-7 items-center justify-center rounded bg-emerald-500/10 text-emerald-600">
            <Wallet size={14} />
          </div>
        </div>
        
        <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
          {formatCurrency(netWorth, currency)}
        </div>
        
        <div className="flex items-center justify-between text-xs mt-2 pt-3 border-t border-border/50">
          <span className="text-muted-foreground">Total Modal</span>
          <span className="font-medium text-foreground">{formatCurrency(totalModal, currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
