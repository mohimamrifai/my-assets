import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, valuations, transactions } from "@/lib/db/schema";
import { createAssetSchema } from "@/lib/validations";
import { calcTotalModal, calcGainLoss } from "@/lib/calculations";
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
          limit: 1,
        },
      },
    });

    const enrichedAssets = allAssets.map((asset) => {
      const totalModal =
        asset.mode === "INVESTING"
          ? calcTotalModal(asset.type, asset.quantity || 0, asset.buyPrice || 0, asset.isNominal, asset.initialCapital || 0)
          : asset.initialCapital || 0;

      const latestValuation = asset.valuations?.[0];
      const currentValue = latestValuation ? latestValuation.value : totalModal;

      const gainLoss = calcGainLoss(currentValue, totalModal);

      return {
        ...asset,
        latestValuation: latestValuation || null,
        currentValue,
        totalModal,
        gainLoss,
      };
    });

    return NextResponse.json({ success: true, data: enrichedAssets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAssetSchema.parse(body);

    // Start a transaction
    const newAsset = await db.transaction(async (tx) => {
      const [insertedAsset] = await tx
        .insert(assets)
        .values({
          userId: session.user.id,
          name: validatedData.name || "",
          type: validatedData.type,
          mode: validatedData.mode,
          notes: validatedData.notes,
          isNominal: validatedData.isNominal,
          quantity: validatedData.quantity,
          buyPrice: validatedData.buyPrice,
          buyDate: validatedData.buyDate,
          platformName: validatedData.platformName,
          initialCapital: validatedData.initialCapital,
        })
        .returning();

      let initialValue = 0;
      let transactionType: "BUY" | "DEPOSIT" = "BUY";

      // For Investing:
      // If it's nominal, the initialValue is initialCapital
      // If it's quantity based, the initialValue is quantity * buyPrice * multiplier
      // For Trading:
      // initialValue is initialCapital
      
      if (insertedAsset.mode === "INVESTING") {
        if (validatedData.isNominal) {
          initialValue = insertedAsset.initialCapital || 0;
        } else {
          initialValue = calcTotalModal(insertedAsset.type, insertedAsset.quantity || 0, insertedAsset.buyPrice || 0);
        }
        transactionType = "BUY";
      } else if (insertedAsset.mode === "TRADING") {
        initialValue = insertedAsset.initialCapital || 0;
        transactionType = "DEPOSIT";
      }

      const recordedAt = insertedAsset.buyDate || new Date();

      await tx.insert(valuations).values({
        assetId: insertedAsset.id,
        value: initialValue,
        recordedAt,
        notes: validatedData.notes,
      });

      await tx.insert(transactions).values({
        assetId: insertedAsset.id,
        type: transactionType,
        amount: initialValue,
        date: recordedAt,
        fundSource: validatedData.fundSource,
        notes: validatedData.notes,
      });

      return insertedAsset;
    });

    return NextResponse.json({ success: true, data: newAsset });
  } catch (error) {
    console.error("Error creating asset:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to create asset" }, { status: 400 });
  }
}
