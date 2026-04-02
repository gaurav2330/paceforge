import { NextResponse } from "next/server";
import { getStreak } from "../../../../lib/db/stats";

export async function GET() {
  try {
    const streak = await getStreak();
    return NextResponse.json({
      data: { ...streak, weeklyGoal: 4 },
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to compute streak" },
      { status: 500 }
    );
  }
}
