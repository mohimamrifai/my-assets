import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, valuations, transactions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { calcTotalModal } from "@/lib/calculations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // Sell params
    // amount: total nominal received from selling
    // quantitySold: quantity sold (if not nominal based)
    // date: sell date
    // notes: optional notes
    const { amount, quantitySold, price, date, fundSource, notes } = body;

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), eq(assets.userId, session.user.id)),
      with: {
        valuations: {
          orderBy: [desc(valuations.recordedAt)],
          limit: 1,
        }
      }
    });

    if (!asset || asset.mode !== "INVESTING" || asset.status === "SOLD") {
      return NextResponse.json({ success: false, error: "Invalid asset for selling" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      let realizedGain = 0;
      let isSoldOut = false;
      let newQuantity = asset.quantity;
      let newInitialCapital = asset.initialCapital;
      let newValuationValue = 0;
      let newBuyPrice = asset.buyPrice;
      let finalAmount = amount;
      const latestValue = asset.valuations[0]?.value
        || calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0, asset.isNominal, asset.initialCapital || 0);
      const currentCapital = asset.isNominal
        ? asset.initialCapital || 0
        : calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0);

      if (!amount || amount <= 0) {
        throw new Error("Nominal penjualan tidak valid");
      }

      if (asset.isNominal) {
        if (amount > latestValue) {
          throw new Error("Nominal penjualan melebihi nilai aset saat ini");
        }

        const currentProfit = Math.max(0, latestValue - currentCapital);
        const principalReduction = Math.max(0, amount - currentProfit);

        realizedGain = amount - principalReduction;
        newInitialCapital = Math.max(0, currentCapital - principalReduction);
        newValuationValue = Math.max(0, latestValue - amount);
        isSoldOut = newValuationValue <= 0;
        if (isSoldOut) {
          newInitialCapital = 0;
          newValuationValue = 0;
        }
      } else {
        if (!quantitySold || quantitySold <= 0) {
          throw new Error("Quantity to sell is required");
        }

        if (!price || price <= 0) {
          throw new Error("Harga jual tidak valid");
        }

        if (quantitySold > (asset.quantity || 0)) {
          throw new Error("Kuantitas penjualan melebihi kepemilikan aset");
        }

        finalAmount = amount || calcTotalModal(asset.type, quantitySold, price);
        const soldCostBasis = calcTotalModal(asset.type, quantitySold, asset.buyPrice || 0);
        realizedGain = finalAmount - soldCostBasis;
        newInitialCapital = Math.max(0, currentCapital - soldCostBasis);

        if (quantitySold >= (asset.quantity || 0)) {
          isSoldOut = true;
          newQuantity = 0;
          newInitialCapital = 0;
          newValuationValue = 0;
        } else {
          newQuantity = (asset.quantity || 0) - quantitySold;
          newValuationValue = calcTotalModal(asset.type, newQuantity, price);
          const unitDivisor = asset.type === "SAHAM" ? newQuantity * 100 : newQuantity;
          newBuyPrice = unitDivisor > 0 ? newInitialCapital / unitDivisor : asset.buyPrice;
        }

        if (quantitySold >= (asset.quantity || 0)) {
          // Full exit: all remaining P/L is realized into the SELL transaction.
          newValuationValue = 0;
        }
      }

      // 1. Update Asset
      await tx
        .update(assets)
        .set({ 
          quantity: newQuantity,
          buyPrice: newBuyPrice,
          initialCapital: newInitialCapital,
          status: isSoldOut ? "SOLD" : "ACTIVE",
          updatedAt: new Date() 
        })
        .where(and(eq(assets.id, id), eq(assets.userId, session.user.id)));

      // 2. Record Transaction
      await tx
        .insert(transactions)
        .values({
          assetId: id,
          type: "SELL",
          amount: finalAmount,
          quantity: quantitySold || null,
          price: price || null,
          realizedGain: realizedGain,
          fundSource: fundSource || null,
          date: new Date(date),
          notes: notes || `Penjualan aset`,
        });

      // 3. Create Valuation to reflect new balance
      await tx
        .insert(valuations)
        .values({
          assetId: id,
          value: newValuationValue,
          recordedAt: new Date(date),
          notes: `Auto-update from SELL`,
        });

      return { realizedGain, isSoldOut };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error selling asset:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to sell asset" }, { status: 400 });
  }
}
