import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, valuations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createValuationSchema } from "@/lib/validations";
import { calcCurrentValue } from "@/lib/calculations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; valId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, valId } = await params;

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), eq(assets.userId, session.user.id)),
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    const valuation = await db.query.valuations.findFirst({
      where: and(eq(valuations.id, valId), eq(valuations.assetId, id)),
    });

    if (!valuation) {
      return NextResponse.json({ success: false, error: "Valuation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { asset, valuation } });
  } catch (error) {
    console.error("Error fetching valuation:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; valId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, valId } = await params;
    const body = await request.json();
    const validatedData = createValuationSchema.parse(body);

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), eq(assets.userId, session.user.id)),
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    let calculatedValue = validatedData.value;
    
    // If investing, the input value is the price per unit. We need to calculate total.
    if (asset.mode === "INVESTING") {
      calculatedValue = calcCurrentValue(asset.type, asset.quantity || 0, validatedData.value);
    }

    const updatedValuation = await db
      .update(valuations)
      .set({
        value: calculatedValue,
        recordedAt: validatedData.recordedAt,
        notes: validatedData.notes,
      })
      .where(and(eq(valuations.id, valId), eq(valuations.assetId, id)))
      .returning();

    return NextResponse.json({ success: true, data: updatedValuation[0] });
  } catch (error) {
    console.error("Error updating valuation:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to update valuation" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; valId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, valId } = await params;

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), eq(assets.userId, session.user.id)),
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    await db.delete(valuations).where(and(eq(valuations.id, valId), eq(valuations.assetId, id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting valuation:", error);
    return NextResponse.json({ success: false, error: "Failed to delete valuation" }, { status: 400 });
  }
}
