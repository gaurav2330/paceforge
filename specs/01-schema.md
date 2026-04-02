# Spec 01 — Prisma Data Model

## Overview

Defines the full database schema for PaceForge. All models are managed via Prisma ORM against a PostgreSQL (Neon) database. No raw SQL anywhere in the codebase.

---

## Models

### Run

Represents a single GPS-tracked outdoor run recorded by the mobile app.

```prisma
model Run {
  id                Int      @id @default(autoincrement())
  distanceMeters    Float
  durationSeconds   Int
  avgPaceSecPerKm   Float
  gpsPoints         Json
  elevationGain     Float?
  startedAt         DateTime
  createdAt         DateTime @default(now())
}
```

**Field notes:**
- `gpsPoints` — array of `{ lat, lng, alt?, timestamp }` objects stored as JSON
- `elevationGain` — optional; meters gained over the run
- `avgPaceSecPerKm` — derived on the mobile side before submission; stored for query efficiency
- `startedAt` — when the run began (device local time, stored as UTC)

---

### Workout

A single gym session. Contains one or more exercises.

```prisma
model Workout {
  id        Int        @id @default(autoincrement())
  date      DateTime
  notes     String?
  createdAt DateTime   @default(now())
  exercises Exercise[]
}
```

---

### Exercise

A named movement within a workout (e.g. "Bench Press"). Contains one or more sets.

```prisma
model Exercise {
  id         Int      @id @default(autoincrement())
  workoutId  Int
  name       String
  workout    Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  sets       Set[]
}
```

---

### Set

A single set within an exercise — reps performed and weight used.

```prisma
model Set {
  id           Int          @id @default(autoincrement())
  exerciseId   Int
  reps         Int
  weight       Float
  weightUnit   WeightUnit
  exercise     Exercise     @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
}

enum WeightUnit {
  kg
  lbs
}
```

---

## Relationships

```
Workout 1──* Exercise 1──* Set
```

- Deleting a `Workout` cascades to its `Exercise` rows
- Deleting an `Exercise` cascades to its `Set` rows
- `Run` is standalone with no relations

---

## Acceptance Criteria

- [ ] `prisma migrate dev` runs without errors on a clean Neon database
- [ ] All relations have explicit `onDelete: Cascade`
- [ ] `WeightUnit` is a Prisma enum, not a plain string
- [ ] `gpsPoints` is typed as `Json` in Prisma; callers cast to a typed array in `src/types/index.ts`
- [ ] No model has a field typed as `any` in application code

---

## Out of Scope

- User authentication / multi-tenancy (no `userId` on any model yet)
- Soft deletes
- Route/segment split for runs
- Exercise categories or muscle groups
