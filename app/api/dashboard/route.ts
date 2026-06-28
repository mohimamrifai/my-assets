import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDashboardData } from "@/lib/queries/dashboard";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const data = await getDashboardData(session.user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
