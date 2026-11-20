# Job Application Tracker — Project Guide for Claude Code

## What this is
A web app to track job applications through their lifecycle
(Applied → Screening Passed → Interview → Offer / Rejected), with deadline
reminders and pipeline statistics. Built by Robin as a portfolio project.

## Tech stack (do not change without asking)
- **Language:** TypeScript (strict mode, no `any`)
- **Framework:** Next.js (App Router) + React
- **DB:** PostgreSQL (Neon or Supabase) via Drizzle ORM
- **Auth:** Auth.js (GitHub/Google OAuth)
- **Validation:** Zod (shared between client and server)
- **Styling:** Tailwind CSS
- **Tests:** Vitest (unit), Playwright (E2E)
- **CI/CD:** GitHub Actions → Vercel
- **Email reminders:** Resend + Vercel Cron

## Domain model
- `Application`: id, userId, company, role, url, location, status,
  appliedAt, deadline, notes, createdAt, updatedAt
- `StatusEvent`: id, applicationId, fromStatus, toStatus, changedAt
  (every status change is logged here — stats are computed from this table)
- `Status` enum: `WISHLIST | APPLIED | SCREENING_PASSED | INTERVIEW | OFFER | REJECTED | WITHDRAWN`

## Rules
1. **Plan before code.** For any feature, first write a short plan and wait for approval.
2. **Tests first for business logic.** Status transitions and stats calculations
   must have Vitest tests written before implementation.
3. **Small commits.** One logical change per commit, Conventional Commits
   format (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
4. **Never commit secrets.** All keys in `.env.local`; keep `.env.example` updated.
5. **Every server action validates input with Zod** and checks the user owns the record.
6. Run `npm run lint && npm run typecheck && npm test` before saying a task is done.
7. Explain non-obvious decisions in a short comment or in `docs/decisions.md`.

## Commands
- `npm run dev` — local dev server
- `npm run lint` / `npm run typecheck` / `npm test` / `npm run test:e2e`
- `npm run db:push` — apply Drizzle schema

## Folder layout
- `src/app/` — routes and pages
- `src/lib/domain/` — pure business logic (status transitions, stats) — fully unit-tested
- `src/lib/db/` — Drizzle schema and queries
- `src/components/` — UI components
- `tests/e2e/` — Playwright specs
- `docs/decisions.md` — architecture decision log
 