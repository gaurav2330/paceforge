import { NextResponse } from "next/server";
import { getStreak } from "../../../../lib/db/stats";

export async function GET() {
  console.log('[GET /api/stats/streak] received request');
  try {
    const streak = await getStreak();
    console.log('[GET /api/stats/streak] result:', streak);
    return NextResponse.json({
      data: { ...streak, weeklyGoal: 4 },
      success: true,
    });
  } catch (err) {
    console.error('[GET /api/stats/streak] ✗ DB error:', err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to compute streak" },
      { status: 500 }
    );
  }
}
