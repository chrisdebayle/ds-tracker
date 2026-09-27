# Disposition Tracker

Outbound engagement reporting tool for Vigent Group LLC's cold-calling engagements, built against
the Disposition Science framework (Ryan Reisert / Ronen R. Pessar). Multi-tenant admin app (Chris +
subcontracted reps) for logging daily call dispositions per client engagement, plus two read-only
client-facing portal links per engagement: a live dashboard and a static closeout diagnostic report.

The original design handoff (static HTML prototype, design-system reference, and screenshots) lives
in [`reference/`](reference/) and is not part of the shipped app.

## Stack

- Next.js 16 (App Router, TypeScript), deployed on Vercel
- Postgres via Vercel Marketplace (Neon), accessed with Drizzle ORM
- Auth.js (NextAuth v5) credentials login for admin/reps
- Opaque, revocable share tokens (stored in `share_links`) for the two client portal links

## Local development

1. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (from `vercel env pull` once the
   project is linked and Postgres is provisioned) and `AUTH_SECRET` (any random string;
   `openssl rand -base64 32`).
2. `npm install`
3. `npm run db:push` — pushes the Drizzle schema to the database.
4. `npm run db:seed` — creates an admin user and seeds a demo engagement ("Jafar AI, Inc.") from the
   original prototype's data. Prints the admin login to the console.
5. `npm run dev` and sign in at `/login`.

## Deployment

```bash
vercel link
vercel integration add           # provision Marketplace Postgres (Neon)
vercel env pull                  # syncs DATABASE_URL etc. to .env.local
npm run db:push
npm run db:seed
vercel deploy                    # preview
vercel deploy --prod
```

Set `AUTH_SECRET` as a Vercel environment variable (Settings → Environment Variables) — never commit
it. `NEXT_PUBLIC_APP_URL` is optional; when unset, client portal links are built from the request's
`Host` header.

## Key business logic

All Disposition Science benchmarks, status thresholds, and aggregation math live in one place:
[`src/lib/disposition.ts`](src/lib/disposition.ts). The Daily Log form, admin Dashboard, admin
Report, and both client portal views all read from this module so a benchmark can never drift
between screens.
