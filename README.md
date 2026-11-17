# Job Application Tracker

A web app to track job applications through their lifecycle
(Wishlist → Applied → Screening Passed → Interview → Offer / Rejected / Withdrawn),
with deadline reminders and pipeline statistics.

Stack: Next.js (App Router) · TypeScript · PostgreSQL (Neon) + Drizzle · Auth.js · Zod · Tailwind · Vitest · Playwright.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values
npm run db:push              # create/update tables
npm run dev                  # http://localhost:3000
```

### Local database

Any Postgres 14+ works. As the `postgres` superuser, create a role and database
(pick your own password and put the same one in `DATABASE_URL`):

```sql
CREATE ROLE app_tracker WITH LOGIN PASSWORD '<password>';
CREATE DATABASE app_tracker OWNER app_tracker;
```

The prototype has no login yet: every request acts as `DEV_USER_ID`
(see `docs/decisions.md`, 005).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run db:push` | Apply the Drizzle schema to the database |

Architecture decisions are logged in [docs/decisions.md](docs/decisions.md).
