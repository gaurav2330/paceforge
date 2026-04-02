import { NextResponse } from "next/server";
import { getRecentActivity } from "../../../../lib/db/coach";
import { getCoachingFeedback } from "../../../../lib/coach";

export async function POST() {
  try {
    const activity = await getRecentActivity(30);

    if (activity.runs.length === 0 && activity.workouts.length === 0) {
      return NextResponse.json(
        {
          error: "NO_DATA",
          message: "No runs or workouts found in the last 30 days",
        },
        { status: 422 }
      );
    }

    let feedback: string;
    try {
      feedback = await getCoachingFeedback(activity);
    } catch {
      return NextResponse.json(
        { error: "AI_UNAVAILABLE", message: "Could not reach AI coach" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      data: {
        feedback,
        generatedAt: new Date().toISOString(),
      },
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to generate coaching report" },
      { status: 500 }
    );
  }
}
