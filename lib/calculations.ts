import { AssetType } from "@/types";

export function calcTotalModal(type: AssetType, quantity: number, buyPrice: number, isNominal: boolean = false, initialCapital: number = 0): number {
  if (isNominal) {
    return initialCapital;
  }
  if (type === "SAHAM") {
    return quantity * 100 * buyPrice;
  }
  return quantity * buyPrice;
}

export function calcCurrentValue(type: AssetType, quantity: number, currentPrice: number): number {
  if (type === "SAHAM") {
    return quantity * 100 * currentPrice;
  }
  return quantity * currentPrice;
}

export function calcGainLoss(currentValue: number, totalModal: number, realizedGain: number = 0): { nominal: number; percent: number } {
  const nominal = (currentValue - totalModal) + realizedGain;
  // If we have totalModal, percent is based on it. If totalModal is 0 but we have realizedGain, we can calculate percent based on the realizedGain?
  // Actually, if totalModal is 0, it means all capital is withdrawn. The percent return could be infinite.
  // We'll stick to totalModal > 0 for percentage, or if totalModal is 0 but we have realizedGain, maybe 100% or infinite. We'll return 0 for now to avoid Infinity.
  const percent = totalModal > 0 ? (nominal / totalModal) * 100 : 0;
  return { nominal, percent };
}
