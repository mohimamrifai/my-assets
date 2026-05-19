export type AssetType = "SAHAM" | "CRYPTO" | "EMAS" | "REKSA_DANA" | "P2P" | "LAINNYA";
export type AssetMode = "INVESTING" | "TRADING";
export type TransactionType = "BUY" | "SELL" | "DEPOSIT" | "WITHDRAWAL" | "UPDATE";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  mode: AssetMode;
  notes?: string | null;
  isNominal: boolean;
  quantity?: number | null;
  buyPrice?: number | null;
  buyDate?: Date | string | null;
  platformName?: string | null;
  initialCapital?: number | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
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
  quantity?: number | null;
  price?: number | null;
  realizedGain?: number | null;
  fundSource?: string | null;
  date: Date | string;
  notes?: string | null;
  createdAt: Date | string;
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
    REKSA_DANA: { value: number; percent: number };
    P2P: { value: number; percent: number };
    LAINNYA: { value: number; percent: number };
  };
  assets: (AssetWithLatestValuation & { currentValue: number; totalModal: number; gainLoss: { nominal: number; percent: number } })[];
  allTransactions: (Transaction & { assetName: string })[];
  allValuations: Valuation[];
}
