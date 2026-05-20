import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, valuations, transactions } from "@/lib/db/schema";
import { createTransactionSchema } from "@/lib/validations";
import { eq, desc, and } from "drizzle-orm";

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
    const validatedData = createTransactionSchema.parse(body);

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), eq(assets.userId, session.user.id)),
      with: {
        valuations: {
          orderBy: [desc(valuations.recordedAt)],
          limit: 1,
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    if (asset.mode !== "TRADING") {
      return NextResponse.json({ success: false, error: "Transaksi Deposit/Withdraw hanya untuk aset mode Trading" }, { status: 400 });
    }

    const currentCapital = asset.initialCapital || 0;
    const latestValuation = asset.valuations[0]?.value || currentCapital;

    let newCapital = currentCapital;
    let newValuationValue = latestValuation;
    let realizedGain = 0;

    if (validatedData.type === "DEPOSIT") {
      newCapital += validatedData.amount;
      newValuationValue += validatedData.amount;
    } else if (validatedData.type === "WITHDRAWAL") {
      if (validatedData.amount > newValuationValue) {
         return NextResponse.json({ success: false, error: "Saldo tidak mencukupi untuk withdraw" }, { status: 400 });
      }
      
      // Hitung realizedGain jika penarikan melebihi Total Modal saat ini
      if (newCapital - validatedData.amount < 0) {
        realizedGain = validatedData.amount - newCapital;
        newCapital = 0;
      } else {
        newCapital -= validatedData.amount;
      }
      
      newValuationValue -= validatedData.amount;
    } else {
      return NextResponse.json({ success: false, error: "Tipe transaksi tidak valid" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Update Asset Initial Capital
      await tx
        .update(assets)
        .set({ initialCapital: newCapital, updatedAt: new Date() })
        .where(and(eq(assets.id, id), eq(assets.userId, session.user.id)));

      // 2. Record Transaction
      const [insertedTransaction] = await tx
        .insert(transactions)
        .values({
          assetId: id,
          type: validatedData.type,
          amount: validatedData.amount,
          realizedGain: realizedGain > 0 ? realizedGain : null,
          date: validatedData.date,
          fundSource: validatedData.fundSource,
          notes: validatedData.notes,
        })
        .returning();

      // 3. Create Valuation to reflect new balance (maintaining Gain/Loss)
      await tx
        .insert(valuations)
        .values({
          assetId: id,
          value: newValuationValue,
          recordedAt: validatedData.date,
          notes: `Auto-update from ${validatedData.type}`,
        });

      return insertedTransaction;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error processing transaction:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to process transaction" }, { status: 400 });
  }
}
