import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, valuations, transactions } from "@/lib/db/schema";
import { createAssetSchema } from "@/lib/validations";
import { calcTotalModal, calcGainLoss, calcReturnBase } from "@/lib/calculations";
import { desc, eq, and, isNull, or } from "drizzle-orm";

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
      const returnBase = calcReturnBase(totalModal);

      const gainLoss = calcGainLoss(currentValue, totalModal, 0, returnBase);

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

    const existingInvestingAsset = validatedData.mode === "INVESTING"
      ? await db.query.assets.findFirst({
          where: and(
            eq(assets.userId, session.user.id),
            eq(assets.mode, "INVESTING"),
            eq(assets.type, validatedData.type),
            eq(assets.name, validatedData.name || ""),
            eq(assets.isNominal, validatedData.isNominal),
            validatedData.platformName
              ? eq(assets.platformName, validatedData.platformName)
              : or(eq(assets.platformName, ""), isNull(assets.platformName)),
            eq(assets.status, "ACTIVE"),
          ),
          with: {
            valuations: {
              orderBy: [desc(valuations.recordedAt)],
              limit: 1,
            },
          },
        })
      : null;

    // Start a transaction
    const newAsset = await db.transaction(async (tx) => {
      if (existingInvestingAsset) {
        const addedCapital = validatedData.isNominal
          ? validatedData.initialCapital || 0
          : calcTotalModal(validatedData.type, validatedData.quantity || 0, validatedData.buyPrice || 0);
        const latestValue = existingInvestingAsset.valuations[0]?.value ?? 0;
        const currentQuantity = existingInvestingAsset.quantity || 0;
        const addedQuantity = validatedData.quantity || 0;
        const newQuantity = validatedData.isNominal ? currentQuantity : currentQuantity + addedQuantity;
        const existingCapital = calcTotalModal(
          existingInvestingAsset.type,
          existingInvestingAsset.quantity || 0,
          existingInvestingAsset.buyPrice || 0,
          existingInvestingAsset.isNominal,
          existingInvestingAsset.initialCapital || 0,
        );
        const newCapital = existingCapital + addedCapital;
        const unitDivisor = validatedData.type === "SAHAM" ? newQuantity * 100 : newQuantity;
        const nextBuyPrice = validatedData.isNominal || unitDivisor <= 0 ? existingInvestingAsset.buyPrice : newCapital / unitDivisor;
        const recordedAt = validatedData.buyDate || new Date();

        const [updatedAsset] = await tx
          .update(assets)
          .set({
            quantity: validatedData.isNominal ? existingInvestingAsset.quantity : newQuantity,
            buyPrice: nextBuyPrice,
            initialCapital: validatedData.isNominal ? newCapital : existingInvestingAsset.initialCapital,
            buyDate: existingInvestingAsset.buyDate || validatedData.buyDate,
            platformName: existingInvestingAsset.platformName || validatedData.platformName || null,
            notes: validatedData.notes || existingInvestingAsset.notes,
            updatedAt: new Date(),
          })
          .where(eq(assets.id, existingInvestingAsset.id))
          .returning();

        await tx.insert(valuations).values({
          assetId: existingInvestingAsset.id,
          value: latestValue + addedCapital,
          recordedAt,
          notes: validatedData.notes,
        });

        await tx.insert(transactions).values({
          assetId: existingInvestingAsset.id,
          type: "BUY",
          amount: addedCapital,
          quantity: validatedData.isNominal ? null : addedQuantity,
          fundSource: validatedData.fundSource,
          date: recordedAt,
          notes: validatedData.notes,
        });

        return updatedAsset;
      }

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
          platformName: validatedData.platformName || null,
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
