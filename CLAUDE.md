# PaceForge Backend

API backend for the PaceForge fitness tracking app.

## Clients

- **paceforge-mobile** — React Native app; records GPS runs and gym workouts
- **Web dashboard** — Next.js app (this project); stats, charts, and AI coaching

## Stack

- Next.js 14 App Router, TypeScript
- Prisma ORM + PostgreSQL (Neon)
- Anthropic SDK

## Project Structure

```
src/
  app/api/        # All API route handlers
  lib/db/         # All database logic (Prisma queries)
  lib/prisma.ts   # Prisma client singleton
  types/index.ts  # All shared TypeScript types
```

## Conventions

### API Routes
- All routes live under `src/app/api/`
- No business logic in route handlers — delegate to `src/lib/db/` functions
- No Prisma queries directly in route handlers

### Database
- All Prisma queries go in `src/lib/db/`
- No raw SQL — Prisma only
- Use the singleton client from `src/lib/prisma.ts`

### Types
- All shared types defined in `src/types/index.ts`
- No `any` types

### Response Shapes
```ts
// Success
{ data: ..., success: true }

// Error
{ error: "ERROR_CODE", message: "human readable" }
```

### HTTP Status Codes
- `200` — OK
- `201` — Created
- `400` — Bad request / validation error
- `401` — Unauthenticated
- `403` — Forbidden
- `404` — Not found
- `500` — Internal server error

## Rules

- No `console.log` in production code — use proper error handling
- Never expose `DATABASE_URL` or API keys in responses
