"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

type CurrencyContextType = {
  currency: "IDR" | "USD";
  isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<"IDR" | "USD">("IDR");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserCurrency = async () => {
      try {
        const { data } = await authClient.getSession();
        if (data?.user && "currency" in data.user) {
          setCurrency((data.user as { currency: string }).currency as "IDR" | "USD");
        }
      } catch (error) {
        console.error("Failed to fetch user session for currency", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCurrency();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, isLoading }}>
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
