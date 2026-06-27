"use client";

import { Languages } from "lucide-react";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/providers/CurrencyProvider";

const labels: Record<string, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const { setLocale } = useCurrency();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (next: "en" | "id") => {
    if (next === locale) return;
    startTransition(() => {
      setLocale(next);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("theme")}
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground"
        >
          <Languages size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {(["en", "id"] as const).map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => handleSelect(code)}
            className={locale === code ? "bg-accent" : ""}
          >
            <span className="flex-1">{labels[code]}</span>
            {locale === code && <span className="text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}