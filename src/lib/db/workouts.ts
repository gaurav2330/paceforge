import { prisma } from "../prisma";
import type { CreateWorkoutInput } from "../../types";
import type { Exercise, Set, Workout } from "../../generated/prisma/client";

type WorkoutWithNested = Workout & {
  exercises: (Exercise & { sets: Set[] })[];
};

const WORKOUT_INCLUDE = {
  exercises: {
    include: {
      sets: true,
    },
  },
} as const;

export async function createWorkout(
  data: CreateWorkoutInput
): Promise<WorkoutWithNested> {
  return prisma.workout.create({
    data: {
      date: new Date(data.date),
      notes: data.notes ?? null,
      exercises: {
        create: data.exercises.map((exercise) => ({
          name: exercise.name,
          sets: {
            create: exercise.sets.map((set) => ({
              reps: set.reps,
              weight: set.weight,
              weightUnit: set.weightUnit,
            })),
          },
        })),
      },
    },
    include: WORKOUT_INCLUDE,
  });
}

export async function getWorkouts(): Promise<WorkoutWithNested[]> {
  return prisma.workout.findMany({
    include: WORKOUT_INCLUDE,
    orderBy: { date: "desc" },
  });
}

export async function getWorkoutById(
  id: number
): Promise<WorkoutWithNested | null> {
  return prisma.workout.findUnique({
    where: { id },
    include: WORKOUT_INCLUDE,
  });
}
