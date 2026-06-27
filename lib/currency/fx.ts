import { unstable_cache } from "next/cache";

const FALLBACK_USD_TO_IDR = 15500;

export type CurrencyCode = "IDR" | "USD";

export async function fetchUsdToIdrRate(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=IDR",
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`FX upstream returned ${res.status}`);
    const data = (await res.json()) as { rates?: { IDR?: number } };
    const rate = data.rates?.IDR;
    if (typeof rate !== "number" || rate <= 0) {
      throw new Error("FX rate missing in upstream response");
    }
    return rate;
  } catch {
    return FALLBACK_USD_TO_IDR;
  }
}

export const getUsdToIdrRate = unstable_cache(
  fetchUsdToIdrRate,
  ["fx-usd-idr"],
  { revalidate: 86400 }
);

export async function getEffectiveRate(
  overrideRate?: number | null
): Promise<number> {
  if (typeof overrideRate === "number" && overrideRate > 0) {
    return overrideRate;
  }
  return getUsdToIdrRate();
}