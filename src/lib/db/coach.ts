import { prisma } from "../prisma";
import type { Exercise, Set, Workout } from "../../generated/prisma/client";
import type { RunSummary } from "../../types";

type WorkoutWithNested = Workout & {
  exercises: (Exercise & { sets: Set[] })[];
};

export type RecentActivity = {
  runs: RunSummary[];
  workouts: WorkoutWithNested[];
};

export async function getRecentActivity(days: number): Promise<RecentActivity> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const [runs, workouts] = await Promise.all([
    prisma.run.findMany({
      where: { startedAt: { gte: since } },
      select: {
        id: true,
        distanceMeters: true,
        durationSeconds: true,
        avgPaceSecPerKm: true,
        elevationGain: true,
        startedAt: true,
        createdAt: true,
      },
      orderBy: { startedAt: "asc" },
    }),
    prisma.workout.findMany({
      where: { date: { gte: since } },
      include: {
        exercises: {
          include: { sets: true },
        },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  return { runs, workouts };
}
