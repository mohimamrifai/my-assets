import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { valuations, transactions, assets } from "@/lib/db/schema";
import { calcTotalModal, calcGainLoss, calcReturnBase } from "@/lib/calculations";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const allAssets = await db.query.assets.findMany({
      where: eq(assets.userId, session.user.id),
      with: {
        valuations: {
          orderBy: [desc(valuations.recordedAt)],
        },
        transactions: {
          orderBy: [desc(transactions.date)],
        }
      },
    });

    let netWorth = 0;
    let totalCapital = 0;
    let globalRealizedGain = 0;

    const byMode = {
      investing: { netWorth: 0, totalModal: 0, realizedGain: 0, gainLoss: { nominal: 0, percent: 0 } },
      trading: { netWorth: 0, totalModal: 0, realizedGain: 0, gainLoss: { nominal: 0, percent: 0 } },
    };

    const bySector = {
      SAHAM: { value: 0, percent: 0 },
      CRYPTO: { value: 0, percent: 0 },
      EMAS: { value: 0, percent: 0 },
      REKSA_DANA: { value: 0, percent: 0 },
      P2P: { value: 0, percent: 0 },
      LAINNYA: { value: 0, percent: 0 },
    };

    const allTransactions: (typeof transactions.$inferSelect & { assetName: string })[] = [];
    const allValuations: typeof valuations.$inferSelect[] = [];

    const enrichedAssets = allAssets.map((asset) => {
      const modal =
        asset.mode === "INVESTING"
          ? calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0, asset.isNominal, asset.initialCapital || 0)
          : asset.initialCapital || 0;

      const latestValuation = asset.valuations?.[0];
      const currentValue = latestValuation ? latestValuation.value : modal;
      const assetRealizedGain = asset.transactions?.reduce((sum, t) => sum + (t.realizedGain || 0), 0) || 0;
      const returnBase = calcReturnBase(modal, asset.transactions || []);

      const gainLoss = calcGainLoss(currentValue, modal, assetRealizedGain, returnBase);

      // Aggregate global
      netWorth += currentValue;
      totalCapital += modal;
      globalRealizedGain += assetRealizedGain;

      // Aggregate by Mode
      if (asset.mode === "INVESTING") {
        byMode.investing.netWorth += currentValue;
        byMode.investing.totalModal += modal;
        byMode.investing.realizedGain += assetRealizedGain;
      } else if (asset.mode === "TRADING") {
        byMode.trading.netWorth += currentValue;
        byMode.trading.totalModal += modal;
        byMode.trading.realizedGain += assetRealizedGain;
      }

      // Aggregate by Sector
      if (bySector[asset.type]) {
        bySector[asset.type].value += currentValue;
      }

      if (asset.transactions) {
        allTransactions.push(...asset.transactions.map(t => ({ ...t, assetName: asset.name })));
      }
      if (asset.valuations) {
        allValuations.push(...asset.valuations);
      }

      return {
        ...asset,
        latestValuation: latestValuation || null,
        currentValue,
        totalModal: modal,
        gainLoss,
      };
    });

    // Sort transactions by date desc
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    allValuations.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

    // Calculate Gain/Loss for Modes
    const investingReturnBase = allAssets
      .filter((asset) => asset.mode === "INVESTING")
      .reduce((sum, asset) => {
        const modal = calcTotalModal(
          asset.type,
          asset.quantity || 0,
          asset.buyPrice || 0,
          asset.isNominal,
          asset.initialCapital || 0,
        );

        return sum + calcReturnBase(modal, asset.transactions || []);
      }, 0);

    const tradingReturnBase = allAssets
      .filter((asset) => asset.mode === "TRADING")
      .reduce((sum, asset) => sum + calcReturnBase(asset.initialCapital || 0, asset.transactions || []), 0);

    byMode.investing.gainLoss = calcGainLoss(
      byMode.investing.netWorth,
      byMode.investing.totalModal,
      byMode.investing.realizedGain,
      investingReturnBase,
    );
    byMode.trading.gainLoss = calcGainLoss(
      byMode.trading.netWorth,
      byMode.trading.totalModal,
      byMode.trading.realizedGain,
      tradingReturnBase,
    );

    // Calculate Percentages for Sectors
    if (netWorth > 0) {
      Object.keys(bySector).forEach((key) => {
        bySector[key as keyof typeof bySector].percent = (bySector[key as keyof typeof bySector].value / netWorth) * 100;
      });
    }

    const globalReturnBase = allAssets.reduce((sum, asset) => {
      const modal =
        asset.mode === "INVESTING"
          ? calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0, asset.isNominal, asset.initialCapital || 0)
          : asset.initialCapital || 0;

      return sum + calcReturnBase(modal, asset.transactions || []);
    }, 0);

    const globalGainLoss = calcGainLoss(netWorth, totalCapital, globalRealizedGain, globalReturnBase);

    const dashboardData = {
      netWorth,
      totalCapital,
      totalGainLossNominal: globalGainLoss.nominal,
      totalGainLossPercent: globalGainLoss.percent,
      byMode,
      bySector,
      assets: enrichedAssets,
      allTransactions,
      allValuations
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
