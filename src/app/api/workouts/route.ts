import { NextRequest, NextResponse } from "next/server";
import { createWorkout, getWorkouts } from "../../../lib/db/workouts";
import type { CreateExerciseInput, CreateSetInput } from "../../../types";

const VALID_WEIGHT_UNITS = new Set(["kg", "lbs"]);

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "MISSING_FIELDS", message: "Request body must be an object" },
      { status: 400 }
    );
  }

  const b = body as Record<string, unknown>;

  if (typeof b.date !== "string") {
    return NextResponse.json(
      { error: "MISSING_FIELDS", message: "Missing or invalid field: date" },
      { status: 400 }
    );
  }

  if (!Array.isArray(b.exercises) || b.exercises.length === 0) {
    return NextResponse.json(
      {
        error: "MISSING_FIELDS",
        message: "exercises must be a non-empty array",
      },
      { status: 400 }
    );
  }

  // Validate each exercise and its sets
  for (let ei = 0; ei < b.exercises.length; ei++) {
    const exercise = b.exercises[ei] as Record<string, unknown>;

    if (typeof exercise.name !== "string" || exercise.name.trim() === "") {
      return NextResponse.json(
        {
          error: "MISSING_FIELDS",
          message: `exercises[${ei}].name is required`,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
      return NextResponse.json(
        {
          error: "MISSING_FIELDS",
          message: `exercises[${ei}].sets must be a non-empty array`,
        },
        { status: 400 }
      );
    }

    for (let si = 0; si < exercise.sets.length; si++) {
      const set = exercise.sets[si] as Record<string, unknown>;

      if (typeof set.reps !== "number" || typeof set.weight !== "number") {
        return NextResponse.json(
          {
            error: "MISSING_FIELDS",
            message: `exercises[${ei}].sets[${si}]: reps and weight must be numbers`,
          },
          { status: 400 }
        );
      }

      if (!VALID_WEIGHT_UNITS.has(set.weightUnit as string)) {
        return NextResponse.json(
          {
            error: "INVALID_WEIGHT_UNIT",
            message: "weightUnit must be kg or lbs",
          },
          { status: 400 }
        );
      }
    }
  }

  try {
    const workout = await createWorkout({
      date: b.date,
      notes: typeof b.notes === "string" ? b.notes : undefined,
      exercises: b.exercises.map((exercise) => {
        const e = exercise as Record<string, unknown>;
        return {
          name: e.name as string,
          sets: (e.sets as Record<string, unknown>[]).map((set) => ({
            reps: set.reps as number,
            weight: set.weight as number,
            weightUnit: set.weightUnit as CreateSetInput["weightUnit"],
          })),
        } satisfies CreateExerciseInput;
      }),
    });

    return NextResponse.json({ data: workout, success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to save workout" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const workouts = await getWorkouts();
    return NextResponse.json({ data: workouts, success: true });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to fetch workouts" },
      { status: 500 }
    );
  }
}
