import type { WeightUnit } from "../generated/prisma/client";

// Re-export Prisma enum so callers don't import from generated directly
export type { WeightUnit };

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export type GpsPoint = {
  lat: number;
  lng: number;
  alt?: number;
  accuracy?: number;
  timestamp: string;
};

export type CreateRunInput = {
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number;
  gpsPoints: GpsPoint[];
  elevationGain?: number;
  startedAt: string;
};

// Run row without gpsPoints — used for list responses
export type RunSummary = {
  id: number;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number;
  elevationGain: number | null;
  startedAt: Date;
  createdAt: Date;
};

// Run row with gpsPoints — used for single-run responses
export type RunDetail = RunSummary & { gpsPoints: GpsPoint[] };

// ---------------------------------------------------------------------------
// Workout
// ---------------------------------------------------------------------------

export type CreateSetInput = {
  reps: number;
  weight: number;
  weightUnit: WeightUnit;
};

export type CreateExerciseInput = {
  name: string;
  sets: CreateSetInput[];
};

export type CreateWorkoutInput = {
  date: string;
  notes?: string;
  exercises: CreateExerciseInput[];
};

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export type StreakStats = {
  currentStreak: number;
  longestStreak: number;
  thisWeekCount: number;
};

export type WeeklyMileage = {
  weekStart: string; // ISO date string for the Monday of that week
  km: number;
};

export type PaceTrend = "improving" | "declining" | "steady" | "insufficient_data";

export type RunningStats = {
  totalRuns: number;
  totalKm: number;
  thisWeekKm: number;
  weeklyMileageKm: WeeklyMileage[];
  avgPaceSecPerKm: number;
  paceTrend: PaceTrend;
};

export type LiftProgressEntry = {
  date: string; // ISO date string (YYYY-MM-DD)
  maxWeight: number;
  totalVolume: number;
  unit: WeightUnit;
};
