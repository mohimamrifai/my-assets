import { NextResponse } from "next/server";
import { getUsdToIdrRate } from "@/lib/currency/fx";

export async function GET() {
  try {
    const rate = await getUsdToIdrRate();
    return NextResponse.json({
      rate,
      source: "frankfurter",
      pair: "USD/IDR",
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "FX rate unavailable" },
      { status: 503 }
    );
  }
}