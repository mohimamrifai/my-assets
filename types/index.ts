export type AssetType = "SAHAM" | "CRYPTO" | "EMAS";
export type AssetMode = "INVESTING" | "TRADING";
export type TransactionType = "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL" | "UPDATE";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  mode: AssetMode;
  notes: string | null;
  quantity: number | null;
  buyPrice: number | null;
  buyDate: Date | null;
  platformName: string | null;
  initialCapital: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Valuation {
  id: string;
  assetId: string;
  value: number;
  recordedAt: Date;
  notes: string | null;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  assetId: string;
  type: TransactionType;
  amount: number;
  fundSource: string | null;
  date: Date;
  notes: string | null;
  createdAt: Date;
}

export interface AssetWithLatestValuation extends Asset {
  latestValuation?: Valuation | null;
}

export interface DashboardData {
  netWorth: number;
  totalCapital: number;
  totalGainLossNominal: number;
  totalGainLossPercent: number;
  byMode: {
    investing: { netWorth: number; totalModal: number; gainLoss: { nominal: number; percent: number } };
    trading: { netWorth: number; totalModal: number; gainLoss: { nominal: number; percent: number } };
  };
  bySector: {
    SAHAM: { value: number; percent: number };
    CRYPTO: { value: number; percent: number };
    EMAS: { value: number; percent: number };
  };
  assets: (AssetWithLatestValuation & { currentValue: number; totalModal: number; gainLoss: { nominal: number; percent: number } })[];
}
