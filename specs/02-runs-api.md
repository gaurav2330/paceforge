# Spec 02 — Runs API

## Overview

Endpoints for the mobile app to save completed GPS runs and retrieve them for display. All database logic lives in `src/lib/db/runs.ts`. Route handlers only parse input, call db functions, and return responses.

---

## Endpoints

### POST /api/runs

Save a finished run submitted by the mobile app.

**Request body:**
```json
{
  "distanceMeters": 5240.5,
  "durationSeconds": 1620,
  "avgPaceSecPerKm": 309.2,
  "elevationGain": 34.1,
  "startedAt": "2026-03-31T07:15:00Z",
  "gpsPoints": [
    { "lat": 37.7749, "lng": -122.4194, "alt": 10.2, "timestamp": "2026-03-31T07:15:00Z" },
    { "lat": 37.7751, "lng": -122.4190, "alt": 10.5, "timestamp": "2026-03-31T07:15:05Z" }
  ]
}
```

**Required fields:** `distanceMeters`, `durationSeconds`, `avgPaceSecPerKm`, `startedAt`, `gpsPoints`
**Optional fields:** `elevationGain`

**Success response — 201:**
```json
{
  "data": {
    "id": 42,
    "distanceMeters": 5240.5,
    "durationSeconds": 1620,
    "avgPaceSecPerKm": 309.2,
    "elevationGain": 34.1,
    "startedAt": "2026-03-31T07:15:00.000Z",
    "createdAt": "2026-03-31T07:42:11.000Z"
  },
  "success": true
}
```

Note: `gpsPoints` is intentionally excluded from the create response to keep the payload small.

**Error responses:**
- `400` — missing required fields: `{ "error": "MISSING_FIELDS", "message": "..." }`
- `500` — database error: `{ "error": "INTERNAL_ERROR", "message": "Failed to save run" }`

---

### GET /api/runs

List all runs, newest first. GPS points are excluded for list performance.

**Query params:** none (pagination is out of scope)

**Success response — 200:**
```json
{
  "data": [
    {
      "id": 42,
      "distanceMeters": 5240.5,
      "durationSeconds": 1620,
      "avgPaceSecPerKm": 309.2,
      "elevationGain": 34.1,
      "startedAt": "2026-03-31T07:15:00.000Z",
      "createdAt": "2026-03-31T07:42:11.000Z"
    }
  ],
  "success": true
}
```

**Error responses:**
- `500` — `{ "error": "INTERNAL_ERROR", "message": "Failed to fetch runs" }`

---

### GET /api/runs/[id]

Fetch a single run by ID, including full GPS points array.

**Path param:** `id` — integer run ID

**Success response — 200:**
```json
{
  "data": {
    "id": 42,
    "distanceMeters": 5240.5,
    "durationSeconds": 1620,
    "avgPaceSecPerKm": 309.2,
    "elevationGain": 34.1,
    "startedAt": "2026-03-31T07:15:00.000Z",
    "createdAt": "2026-03-31T07:42:11.000Z",
    "gpsPoints": [
      { "lat": 37.7749, "lng": -122.4194, "alt": 10.2, "timestamp": "2026-03-31T07:15:00Z" }
    ]
  },
  "success": true
}
```

**Error responses:**
- `400` — non-integer ID: `{ "error": "INVALID_ID", "message": "Run ID must be an integer" }`
- `404` — not found: `{ "error": "NOT_FOUND", "message": "Run not found" }`
- `500` — `{ "error": "INTERNAL_ERROR", "message": "Failed to fetch run" }`

---

## Acceptance Criteria

- [ ] POST returns `201` on success, not `200`
- [ ] POST validates all required fields and returns `400` with `MISSING_FIELDS` if any are absent
- [ ] GET /api/runs does NOT include `gpsPoints` in list items
- [ ] GET /api/runs/[id] DOES include full `gpsPoints`
- [ ] Non-integer or missing `[id]` returns `400 INVALID_ID`
- [ ] ID that doesn't exist in the database returns `404 NOT_FOUND`
- [ ] All Prisma calls are in `src/lib/db/runs.ts`, not inline in the route handler
- [ ] `gpsPoints` is cast to a typed array (`GpsPoint[]`) defined in `src/types/index.ts`

---

## Out of Scope

- Pagination or cursor-based listing
- Updating or deleting runs
- Per-user filtering (no auth yet)
- Server-side pace calculation (mobile sends `avgPaceSecPerKm`)
