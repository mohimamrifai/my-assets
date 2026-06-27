"use client";

import React, { createContext, useContext, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "next-intl";

type CurrencyCode = "IDR" | "USD";
type LocaleCode = "en" | "id";

interface UserPreferences {
  currency: CurrencyCode;
  fxRateOverride: number | null;
}

interface CurrencyContextType extends UserPreferences {
  locale: LocaleCode;
  isLoading: boolean;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  setFxRateOverride: (rate: number | null) => Promise<void>;
  setLocale: (locale: LocaleCode) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const intlLocale = useLocale() as LocaleCode;

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const userCurrency = (data?.user as { currency?: string } | undefined)?.currency;
    return userCurrency === "USD" ? "USD" : "IDR";
  });
  const [fxRateOverride, setFxRateOverrideState] = useState<number | null>(() => {
    return ((data?.user as { fxRateOverride?: number | null } | undefined)?.fxRateOverride) ?? null;
  });

  const persist = useCallback(
    async (payload: Partial<UserPreferences> & { locale?: LocaleCode }) => {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }
    },
    []
  );

  const setCurrency = useCallback(
    async (next: CurrencyCode) => {
      setCurrencyState(next);
      try {
        await persist({ currency: next });
        router.refresh();
      } catch {
        router.refresh();
      }
    },
    [persist, router]
  );

  const setFxRateOverride = useCallback(
    async (next: number | null) => {
      setFxRateOverrideState(next);
      try {
        await persist({ fxRateOverride: next });
        router.refresh();
      } catch {
        router.refresh();
      }
    },
    [persist, router]
  );

  const setLocale = useCallback(
    async (locale: LocaleCode) => {
      try {
        await persist({ locale });
      } catch {
        // Continue navigation even if persist fails
      }
      const targetPath = window.location.pathname.replace(/^\/(en|id)/, `/${locale}`);
      window.location.href = targetPath;
    },
    [persist]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        fxRateOverride,
        locale: intlLocale,
        isLoading: isPending,
        setCurrency,
        setFxRateOverride,
        setLocale,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}