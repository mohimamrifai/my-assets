import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, valuations, transactions } from "@/lib/db/schema";
import { updateAssetSchema } from "@/lib/validations";
import { eq, asc, desc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, id),
      with: {
        valuations: {
          orderBy: [asc(valuations.recordedAt)],
        },
        transactions: {
          orderBy: [desc(transactions.date)],
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    console.error("Error fetching asset details:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
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
    
    // Add id to body for validation if not present
    const dataToValidate = { ...body, id };
    const validatedData = updateAssetSchema.parse(dataToValidate);

    const [updatedAsset] = await db
      .update(assets)
      .set({
        name: validatedData.name,
        type: validatedData.type,
        mode: validatedData.mode,
        notes: validatedData.notes,
        quantity: validatedData.quantity,
        buyPrice: validatedData.buyPrice,
        buyDate: validatedData.buyDate,
        platformName: validatedData.platformName,
        initialCapital: validatedData.initialCapital,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, id))
      .returning();

    if (!updatedAsset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedAsset });
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json({ success: false, error: "Failed to update asset" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deletedAsset] = await db
      .delete(assets)
      .where(eq(assets.id, id))
      .returning();

    if (!deletedAsset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedAsset });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
