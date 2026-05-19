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
    const { amount, quantitySold, date, notes } = body;

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

      if (asset.isNominal) {
        // Nominal selling
        if (amount >= (asset.initialCapital || 0)) {
          // Sell all
          realizedGain = amount - (asset.initialCapital || 0);
          isSoldOut = true;
          newInitialCapital = 0;
          newValuationValue = 0;
        } else {
          // Sell partial
          // To calculate gain/loss for partial nominal sell, we need to know the current value.
          // Wait, if it's nominal, initialCapital is the cost.
          // If they sell a portion of it... how do we know the cost basis of the sold portion?
          // For simplicity, let's say they just reduce the initialCapital by the proportion of the sell amount vs current value.
          const latestValue = asset.valuations[0]?.value || (asset.initialCapital || 0);
          const sellProportion = amount / latestValue;
          
          const costBasis = (asset.initialCapital || 0) * sellProportion;
          realizedGain = amount - costBasis;
          
          newInitialCapital = (asset.initialCapital || 0) - costBasis;
          newValuationValue = latestValue - amount;
        }
      } else {
        // Quantity based selling
        if (!quantitySold || quantitySold <= 0) {
          throw new Error("Quantity to sell is required");
        }
        
        if (quantitySold >= (asset.quantity || 0)) {
          // Sell all
          const totalCost = calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0);
          realizedGain = amount - totalCost;
          isSoldOut = true;
          newQuantity = 0;
          newValuationValue = 0;
        } else {
          // Sell partial
          const costBasis = calcTotalModal(asset.type, quantitySold, asset.buyPrice || 0);
          realizedGain = amount - costBasis;
          newQuantity = (asset.quantity || 0) - quantitySold;
          
          // Adjust valuation value proportionally
          const latestValue = asset.valuations[0]?.value || calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0);
          const currentPricePerUnit = latestValue / (asset.type === "SAHAM" ? (asset.quantity || 1) * 100 : (asset.quantity || 1));
          newValuationValue = calcTotalModal(asset.type, newQuantity, currentPricePerUnit);
        }
      }

      // 1. Update Asset
      await tx
        .update(assets)
        .set({ 
          quantity: newQuantity,
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
          amount: amount,
          quantity: quantitySold || null,
          realizedGain: realizedGain,
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
