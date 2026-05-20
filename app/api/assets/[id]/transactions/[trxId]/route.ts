import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, transactions, valuations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const editTransactionSchema = z.object({
  amount: z.number().min(0),
  date: z.coerce.date(),
  fundSource: z.string().optional(),
  notes: z.string().optional(),
  // For BUY/SELL
  quantity: z.number().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; trxId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, trxId } = await params;

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), eq(assets.userId, session.user.id)),
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    const transaction = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, trxId), eq(transactions.assetId, id)),
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { asset, transaction } });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; trxId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, trxId } = await params;
    const body = await request.json();
    const validatedData = editTransactionSchema.parse(body);

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), eq(assets.userId, session.user.id)),
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    const oldTransaction = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, trxId), eq(transactions.assetId, id)),
    });

    if (!oldTransaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      // Adjust asset if amount/quantity changed
      let newCapital = asset.initialCapital || 0;
      let newAssetQuantity = asset.quantity || 0;
      
      const amountDiff = validatedData.amount - oldTransaction.amount;
      const oldQty = oldTransaction.quantity || 0;
      const newQty = validatedData.quantity || oldQty;
      const qtyDiff = newQty - oldQty;

      // Calculate Valuation Value Difference
      let valuationDiff = 0;

      if (oldTransaction.type === "DEPOSIT") {
        newCapital += amountDiff;
        valuationDiff = amountDiff;
      } else if (oldTransaction.type === "WITHDRAWAL") {
        // We might need to recalculate realizedGain if the withdrawal exceeds capital
        // For simplicity, let's assume we just adjust capital first, then bound it to 0
        newCapital -= amountDiff;
        if (newCapital < 0) {
          // If editing makes capital negative, it means part of it is realized gain
          // This requires a full chronological recalculation for perfect accuracy
          // But as a simple approximation, we cap it at 0
          newCapital = 0;
        }
        valuationDiff = -amountDiff;
      } else if (oldTransaction.type === "BUY") {
        newAssetQuantity += qtyDiff;
        valuationDiff = amountDiff;
      } else if (oldTransaction.type === "SELL") {
        newAssetQuantity -= qtyDiff;
        valuationDiff = -amountDiff;
      }

      // Update asset
      await tx
        .update(assets)
        .set({ 
          initialCapital: newCapital,
          quantity: newAssetQuantity,
          updatedAt: new Date()
        })
        .where(and(eq(assets.id, id), eq(assets.userId, session.user.id)));

      // Update transaction
      await tx
        .update(transactions)
        .set({
          amount: validatedData.amount,
          quantity: validatedData.quantity !== undefined ? validatedData.quantity : oldTransaction.quantity,
          date: validatedData.date,
          notes: validatedData.notes,
          fundSource: validatedData.fundSource,
        })
        .where(and(eq(transactions.id, trxId), eq(transactions.assetId, id)));

      // Recalculate subsequent valuations if there is a valuationDiff
      if (valuationDiff !== 0) {
        // Find all valuations after or at the old transaction date
        const subsequentValuations = await db.query.valuations.findMany({
          where: eq(valuations.assetId, id)
        });

        const oldTxTime = new Date(oldTransaction.date).getTime();
        
        for (const val of subsequentValuations) {
          if (new Date(val.recordedAt).getTime() >= oldTxTime) {
            await tx
              .update(valuations)
              .set({ value: Math.max(0, val.value + valuationDiff) })
              .where(eq(valuations.id, val.id));
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to update transaction" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; trxId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, trxId } = await params;

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), eq(assets.userId, session.user.id)),
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    const oldTransaction = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, trxId), eq(transactions.assetId, id)),
    });

    if (!oldTransaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      let newCapital = asset.initialCapital || 0;
      let newAssetQuantity = asset.quantity || 0;
      let valuationDiff = 0;

      if (oldTransaction.type === "DEPOSIT") {
        newCapital -= oldTransaction.amount;
        valuationDiff = -oldTransaction.amount;
      } else if (oldTransaction.type === "WITHDRAWAL") {
        newCapital += (oldTransaction.amount - (oldTransaction.realizedGain || 0));
        valuationDiff = oldTransaction.amount;
      } else if (oldTransaction.type === "BUY") {
        newAssetQuantity -= (oldTransaction.quantity || 0);
        valuationDiff = -oldTransaction.amount;
      } else if (oldTransaction.type === "SELL") {
        newAssetQuantity += (oldTransaction.quantity || 0);
        valuationDiff = oldTransaction.amount;
      }

      await tx
        .update(assets)
        .set({ 
          initialCapital: newCapital,
          quantity: newAssetQuantity,
          updatedAt: new Date()
        })
        .where(and(eq(assets.id, id), eq(assets.userId, session.user.id)));

      await tx.delete(transactions).where(and(eq(transactions.id, trxId), eq(transactions.assetId, id)));

      if (valuationDiff !== 0) {
        const subsequentValuations = await db.query.valuations.findMany({
          where: eq(valuations.assetId, id)
        });

        const oldTxTime = new Date(oldTransaction.date).getTime();
        
        for (const val of subsequentValuations) {
          if (new Date(val.recordedAt).getTime() >= oldTxTime) {
            await tx
              .update(valuations)
              .set({ value: Math.max(0, val.value + valuationDiff) })
              .where(eq(valuations.id, val.id));
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ success: false, error: "Failed to delete transaction" }, { status: 400 });
  }
}
