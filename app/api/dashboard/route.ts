import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { valuations } from "@/lib/db/schema";
import { calcTotalModal, calcGainLoss } from "@/lib/calculations";
import { desc } from "drizzle-orm";
import { DashboardData } from "@/types";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const allAssets = await db.query.assets.findMany({
      with: {
        valuations: {
          orderBy: [desc(valuations.recordedAt)],
          limit: 1,
        },
      },
    });

    let netWorth = 0;
    let totalCapital = 0;

    const byMode = {
      investing: { netWorth: 0, totalModal: 0, gainLoss: { nominal: 0, percent: 0 } },
      trading: { netWorth: 0, totalModal: 0, gainLoss: { nominal: 0, percent: 0 } },
    };

    const bySector = {
      SAHAM: { value: 0, percent: 0 },
      CRYPTO: { value: 0, percent: 0 },
      EMAS: { value: 0, percent: 0 },
    };

    const enrichedAssets = allAssets.map((asset) => {
      const modal =
        asset.mode === "INVESTING"
          ? calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0)
          : asset.initialCapital || 0;

      const latestValuation = asset.valuations?.[0];
      const currentValue = latestValuation ? latestValuation.value : modal;

      const gainLoss = calcGainLoss(currentValue, modal);

      // Aggregate global
      netWorth += currentValue;
      totalCapital += modal;

      // Aggregate by Mode
      if (asset.mode === "INVESTING") {
        byMode.investing.netWorth += currentValue;
        byMode.investing.totalModal += modal;
      } else if (asset.mode === "TRADING") {
        byMode.trading.netWorth += currentValue;
        byMode.trading.totalModal += modal;
      }

      // Aggregate by Sector
      if (asset.type === "SAHAM") bySector.SAHAM.value += currentValue;
      else if (asset.type === "CRYPTO") bySector.CRYPTO.value += currentValue;
      else if (asset.type === "EMAS") bySector.EMAS.value += currentValue;

      return {
        ...asset,
        latestValuation: latestValuation || null,
        currentValue,
        totalModal: modal,
        gainLoss,
      };
    });

    // Calculate Gain/Loss for Modes
    byMode.investing.gainLoss = calcGainLoss(byMode.investing.netWorth, byMode.investing.totalModal);
    byMode.trading.gainLoss = calcGainLoss(byMode.trading.netWorth, byMode.trading.totalModal);

    // Calculate Percentages for Sectors
    if (netWorth > 0) {
      bySector.SAHAM.percent = (bySector.SAHAM.value / netWorth) * 100;
      bySector.CRYPTO.percent = (bySector.CRYPTO.value / netWorth) * 100;
      bySector.EMAS.percent = (bySector.EMAS.value / netWorth) * 100;
    }

    const globalGainLoss = calcGainLoss(netWorth, totalCapital);

    const dashboardData = {
      netWorth,
      totalCapital,
      totalGainLossNominal: globalGainLoss.nominal,
      totalGainLossPercent: globalGainLoss.percent,
      byMode,
      bySector,
      assets: enrichedAssets,
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
