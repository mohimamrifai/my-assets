"use client";

import { Banknote } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/providers/CurrencyProvider";

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const t = useTranslations("settings");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("currency")}
          className="text-muted-foreground hover:text-foreground gap-1.5 px-2"
        >
          <Banknote size={16} />
          <span className="text-xs font-semibold tabular-nums">{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {(["IDR", "USD"] as const).map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => setCurrency(code)}
            className={currency === code ? "bg-accent" : ""}
          >
            <span className="flex-1">{code}</span>
            {currency === code && <span className="text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}