# Job Application Tracker

A web app to track job applications through their lifecycle
(Wishlist → Applied → Screening Passed → Interview → Offer / Rejected / Withdrawn),
with deadline reminders and pipeline statistics.

Stack: Next.js (App Router) · TypeScript · PostgreSQL (Neon) + Drizzle · Auth.js · Zod · Tailwind · Vitest · Playwright.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```

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
