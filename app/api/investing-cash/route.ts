import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { investingCash, investingCashTransactions } from "@/lib/db/schema";
import { createTransactionSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let cashRow = await db.query.investingCash.findFirst();
    if (!cashRow) {
      // Create it if it doesn't exist
      const [newRow] = await db.insert(investingCash).values({ balance: 0 }).returning();
      cashRow = newRow;
    }

    const recentTransactions = await db.query.investingCashTransactions.findMany({
      orderBy: (tx, { desc }) => [desc(tx.date), desc(tx.createdAt)],
      limit: 10,
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        balance: cashRow.balance,
        transactions: recentTransactions
      } 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to fetch cash balance" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      let cashRow = await tx.query.investingCash.findFirst();
      if (!cashRow) {
        const [newRow] = await tx.insert(investingCash).values({ balance: 0 }).returning();
        cashRow = newRow;
      }

      let newBalance = cashRow.balance;
      if (validatedData.type === "DEPOSIT") {
        newBalance += validatedData.amount;
      } else if (validatedData.type === "WITHDRAWAL") {
        if (validatedData.amount > newBalance) {
          throw new Error("Saldo Kas Investing tidak mencukupi");
        }
        newBalance -= validatedData.amount;
      } else {
        throw new Error("Invalid transaction type");
      }

      await tx.update(investingCash)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(investingCash.id, cashRow.id));

      const [insertedTx] = await tx.insert(investingCashTransactions).values({
        type: validatedData.type as "DEPOSIT" | "WITHDRAWAL",
        amount: validatedData.amount,
        date: validatedData.date,
        notes: validatedData.notes,
      }).returning();

      return { balance: newBalance, transaction: insertedTx };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to process cash transaction" }, { status: 400 });
  }
}
