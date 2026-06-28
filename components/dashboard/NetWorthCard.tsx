"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/formatters";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

interface NetWorthCardProps {
  netWorth: number;
  totalModal: number;
}

export function NetWorthCard({ netWorth, totalModal }: NetWorthCardProps) {
  const { currency, fxRate } = useCurrency();
  const t = useTranslations("dashboard");

  return (
    <Card className="border border-border bg-card rounded-xl shadow-sm">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("netWorth")}
          </span>
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Wallet size={14} strokeWidth={2.25} />
          </div>
        </div>

        <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {formatCurrency(netWorth, { display: currency, rate: fxRate })}
        </div>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
          <span className="text-muted-foreground">{t("totalCapital")}</span>
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(totalModal, { display: currency, rate: fxRate })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}