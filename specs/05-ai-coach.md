# Spec 05 — AI Coach API

## Overview

A single endpoint that reads the user's last 30 days of activity, constructs a structured prompt, calls the Anthropic Claude API, and returns a weekly coaching summary. Logic is split: data aggregation in `src/lib/db/coach.ts`, Claude call in `src/lib/coach.ts`. The route handler orchestrates both.

---

## Endpoint

### POST /api/coach/weekly

Generate a weekly coaching report based on the last 30 days of runs and workouts.

**Request body:** empty — no input required

**What it does:**
1. Fetches all runs from the last 30 days (date, distance, duration, pace, elevation)
2. Fetches all workouts from the last 30 days (date, exercise names, sets, weights)
3. Builds a structured prompt summarizing the activity
4. Calls `claude-sonnet-4-6` via the Anthropic SDK with that prompt
5. Returns Claude's response as structured feedback

**Success response — 200:**
```json
{
  "data": {
    "generatedAt": "2026-03-31T12:00:00.000Z",
    "periodStart": "2026-03-01T00:00:00.000Z",
    "periodEnd": "2026-03-31T12:00:00.000Z",
    "feedback": {
      "summary": "Strong week overall — you hit 3 runs and 2 gym sessions.",
      "running": "Your pace improved by ~8 sec/km vs the prior week. The Tuesday long run at 10.2 km is a good base-building signal. Consider keeping one easy effort per week to protect against overuse.",
      "strength": "Bench press is progressing well (+5 kg over 4 sessions). Pull volume looks low — only 1 pulling session this month. Adding a row or pull-up day would balance your push/pull ratio.",
      "recommendation": "This week: aim for 3 runs with one slightly longer than last week, and add a second pulling movement to your next gym session.",
      "flags": []
    }
  },
  "success": true
}
```

**`feedback` field definitions:**
- `summary` — 1–2 sentence overall snapshot
- `running` — observations and suggestions specific to runs (omitted if no runs in period)
- `strength` — observations and suggestions specific to gym work (omitted if no workouts in period)
- `recommendation` — one concrete action for the coming week
- `flags` — array of strings for any concerns (e.g. `"No activity in the last 7 days"`, `"Sharp pace drop on last run — possible fatigue"`); empty array if none

**Error responses:**
- `422` — no activity in the last 30 days: `{ "error": "NO_DATA", "message": "No runs or workouts found in the last 30 days" }`
- `502` — Claude API call failed: `{ "error": "AI_UNAVAILABLE", "message": "Could not reach AI coach" }`
- `500` — unexpected error: `{ "error": "INTERNAL_ERROR", "message": "Failed to generate coaching report" }`

---

## Prompt Design

The prompt sent to Claude is built in `src/lib/coach.ts`. It is structured, not conversational, to produce consistent parseable output.

**System prompt:**
```
You are a personal fitness coach. You will receive a structured summary of a user's
last 30 days of running and gym activity. Respond with honest, specific, actionable
feedback. Do not be generic. Reference actual numbers from the data. Be concise.
Respond in JSON matching the schema provided.
```

**User prompt structure:**
```
Here is the user's activity for the last 30 days:

RUNS ({{count}} total):
- {{date}}: {{distanceKm}} km in {{durationMin}} min, pace {{paceFormatted}}/km, +{{elevationGain}}m elevation
...

WORKOUTS ({{count}} total):
- {{date}}: {{exerciseName}} — {{sets}} sets (e.g. 8×80kg, 6×85kg)
...

Respond with JSON in this exact shape:
{
  "summary": "...",
  "running": "...",      // omit key if no runs
  "strength": "...",     // omit key if no workouts
  "recommendation": "...",
  "flags": ["..."]       // empty array if none
}
```

---

## Implementation Notes

- Use `src/lib/prisma.ts` singleton; never instantiate a new `PrismaClient` in this flow
- Anthropic client should be instantiated once (module-level singleton in `src/lib/coach.ts`)
- API key read from `ANTHROPIC_API_KEY` environment variable; never hardcoded or logged
- Claude call uses `max_tokens: 1024` — coaching summaries are concise
- Parse Claude's response with `JSON.parse`; if parsing fails, return `502 AI_UNAVAILABLE`
- Do not stream — use a single blocking `messages.create` call

---

## Acceptance Criteria

- [ ] Returns `422 NO_DATA` when there are zero runs and zero workouts in the last 30 days
- [ ] Returns `502 AI_UNAVAILABLE` when the Anthropic SDK throws or returns unparseable JSON
- [ ] `ANTHROPIC_API_KEY` is never included in any response or log output
- [ ] `running` key is omitted from `feedback` when there are no runs in the period
- [ ] `strength` key is omitted from `feedback` when there are no workouts in the period
- [ ] `flags` is always present in the response, even when empty (`[]`)
- [ ] Data aggregation (DB reads) is in `src/lib/db/coach.ts`
- [ ] Claude prompt construction and API call is in `src/lib/coach.ts`
- [ ] Route handler only calls those two functions and formats the response
- [ ] Model used is `claude-sonnet-4-6`

---

## Out of Scope

- Streaming responses
- Saving coaching reports to the database
- Per-user personalization (no auth yet)
- Accepting a custom date range
- Follow-up questions or chat interface
- Prompt caching
