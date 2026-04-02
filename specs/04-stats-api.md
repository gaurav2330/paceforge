# Spec 04 — Stats API

## Overview

Read-only aggregation endpoints consumed by both the mobile home screen and the web dashboard. All computation happens in `src/lib/db/stats.ts` — route handlers return the result directly. No caching layer for now.

---

## Endpoints

### GET /api/stats/streak

Returns activity streak data. A "streak day" counts if the user logged at least one run or workout on that calendar day.

**Query params:** none

**Success response — 200:**
```json
{
  "data": {
    "currentStreak": 5,
    "longestStreak": 14,
    "thisWeekCount": 3
  },
  "success": true
}
```

**Field definitions:**
- `currentStreak` — consecutive days with activity ending today or yesterday (breaks if today and yesterday both have no activity)
- `longestStreak` — longest consecutive-day streak across all recorded history
- `thisWeekCount` — number of distinct days with activity in the current ISO week (Mon–Sun)

**Error responses:**
- `500` — `{ "error": "INTERNAL_ERROR", "message": "Failed to compute streak" }`

---

### GET /api/stats/running

Aggregate running stats for the dashboard and mobile summary card.

**Query params:** none

**Success response — 200:**
```json
{
  "data": {
    "totalKm": 312.4,
    "weeklyMileageKm": [
      { "weekStart": "2026-03-23", "km": 18.2 },
      { "weekStart": "2026-03-16", "km": 22.5 },
      { "weekStart": "2026-03-09", "km": 15.0 },
      { "weekStart": "2026-03-02", "km": 20.1 },
      { "weekStart": "2026-02-23", "km": 19.8 }
    ],
    "avgPaceSecPerKm": 315,
    "paceTrend": "improving"
  },
  "success": true
}
```

**Field definitions:**
- `totalKm` — sum of all `distanceMeters` converted to km, rounded to 1 decimal
- `weeklyMileageKm` — last 8 weeks, each entry is the ISO week start date (Monday) and total km that week; ordered newest first
- `avgPaceSecPerKm` — average of `avgPaceSecPerKm` across all runs, rounded to nearest integer
- `paceTrend` — compare average pace of last 4 weeks vs previous 4 weeks:
  - `"improving"` — recent avg pace is lower (faster)
  - `"declining"` — recent avg pace is higher (slower)
  - `"steady"` — difference is less than 5 sec/km
  - `"insufficient_data"` — fewer than 2 runs total

**Error responses:**
- `500` — `{ "error": "INTERNAL_ERROR", "message": "Failed to compute running stats" }`

---

### GET /api/stats/progress?exercise=X

Weight-over-time data for a named exercise, for the progress chart on the dashboard.

**Query params:**
- `exercise` (required) — exact exercise name string, e.g. `Bench Press`

**Aggregation:** for each date that exercise was performed, return the max weight recorded across all sets that day (in whatever unit those sets used).

**Success response — 200:**
```json
{
  "data": {
    "exercise": "Bench Press",
    "unit": "kg",
    "history": [
      { "date": "2026-03-31", "maxWeight": 85 },
      { "date": "2026-03-28", "maxWeight": 82.5 },
      { "date": "2026-03-24", "maxWeight": 80 }
    ]
  },
  "success": true
}
```

**Field definitions:**
- `unit` — the `weightUnit` of the heaviest set on the most recent session; used by the chart to label the Y axis
- `history` — ordered oldest first (ascending date) for chart rendering; one entry per workout day

**Error responses:**
- `400` — missing param: `{ "error": "MISSING_PARAM", "message": "exercise query param is required" }`
- `404` — no data found: `{ "error": "NOT_FOUND", "message": "No data for exercise: Bench Press" }`
- `500` — `{ "error": "INTERNAL_ERROR", "message": "Failed to compute progress" }`

---

## Acceptance Criteria

- [ ] All three endpoints are GET with no request body
- [ ] `/api/stats/streak` counts both runs and workouts toward streak days; a day with both counts as 1
- [ ] `thisWeekCount` resets at Monday 00:00 UTC
- [ ] `/api/stats/running` `weeklyMileageKm` always returns up to 8 entries; weeks with zero runs are omitted (not returned as `{ km: 0 }`)
- [ ] `paceTrend` returns `"insufficient_data"` when fewer than 2 runs exist, not an error
- [ ] `/api/stats/progress` missing `exercise` param returns `400 MISSING_PARAM`
- [ ] `/api/stats/progress` with a name that has no data returns `404 NOT_FOUND`
- [ ] Mixed `weightUnit` within the same exercise across sessions: `unit` reflects the most recent session's unit; no cross-unit conversion is performed
- [ ] All aggregation logic is in `src/lib/db/stats.ts`

---

## Out of Scope

- Filtering by date range
- Per-user stats (no auth yet)
- Heart rate or cadence metrics
- Workout-specific stats (e.g. total volume per session)
- Unit conversion between kg and lbs
- Caching or incremental computation
