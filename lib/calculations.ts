import { AssetType, AssetMode } from "@/types";

export function calcTotalModal(type: AssetType, quantity: number, buyPrice: number): number {
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

export function calcGainLoss(currentValue: number, totalModal: number): { nominal: number; percent: number } {
  const nominal = currentValue - totalModal;
  const percent = totalModal > 0 ? (nominal / totalModal) * 100 : 0;
  return { nominal, percent };
}
