"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useMounted } from "@/hooks/useMounted";

type LocaleCode = "en" | "id";
type CurrencyCode = "IDR" | "USD";

interface FxRateResponse {
  rate: number;
  source: string;
  pair: string;
  fetchedAt: string;
}

export function SettingsClient() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const intlLocale = useLocale() as LocaleCode;
  const mounted = useMounted();
  const { data: session } = authClient.useSession();
  const { currency, fxRateOverride, setCurrency, setFxRateOverride } = useCurrency();
  const [, startTransition] = useTransition();

  const [fxRate, setFxRate] = useState<FxRateResponse | null>(null);
  const [overrideValue, setOverrideValue] = useState<string>(
    fxRateOverride ? String(fxRateOverride) : ""
  );
  const [savingOverride, setSavingOverride] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    fetch("/api/fx-rate")
      .then((r) => r.json())
      .then((data: FxRateResponse) => {
        if (!cancelled) setFxRate(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const handleCurrencySelect = (next: CurrencyCode) => {
    if (next === currency) return;
    startTransition(() => {
      setCurrency(next).then(() => toast.success(t("saved")));
    });
  };

  const handleOverrideSave = () => {
    if (overrideValue.trim() === "") return;
    const num = Number(overrideValue);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error(tErrors("fxOverrideInvalid"));
      return;
    }
    setSavingOverride(true);
    startTransition(() => {
      setFxRateOverride(num)
        .then(() => toast.success(t("saved")))
        .finally(() => setSavingOverride(false));
    });
  };

  const handleResetOverride = () => {
    setSavingOverride(true);
    startTransition(() => {
      setFxRateOverride(null)
        .then(() => {
          setOverrideValue("");
          toast.success(t("saved"));
        })
        .finally(() => setSavingOverride(false));
    });
  };

  const formatRate = (n: number) =>
    new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">{t("profileName")}</Label>
            <p className="text-sm font-medium mt-1">{session?.user?.name ?? "—"}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">{t("profileEmail")}</Label>
            <p className="text-sm font-medium mt-1">{session?.user?.email ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("preferences")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">{t("language")}</Label>
              <p className="text-xs text-muted-foreground mt-1">{t("languageDescription")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { code: "en", label: "English" },
                  { code: "id", label: "Bahasa Indonesia" },
                ] as { code: LocaleCode; label: string }[]
              ).map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => useCurrencyHelpers.setLocaleFromButton(code, intlLocale)}
                  className={cn(
                    "rounded-md border px-3 py-3 text-sm font-medium text-left transition-colors",
                    intlLocale === code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">{t("currency")}</Label>
              <p className="text-xs text-muted-foreground mt-1">{t("currencyDescription")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["IDR", "USD"] as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleCurrencySelect(code)}
                  disabled={savingOverride}
                  className={cn(
                    "rounded-md border px-3 py-3 text-sm font-medium text-left transition-colors",
                    currency === code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{code}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {code === "IDR" ? "Rp" : "$"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("exchangeRate")}</CardTitle>
          <CardDescription>{t("exchangeRateDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {t("exchangeRateCurrent")}
                </p>
                <p className="text-xl font-semibold tabular-nums mt-1">
                  1 USD = {fxRate ? formatRate(fxRate.rate) : "—"} IDR
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("exchangeRateAuto")}
                  {fxRate?.fetchedAt &&
                    ` · ${new Date(fxRate.fetchedAt).toLocaleString(intlLocale)}`}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fx-override" className="text-sm font-medium">
              {t("exchangeRateOverride")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="fx-override"
                type="number"
                inputMode="decimal"
                min="1"
                step="any"
                placeholder={t("exchangeRatePlaceholder")}
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                disabled={savingOverride}
                className="tabular-nums"
              />
              <Button
                onClick={handleOverrideSave}
                disabled={savingOverride || overrideValue.trim() === ""}
                size="sm"
              >
                {savingOverride ? <Loader2 className="size-4 animate-spin" /> : tCommon("save")}
              </Button>
            </div>
            {fxRateOverride !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetOverride}
                disabled={savingOverride}
                className="text-muted-foreground"
              >
                <RefreshCw size={14} className="mr-2" />
                {t("exchangeRateReset")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const useCurrencyHelpers = {
  setLocaleFromButton: (code: LocaleCode, current: LocaleCode) => {
    if (code === current) return;
    window.location.href = window.location.pathname.replace(
      /^\/(en|id)/,
      `/${code}`
    );
  },
};