import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, valuations, transactions } from "@/lib/db/schema";
import { createValuationSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { calcCurrentValue } from "@/lib/calculations";

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
    const validatedData = createValuationSchema.parse(body);

    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, id),
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    let calculatedValue = validatedData.value;
    
    // If investing, the input value is the price per unit. We need to calculate total.
    if (asset.mode === "INVESTING") {
      calculatedValue = calcCurrentValue(asset.type, asset.quantity || 0, validatedData.value);
    }

    const newValuation = await db.transaction(async (tx) => {
      const [insertedValuation] = await tx
        .insert(valuations)
        .values({
          assetId: id,
          value: calculatedValue,
          recordedAt: validatedData.recordedAt,
          notes: validatedData.notes,
        })
        .returning();

      // For trading, we might want to record the difference, but the requirement says "insert record transactions dengan type UPDATE"
      // Wait, amount in transaction? Let's just put the calculatedValue or 0. The prompt doesn't specify the amount for UPDATE transaction.
      // Let's use the new calculatedValue for the transaction amount.
      await tx
        .insert(transactions)
        .values({
          assetId: id,
          type: "UPDATE",
          amount: calculatedValue,
          date: validatedData.recordedAt,
          notes: validatedData.notes || "Value update",
        });

      return insertedValuation;
    });

    return NextResponse.json({ success: true, data: newValuation });
  } catch (error) {
    console.error("Error adding valuation:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to add valuation" }, { status: 400 });
  }
}
