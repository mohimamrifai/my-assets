import { AssetType } from "@/types";

type ReturnTransaction = {
  type: "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL" | "UPDATE";
  amount: number;
  realizedGain?: number | null;
};

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

export function calcReturnBase(
  totalModal: number,
  transactions: ReturnTransaction[] = [],
): number {
  const principalRecovered = transactions.reduce((sum, transaction) => {
    if (transaction.type !== "SELL" && transaction.type !== "WITHDRAWAL") {
      return sum;
    }

    return sum + (transaction.amount - (transaction.realizedGain || 0));
  }, 0);

  return totalModal + principalRecovered;
}

export function calcGainLoss(
  currentValue: number,
  totalModal: number,
  realizedGain: number = 0,
  returnBase: number = totalModal,
): { nominal: number; percent: number } {
  const nominal = (currentValue - totalModal) + realizedGain;
  const percent = returnBase > 0 ? (nominal / returnBase) * 100 : 0;
  return { nominal, percent };
}
