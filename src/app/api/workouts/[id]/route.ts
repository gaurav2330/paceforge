import { NextRequest, NextResponse } from "next/server";
import { getWorkoutById } from "../../../../lib/db/workouts";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "INVALID_ID", message: "Workout ID must be a positive integer" },
      { status: 400 }
    );
  }

  try {
    const workout = await getWorkoutById(id);

    if (!workout) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Workout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: workout, success: true });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to fetch workout" },
      { status: 500 }
    );
  }
}
