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

## 005 — Prototype runs as a fixed dev user (2026-11-17)
**Context:** We want a working local prototype before setting up OAuth apps for Auth.js.
**Decision:** `getCurrentUserId()` in `src/lib/auth/current-user.ts` returns `DEV_USER_ID` from `.env.local`. All queries still filter by that user id.
**Consequence:** Adding Auth.js later only changes that one function. `applications.user_id` is `text` (Auth.js ids are strings) and gets its foreign key when the users table exists.

## 006 — Creating an application writes the first StatusEvent (2026-11-17)
**Context:** Applications can be added at any status, for example one that is already at the interview stage. Stats need to know where each application entered the pipeline.
**Decision:** On create, insert a `StatusEvent` with `fromStatus = null` and `toStatus` set to the starting status, in the same transaction as the application row. Status changes lock the row (`SELECT … FOR UPDATE`), check `validateTransition`, then update the status and insert the event together.
**Consequence:** Every application has a complete history from its first event. Two status changes running at the same moment can't both pass validation against the same old status.

## 007 — postgres.js driver and `db:push` for the prototype (2026-11-17)
**Context:** We start on local Postgres and will move to Neon.
**Decision:** Use Drizzle with `postgres` (postgres.js). It speaks the plain Postgres protocol, so it works with both local Postgres and Neon's pooled URL. Use `drizzle-kit push` while the schema is still changing.
**Consequence:** Moving to Neon only needs a new `DATABASE_URL`. Before real data lives in Neon, switch to generated migrations (`drizzle-kit generate` + `migrate`).

## 008 — The edit form never changes status (2026-11-21)
**Context:** Users need to fix typos and update details, but statistics depend on every status change being validated and logged.
**Decision:** `updateApplicationSchema` has no `status` field, so status only changes through `changeStatusAction`, which runs the transition rules and writes a `StatusEvent`. When editing, a blank or missing optional field means "clear it" and is stored as `null`. When creating, a blank field just means "not provided".
**Consequence:** History and stats stay consistent. Undoing a wrong status change (for example a REJECTED set by mistake) needs its own design and is not supported yet.
**Related:** With `cacheComponents`, Next.js keeps previously visited pages in the DOM (hidden) for instant back navigation. That means the add and edit forms can exist at the same time, so form fields get ids from `useId()` instead of fixed ids like `company`.
