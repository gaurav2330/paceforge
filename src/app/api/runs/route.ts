import { NextRequest, NextResponse } from "next/server";
import { createRun, getRuns } from "../../../lib/db/runs";
import type { GpsPoint } from "../../../types";

type MobileRoutePoint = {
  lat: number;
  lng: number;
  timestamp: number; // Unix ms
  accuracy?: number;
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    console.log('########################');
    console.log(body);
    console.log('########################');
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

  const missing: string[] = [];
  if (typeof b.startedAt !== "number") missing.push("startedAt");
  if (typeof b.finishedAt !== "number") missing.push("finishedAt");
  if (typeof b.distanceKm !== "number") missing.push("distanceKm");
  if (!Array.isArray(b.route)) missing.push("route");

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "MISSING_FIELDS",
        message: `Missing or invalid fields: ${missing.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const startedAt = b.startedAt as number;
  const finishedAt = b.finishedAt as number;
  const distanceKm = b.distanceKm as number;
  const route = b.route as MobileRoutePoint[];

  // Derive duration from timestamps — mobile sends durationSeconds: 0
  const durationSeconds = Math.round((finishedAt - startedAt) / 1000);

  // Derive pace — mobile sends avgPaceMinPerKm: 0 when durationSeconds is 0
  const avgPaceSecPerKm =
    distanceKm > 0 ? Math.round(durationSeconds / distanceKm) : 0;

  const gpsPoints: GpsPoint[] = route.map((point) => ({
    lat: point.lat,
    lng: point.lng,
    timestamp: new Date(point.timestamp).toISOString(),
    ...(point.accuracy !== undefined ? { accuracy: point.accuracy } : {}),
  }));

  console.log(`[POST /api/runs] validation passed — distanceKm=${distanceKm}, durationSeconds=${durationSeconds}, points=${gpsPoints.length}`);
  try {
    const run = await createRun({
      distanceMeters: distanceKm * 1000,
      durationSeconds,
      avgPaceSecPerKm,
      gpsPoints,
      startedAt: new Date(startedAt).toISOString(),
      elevationGain:
        typeof b.elevationGain === "number" ? b.elevationGain : undefined,
    });

    console.log(`[POST /api/runs] ✓ saved run id=${run.id}`);
    return NextResponse.json({ data: run, success: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/runs] ✗ DB error:', err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to save run" },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log('[GET /api/runs] received request');
  try {
    const runs = await getRuns();
    console.log(`[GET /api/runs] returning ${runs.length} runs`);
    return NextResponse.json({ data: runs, success: true });
  } catch (err) {
    console.error('[GET /api/runs] ✗ DB error:', err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}
