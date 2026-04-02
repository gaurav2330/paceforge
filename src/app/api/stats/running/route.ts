import { NextResponse } from "next/server";
import { getRunningStats } from "../../../../lib/db/stats";

export async function GET() {
  try {
    const stats = await getRunningStats();
    return NextResponse.json({ data: stats, success: true });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to compute running stats" },
      { status: 500 }
    );
  }
}
