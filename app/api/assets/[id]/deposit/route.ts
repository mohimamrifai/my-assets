import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, transactions, valuations } from "@/lib/db/schema";
import { calcTotalModal } from "@/lib/calculations";

const createAssetDepositSchema = z.object({
  amount: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  buyPrice: z.number().min(0).optional(),
  date: z.coerce.date(),
  fundSource: z.string().optional(),
  notes: z.string().optional(),
});

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
    const validatedData = createAssetDepositSchema.parse(body);

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), eq(assets.userId, session.user.id)),
      with: {
        valuations: {
          orderBy: [desc(valuations.recordedAt)],
          limit: 1,
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    if (asset.status === "SOLD") {
      return NextResponse.json({ success: false, error: "Aset yang sudah terjual habis tidak bisa ditambah lagi" }, { status: 400 });
    }

    const latestValuation = asset.valuations[0]?.value || 0;

    const result = await db.transaction(async (tx) => {
      if (asset.mode === "TRADING") {
        const amount = validatedData.amount;

        if (!amount || amount <= 0) {
          throw new Error("Nominal deposit wajib diisi");
        }

        const newCapital = (asset.initialCapital || 0) + amount;
        const newValuationValue = latestValuation + amount;

        await tx
          .update(assets)
          .set({
            initialCapital: newCapital,
            updatedAt: new Date(),
          })
          .where(and(eq(assets.id, id), eq(assets.userId, session.user.id)));

        await tx.insert(transactions).values({
          assetId: id,
          type: "DEPOSIT",
          amount,
          date: validatedData.date,
          fundSource: validatedData.fundSource,
          notes: validatedData.notes,
        });

        await tx.insert(valuations).values({
          assetId: id,
          value: newValuationValue,
          recordedAt: validatedData.date,
          notes: validatedData.notes || "Auto-update from DEPOSIT",
        });

        return { mode: "TRADING" as const };
      }

      if (asset.isNominal) {
        const amount = validatedData.amount;

        if (!amount || amount <= 0) {
          throw new Error("Nominal deposit wajib diisi");
        }

        const currentCapital = asset.initialCapital || 0;
        const newCapital = currentCapital + amount;
        const newValuationValue = latestValuation + amount;

        await tx
          .update(assets)
          .set({
            initialCapital: newCapital,
            updatedAt: new Date(),
          })
          .where(and(eq(assets.id, id), eq(assets.userId, session.user.id)));

        await tx.insert(transactions).values({
          assetId: id,
          type: "BUY",
          amount,
          date: validatedData.date,
          fundSource: validatedData.fundSource,
          notes: validatedData.notes,
        });

        await tx.insert(valuations).values({
          assetId: id,
          value: newValuationValue,
          recordedAt: validatedData.date,
          notes: validatedData.notes || "Auto-update from BUY",
        });

        return { mode: "INVESTING_NOMINAL" as const };
      }

      const quantity = validatedData.quantity;
      const buyPrice = validatedData.buyPrice;

      if (!quantity || quantity <= 0) {
        throw new Error("Kuantitas deposit wajib diisi");
      }

      if (buyPrice === undefined || buyPrice < 0) {
        throw new Error("Harga beli wajib diisi");
      }

      const currentQuantity = asset.quantity || 0;
      const currentCapital = calcTotalModal(asset.type, currentQuantity, asset.buyPrice || 0);
      const addedCapital = calcTotalModal(asset.type, quantity, buyPrice);
      const newQuantity = currentQuantity + quantity;
      const newCapital = currentCapital + addedCapital;
      const divisor = asset.type === "SAHAM" ? newQuantity * 100 : newQuantity;
      const averagedBuyPrice = divisor > 0 ? newCapital / divisor : asset.buyPrice || 0;
      const newValuationValue = latestValuation + addedCapital;

      await tx
        .update(assets)
        .set({
          quantity: newQuantity,
          buyPrice: averagedBuyPrice,
          updatedAt: new Date(),
        })
        .where(and(eq(assets.id, id), eq(assets.userId, session.user.id)));

      await tx.insert(transactions).values({
        assetId: id,
        type: "BUY",
        amount: addedCapital,
        quantity,
        date: validatedData.date,
        fundSource: validatedData.fundSource,
        notes: validatedData.notes,
      });

      await tx.insert(valuations).values({
        assetId: id,
        value: newValuationValue,
        recordedAt: validatedData.date,
        notes: validatedData.notes || "Auto-update from BUY",
      });

      return { mode: "INVESTING_QUANTITY" as const };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating deposit:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create deposit" },
      { status: 400 },
    );
  }
}
