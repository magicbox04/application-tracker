# Architecture decision log

Short records of non-obvious choices. Newest last. Format: context → decision → consequence.

## 001 — Neon for PostgreSQL (2026-11-17)
**Context:** CLAUDE.md allows Neon or Supabase. We need only a database. Auth comes from Auth.js and email from Resend.
**Decision:** Use Neon.
**Consequence:** Serverless Postgres with branchable databases and a native Vercel integration, and no unused platform features. `DATABASE_URL` holds the pooled connection string.

## 002 — StatusEvent is the source of truth for statistics (2026-11-17)
**Context:** The current `Application.status` only tells us where an application is now, not the path it took.
**Decision:** Every status change writes a `StatusEvent` row (from, to, changedAt), and all pipeline stats are computed from those events.
**Consequence:** We can answer "how many applications reached an interview?" and "how long did screening take?". The status update and its event insert must happen in one transaction.

## 003 — Domain logic is framework-free (2026-11-17)
**Context:** Status transitions and stats are the core business rules and must be tested first (CLAUDE.md rule 2).
**Decision:** `src/lib/domain/` holds pure TypeScript with no imports from Next.js, React or Drizzle.
**Consequence:** Fast Vitest unit tests with no mocks. Server actions and DB queries call into the domain, never the reverse.

## 004 — `@types/node` tracks the Node runtime (2026-11-17)
**Context:** create-next-app pinned `@types/node@^20`, which conflicts with Vitest 5's peer range (>=22). Local Node is 24.
**Decision:** Use `@types/node@^24`. CI also runs Node 24.
**Consequence:** Types match the runtime. Bump both together.
