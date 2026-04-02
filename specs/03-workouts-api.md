# Spec 03 — Workouts API

## Overview

Endpoints for saving and retrieving gym workout sessions. A workout is a container for exercises, each of which holds one or more sets. The entire workout (with nested exercises and sets) is created in a single request. All database logic lives in `src/lib/db/workouts.ts`.

---

## Endpoints

### POST /api/workouts

Save a completed workout with all its exercises and sets. Uses a Prisma nested create — no separate endpoints for exercises or sets.

**Request body:**
```json
{
  "date": "2026-03-31T10:00:00Z",
  "notes": "Felt strong today",
  "exercises": [
    {
      "name": "Bench Press",
      "sets": [
        { "reps": 8, "weight": 80, "weightUnit": "kg" },
        { "reps": 6, "weight": 85, "weightUnit": "kg" }
      ]
    },
    {
      "name": "Pull-ups",
      "sets": [
        { "reps": 10, "weight": 0, "weightUnit": "kg" }
      ]
    }
  ]
}
```

**Required fields:** `date`, `exercises` (non-empty array); each exercise requires `name` and at least one `set`; each set requires `reps`, `weight`, `weightUnit`
**Optional fields:** `notes`

**Success response — 201:**
```json
{
  "data": {
    "id": 17,
    "date": "2026-03-31T10:00:00.000Z",
    "notes": "Felt strong today",
    "createdAt": "2026-03-31T11:05:22.000Z",
    "exercises": [
      {
        "id": 38,
        "name": "Bench Press",
        "sets": [
          { "id": 91, "reps": 8, "weight": 80, "weightUnit": "kg" },
          { "id": 92, "reps": 6, "weight": 85, "weightUnit": "kg" }
        ]
      },
      {
        "id": 39,
        "name": "Pull-ups",
        "sets": [
          { "id": 93, "reps": 10, "weight": 0, "weightUnit": "kg" }
        ]
      }
    ]
  },
  "success": true
}
```

**Error responses:**
- `400` — missing/invalid fields: `{ "error": "MISSING_FIELDS", "message": "..." }`
- `400` — invalid `weightUnit` value: `{ "error": "INVALID_WEIGHT_UNIT", "message": "weightUnit must be kg or lbs" }`
- `500` — `{ "error": "INTERNAL_ERROR", "message": "Failed to save workout" }`

---

### GET /api/workouts

List all workouts newest first. Includes exercises and sets (no data is heavy enough to warrant exclusion here).

**Query params:** none

**Success response — 200:**
```json
{
  "data": [
    {
      "id": 17,
      "date": "2026-03-31T10:00:00.000Z",
      "notes": "Felt strong today",
      "createdAt": "2026-03-31T11:05:22.000Z",
      "exercises": [
        {
          "id": 38,
          "name": "Bench Press",
          "sets": [
            { "id": 91, "reps": 8, "weight": 80, "weightUnit": "kg" }
          ]
        }
      ]
    }
  ],
  "success": true
}
```

**Error responses:**
- `500` — `{ "error": "INTERNAL_ERROR", "message": "Failed to fetch workouts" }`

---

### GET /api/workouts/[id]

Fetch a single workout by ID with all exercises and sets.

**Path param:** `id` — integer workout ID

**Success response — 200:**
```json
{
  "data": {
    "id": 17,
    "date": "2026-03-31T10:00:00.000Z",
    "notes": "Felt strong today",
    "createdAt": "2026-03-31T11:05:22.000Z",
    "exercises": [
      {
        "id": 38,
        "name": "Bench Press",
        "sets": [
          { "id": 91, "reps": 8, "weight": 80, "weightUnit": "kg" },
          { "id": 92, "reps": 6, "weight": 85, "weightUnit": "kg" }
        ]
      }
    ]
  },
  "success": true
}
```

**Error responses:**
- `400` — non-integer ID: `{ "error": "INVALID_ID", "message": "Workout ID must be an integer" }`
- `404` — not found: `{ "error": "NOT_FOUND", "message": "Workout not found" }`
- `500` — `{ "error": "INTERNAL_ERROR", "message": "Failed to fetch workout" }`

---

## Acceptance Criteria

- [ ] POST returns `201` on success
- [ ] POST validates that `exercises` is a non-empty array; returns `400` if absent or empty
- [ ] POST validates each `weightUnit` is `"kg"` or `"lbs"`; returns `400 INVALID_WEIGHT_UNIT` otherwise
- [ ] Entire workout (workout + exercises + sets) is created in a single Prisma nested create — no looping over separate creates
- [ ] GET /api/workouts includes full exercise and set data in the list response
- [ ] GET /api/workouts/[id] returns `404 NOT_FOUND` for an unknown ID
- [ ] All Prisma calls are in `src/lib/db/workouts.ts`

---

## Out of Scope

- Updating or deleting workouts, exercises, or sets
- Pagination
- Per-user filtering (no auth yet)
- Reordering exercises or sets
- Bodyweight exercise flag (weight=0 convention is sufficient for now)
