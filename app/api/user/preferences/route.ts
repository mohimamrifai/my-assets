import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const preferencesSchema = z.object({
  locale: z.enum(["en", "id"]).optional(),
  currency: z.enum(["IDR", "USD"]).optional(),
  fxRateOverride: z.number().positive().nullable().optional(),
});

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.locale !== undefined) updates.locale = parsed.data.locale;
  if (parsed.data.currency !== undefined) updates.currency = parsed.data.currency;
  if (parsed.data.fxRateOverride !== undefined) {
    updates.fxRateOverride = parsed.data.fxRateOverride;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db
    .update(userTable)
    .set(updates)
    .where(eq(userTable.id, session.user.id));

  return NextResponse.json({ success: true });
}