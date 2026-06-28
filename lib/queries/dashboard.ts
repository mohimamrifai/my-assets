import { db } from "@/lib/db";
import { valuations, transactions, assets } from "@/lib/db/schema";
import { calcTotalModal, calcGainLoss, calcReturnBase } from "@/lib/calculations";
import { desc, eq } from "drizzle-orm";
import type { Asset, Valuation, Transaction } from "@/types";

export type SectorKey = "SAHAM" | "CRYPTO" | "EMAS" | "REKSA_DANA" | "P2P" | "LAINNYA";

export interface DashboardData {
  netWorth: number;
  totalCapital: number;
  totalGainLossNominal: number;
  totalGainLossPercent: number;
  byMode: {
    investing: ModeSummary;
    trading: ModeSummary;
  };
  bySector: Record<SectorKey, { value: number; percent: number }>;
  assets: EnrichedAsset[];
  allTransactions: (Transaction & { assetName: string })[];
  allValuations: Valuation[];
}

export interface ModeSummary {
  netWorth: number;
  totalModal: number;
  realizedGain: number;
  gainLoss: { nominal: number; percent: number };
}

export interface EnrichedAsset extends Asset {
  latestValuation: Valuation | null;
  currentValue: number;
  totalModal: number;
  gainLoss: { nominal: number; percent: number };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const allAssets = await db.query.assets.findMany({
    where: eq(assets.userId, userId),
    with: {
      valuations: { orderBy: [desc(valuations.recordedAt)] },
      transactions: { orderBy: [desc(transactions.date)] },
    },
  });

  let netWorth = 0;
  let totalCapital = 0;
  let globalRealizedGain = 0;

  const byMode: DashboardData["byMode"] = {
    investing: { netWorth: 0, totalModal: 0, realizedGain: 0, gainLoss: { nominal: 0, percent: 0 } },
    trading: { netWorth: 0, totalModal: 0, realizedGain: 0, gainLoss: { nominal: 0, percent: 0 } },
  };

  const bySector: DashboardData["bySector"] = {
    SAHAM: { value: 0, percent: 0 },
    CRYPTO: { value: 0, percent: 0 },
    EMAS: { value: 0, percent: 0 },
    REKSA_DANA: { value: 0, percent: 0 },
    P2P: { value: 0, percent: 0 },
    LAINNYA: { value: 0, percent: 0 },
  };

  const allTransactions: (Transaction & { assetName: string })[] = [];
  const allValuations: Valuation[] = [];

  const enrichedAssets: EnrichedAsset[] = allAssets.map((asset) => {
    const modal =
      asset.mode === "INVESTING"
        ? calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0, asset.isNominal, asset.initialCapital || 0)
        : asset.initialCapital || 0;

    const latestValuation = asset.valuations?.[0] ?? null;
    const currentValue = latestValuation ? latestValuation.value : modal;
    const assetRealizedGain = asset.transactions?.reduce((sum, t) => sum + (t.realizedGain || 0), 0) || 0;
    const returnBase = calcReturnBase(modal, asset.transactions || []);
    const gainLoss = calcGainLoss(currentValue, modal, assetRealizedGain, returnBase);

    netWorth += currentValue;
    totalCapital += modal;
    globalRealizedGain += assetRealizedGain;

    if (asset.mode === "INVESTING") {
      byMode.investing.netWorth += currentValue;
      byMode.investing.totalModal += modal;
      byMode.investing.realizedGain += assetRealizedGain;
    } else if (asset.mode === "TRADING") {
      byMode.trading.netWorth += currentValue;
      byMode.trading.totalModal += modal;
      byMode.trading.realizedGain += assetRealizedGain;
    }

    if (bySector[asset.type as SectorKey]) {
      bySector[asset.type as SectorKey].value += currentValue;
    }

    if (asset.transactions) {
      allTransactions.push(...asset.transactions.map((t) => ({ ...t, assetName: asset.name })));
    }
    if (asset.valuations) {
      allValuations.push(...asset.valuations);
    }

    return {
      ...asset,
      latestValuation,
      currentValue,
      totalModal: modal,
      gainLoss,
    };
  });

  allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  allValuations.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const investingReturnBase = allAssets
    .filter((a) => a.mode === "INVESTING")
    .reduce((sum, a) => {
      const modal = calcTotalModal(a.type, a.quantity || 0, a.buyPrice || 0, a.isNominal, a.initialCapital || 0);
      return sum + calcReturnBase(modal, a.transactions || []);
    }, 0);

  const tradingReturnBase = allAssets
    .filter((a) => a.mode === "TRADING")
    .reduce((sum, a) => sum + calcReturnBase(a.initialCapital || 0, a.transactions || []), 0);

  byMode.investing.gainLoss = calcGainLoss(
    byMode.investing.netWorth, byMode.investing.totalModal, byMode.investing.realizedGain, investingReturnBase
  );
  byMode.trading.gainLoss = calcGainLoss(
    byMode.trading.netWorth, byMode.trading.totalModal, byMode.trading.realizedGain, tradingReturnBase
  );

  if (netWorth > 0) {
    (Object.keys(bySector) as SectorKey[]).forEach((key) => {
      bySector[key].percent = (bySector[key].value / netWorth) * 100;
    });
  }

  const globalReturnBase = allAssets.reduce((sum, a) => {
    const modal = a.mode === "INVESTING"
      ? calcTotalModal(a.type, a.quantity || 0, a.buyPrice || 0, a.isNominal, a.initialCapital || 0)
      : a.initialCapital || 0;
    return sum + calcReturnBase(modal, a.transactions || []);
  }, 0);

  const globalGainLoss = calcGainLoss(netWorth, totalCapital, globalRealizedGain, globalReturnBase);

  return {
    netWorth,
    totalCapital,
    totalGainLossNominal: globalGainLoss.nominal,
    totalGainLossPercent: globalGainLoss.percent,
    byMode,
    bySector,
    assets: enrichedAssets,
    allTransactions,
    allValuations,
  };
}