"use client";

import React, { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

type CurrencyContextType = {
  currency: "IDR" | "USD";
  isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession();
  
  const currency = (data?.user && "currency" in data.user)
    ? (data.user as { currency: string }).currency as "IDR" | "USD"
    : "IDR";

  return (
    <CurrencyContext.Provider value={{ currency, isLoading: isPending }}>
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
