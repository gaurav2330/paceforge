import { prisma } from "../prisma";
import type { WeightUnit } from "../../generated/prisma/client";
import type {
  LiftProgressEntry,
  PaceTrend,
  RunningStats,
  StreakStats,
} from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the ISO date string (YYYY-MM-DD) for a Date in UTC. */
function toUTCDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the Monday of the ISO week containing `date`, as a UTC Date
 * with time set to midnight.
 */
function getISOWeekMonday(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // getUTCDay(): 0=Sun, 1=Mon, ..., 6=Sat
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

// ---------------------------------------------------------------------------
// getStreak
// ---------------------------------------------------------------------------

export async function getStreak(): Promise<StreakStats> {
  const [runs, workouts] = await Promise.all([
    prisma.run.findMany({ select: { startedAt: true } }),
    prisma.workout.findMany({ select: { date: true } }),
  ]);

  // Collect all distinct active calendar days (UTC)
  const daySet = new Set<string>();
  for (const r of runs) daySet.add(toUTCDateString(r.startedAt));
  for (const w of workouts) daySet.add(toUTCDateString(w.date));

  if (daySet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, thisWeekCount: 0 };
  }

  // Sort descending
  const days = Array.from(daySet).sort((a, b) => (a > b ? -1 : 1));

  // Current streak — must end today or yesterday
  const todayStr = toUTCDateString(new Date());
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = toUTCDateString(yesterday);

  let currentStreak = 0;
  if (days[0] === todayStr || days[0] === yesterdayStr) {
    // Walk backwards through consecutive days
    let cursor = new Date(days[0] + "T00:00:00Z");
    for (const day of days) {
      if (day === toUTCDateString(cursor)) {
        currentStreak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else {
        break;
      }
    }
  }

  // Longest streak — scan ascending
  const ascending = [...days].reverse();
  let longestStreak = 1;
  let runningLen = 1;
  for (let i = 1; i < ascending.length; i++) {
    const prev = new Date(ascending[i - 1] + "T00:00:00Z");
    const curr = new Date(ascending[i] + "T00:00:00Z");
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / 86_400_000
    );
    if (diffDays === 1) {
      runningLen++;
      if (runningLen > longestStreak) longestStreak = runningLen;
    } else {
      runningLen = 1;
    }
  }

  // This week count — current ISO week (Mon–Sun UTC)
  const weekStart = getISOWeekMonday(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const weekStartStr = toUTCDateString(weekStart);
  const weekEndStr = toUTCDateString(weekEnd);
  const thisWeekCount = days.filter(
    (d) => d >= weekStartStr && d < weekEndStr
  ).length;

  return { currentStreak, longestStreak, thisWeekCount };
}

// ---------------------------------------------------------------------------
// getRunningStats
// ---------------------------------------------------------------------------

export async function getRunningStats(): Promise<RunningStats> {
  const runs = await prisma.run.findMany({
    select: {
      distanceMeters: true,
      avgPaceSecPerKm: true,
      startedAt: true,
    },
    orderBy: { startedAt: "asc" },
  });

  if (runs.length === 0) {
    return {
      totalRuns: 0,
      totalKm: 0,
      thisWeekKm: 0,
      weeklyMileageKm: [],
      avgPaceSecPerKm: 0,
      paceTrend: "insufficient_data",
    };
  }

  // Total runs
  const totalRuns = runs.length;

  // Total km
  const totalKm =
    Math.round(
      (runs.reduce((sum, r) => sum + r.distanceMeters, 0) / 1000) * 10
    ) / 10;

  // Avg pace
  const avgPaceSecPerKm = Math.round(
    runs.reduce((sum, r) => sum + r.avgPaceSecPerKm, 0) / runs.length
  );

  // Pace trend — last 4 weeks vs previous 4 weeks
  let paceTrend: PaceTrend;
  if (runs.length < 2) {
    paceTrend = "insufficient_data";
  } else {
    const now = new Date();
    const msPerDay = 86_400_000;
    const cutoff4w = new Date(now.getTime() - 28 * msPerDay);
    const cutoff8w = new Date(now.getTime() - 56 * msPerDay);

    const recent = runs.filter((r) => r.startedAt >= cutoff4w);
    const previous = runs.filter(
      (r) => r.startedAt >= cutoff8w && r.startedAt < cutoff4w
    );

    if (recent.length === 0 || previous.length === 0) {
      paceTrend = "insufficient_data";
    } else {
      const recentAvg =
        recent.reduce((s, r) => s + r.avgPaceSecPerKm, 0) / recent.length;
      const prevAvg =
        previous.reduce((s, r) => s + r.avgPaceSecPerKm, 0) / previous.length;
      const diff = recentAvg - prevAvg;

      if (Math.abs(diff) < 5) {
        paceTrend = "steady";
      } else if (diff < 0) {
        paceTrend = "improving"; // lower sec/km = faster
      } else {
        paceTrend = "declining";
      }
    }
  }

  // Weekly mileage — last 12 weeks with data, newest first
  const weeklyMap = new Map<string, number>(); // weekStart ISO string → metres
  for (const run of runs) {
    const monday = getISOWeekMonday(run.startedAt);
    const key = toUTCDateString(monday);
    weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + run.distanceMeters);
  }

  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setUTCDate(twelveWeeksAgo.getUTCDate() - 84);
  const cutoffStr = toUTCDateString(getISOWeekMonday(twelveWeeksAgo));

  const weeklyMileageKm = Array.from(weeklyMap.entries())
    .filter(([weekStart]) => weekStart >= cutoffStr)
    .sort(([a], [b]) => (a > b ? -1 : 1)) // newest first
    .map(([weekStart, metres]) => ({
      weekStart,
      km: Math.round((metres / 1000) * 10) / 10,
    }));

  // This week km
  const thisWeekStart = toUTCDateString(getISOWeekMonday(new Date()));
  const thisWeekKm = weeklyMileageKm.find((w) => w.weekStart === thisWeekStart)?.km ?? 0;

  return { totalRuns, totalKm, thisWeekKm, weeklyMileageKm, avgPaceSecPerKm, paceTrend };
}

// ---------------------------------------------------------------------------
// getLiftProgress
// ---------------------------------------------------------------------------

export async function getLiftProgress(
  exerciseName: string
): Promise<LiftProgressEntry[]> {
  const exercises = await prisma.exercise.findMany({
    where: { name: exerciseName },
    include: {
      sets: true,
      workout: { select: { date: true } },
    },
  });

  if (exercises.length === 0) return [];

  // Group by calendar date (UTC), aggregate maxWeight, totalVolume, and unit
  // unit tracks the weightUnit of the heaviest set seen so far for that date
  const byDate = new Map<
    string,
    { maxWeight: number; totalVolume: number; unit: WeightUnit }
  >();

  for (const exercise of exercises) {
    const dateStr = toUTCDateString(exercise.workout.date);
    const existing = byDate.get(dateStr) ?? {
      maxWeight: 0,
      totalVolume: 0,
      unit: "kg" as WeightUnit,
    };

    for (const set of exercise.sets) {
      if (set.weight > existing.maxWeight) {
        existing.maxWeight = set.weight;
        existing.unit = set.weightUnit;
      }
      existing.totalVolume += set.reps * set.weight;
    }

    byDate.set(dateStr, existing);
  }

  // Sort ascending (oldest first) for chart rendering
  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, { maxWeight, totalVolume, unit }]) => ({
      date,
      maxWeight,
      totalVolume,
      unit,
    }));
}
