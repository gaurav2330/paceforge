import { prisma } from "../prisma";
import type { CreateRunInput, RunDetail, RunSummary } from "../../types";

const RUN_LIST_SELECT = {
  id: true,
  distanceMeters: true,
  durationSeconds: true,
  avgPaceSecPerKm: true,
  elevationGain: true,
  startedAt: true,
  createdAt: true,
} as const;

export async function createRun(data: CreateRunInput): Promise<RunSummary> {
  return prisma.run.create({
    data: {
      distanceMeters: data.distanceMeters,
      durationSeconds: data.durationSeconds,
      avgPaceSecPerKm: data.avgPaceSecPerKm,
      gpsPoints: data.gpsPoints,
      elevationGain: data.elevationGain ?? null,
      startedAt: new Date(data.startedAt),
    },
    select: RUN_LIST_SELECT,
  });
}

export async function getRuns(): Promise<RunSummary[]> {
  return prisma.run.findMany({
    select: RUN_LIST_SELECT,
    orderBy: { startedAt: "desc" },
  });
}

export async function getRunById(id: number): Promise<RunDetail | null> {
  const run = await prisma.run.findUnique({
    where: { id },
  });

  if (!run) return null;

  return {
    id: run.id,
    distanceMeters: run.distanceMeters,
    durationSeconds: run.durationSeconds,
    avgPaceSecPerKm: run.avgPaceSecPerKm,
    elevationGain: run.elevationGain,
    startedAt: run.startedAt,
    createdAt: run.createdAt,
    gpsPoints: run.gpsPoints as RunDetail["gpsPoints"],
  };
}
