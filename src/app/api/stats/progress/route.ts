import { NextRequest, NextResponse } from "next/server";
import { getLiftProgress } from "../../../../lib/db/stats";

export async function GET(request: NextRequest) {
  const exercise = request.nextUrl.searchParams.get("exercise");

  if (!exercise || exercise.trim() === "") {
    return NextResponse.json(
      { error: "MISSING_PARAM", message: "exercise query param is required" },
      { status: 400 }
    );
  }

  try {
    const entries = await getLiftProgress(exercise);

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: `No data for exercise: ${exercise}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: { exercise, data: entries },
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to compute progress" },
      { status: 500 }
    );
  }
}
