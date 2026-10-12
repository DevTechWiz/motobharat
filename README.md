# MotoBharat

**MotoBharat — Warangal Riders.** Different Roads. One Community. Sign up with Google, browse rides the community runs, join one, and scroll the photo gallery after.

- Stack: Next.js 16.4 (App Router) · Supabase (auth + Postgres) · Cloudflare R2 (photos) · deploy target: Cloudflare Workers
- Status: full-stack build complete — auth, rider registration (KYC), rides, join/leave, announcements, R2 gallery pipeline, admin panel, seed data. Not yet deployed.

## What the app does

1. **Sign up with Google** → rider profile + 2-step registration (basic info + safety KYC)
2. **Admin creates rides** — riders never create rides
3. **Riders join / leave rides** — joining requires completed KYC (blood group, emergency contact)
4. **Gallery** — admin uploads photos per ride to Cloudflare R2; everyone browses
5. **Announcements** — community notices from admins
6. **Safety page** — riding guidelines

## Development

```bash
npm install
cp .env.example .env.local   # fill Supabase URL + publishable key; R2 keys optional until the bucket exists
npm run dev                  # local dev — http://localhost:3000

# quality gates
npm run lint && npm run typecheck && npm test && npm run build
npm run test:rls    # pgTAP RLS suite (needs `supabase start` local stack)
npm run test:e2e    # Playwright smoke (needs `npm run build` first)
```

## First-time setup (see docs/11_WORKFLOWS.md for the full runbook)

1. Apply `supabase/migrations/0001`–`0005` in order in the Supabase SQL editor (cloud project; CLI is a different account).
2. Sign in once with Google → promote yourself to admin (SQL snippet in `docs/05_ADMIN.md`).
3. Optional demo data: run `supabase/seed.sql` (4 demo riders + rides + joins + gallery + announcements — demo covers/gallery are placeholders to replace via admin upload; demo photos render without R2).
4. Optional media uploads: create the R2 bucket + API token, fill the 5 `R2_*` env vars — admin uploads then work end-to-end.

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | public | Home — hero, live stats, next-departure, upcoming rides, memories |
| `/rides` | public | All published rides (upcoming + archive) |
| `/rides/[ride]` | public (join needs login) | Ride detail, rider list, gallery + lightbox, join/leave |
| `/announcements` + `/announcements/[a]` | public | Community notices + detail |
| `/safety` | public | Safety code + emergency numbers |
| `/login` | public | Google sign-in — isolated full-screen (no topbar/footer) |
| `/profile` | signed-in | Your rides + registration status |
| `/profile/setup` | signed-in | Step 1 — basic info: name, dob/age, gender, city, phone (forced after first signup) |
| `/profile/kyc` | signed-in | Step 2 — bike, licence, emergency contact, safety declaration (unlocks joining) |
| `/admin` | admin only | Rides CRUD + gallery + members, announcements CRUD |
| `/dev/ui` | dev-only | Design-system primitives gallery |

## Environment variables

| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | Safe for browser (`sb_publishable_...`) |
| `R2_ACCOUNT_ID` | server only | Cloudflare account id (R2 S3 endpoint) |
| `R2_ACCESS_KEY_ID` | server only | R2 API token |
| `R2_SECRET_ACCESS_KEY` | server only | **secret** — never in client code |
| `R2_BUCKET` | server only | e.g. `motobharat-assets` |
| `R2_PUBLIC_BASE_URL` | server only | public read base, no trailing slash (`https://pub-….r2.dev` or custom domain) |

Never commit `.env.local`. Service-role keys stay in the Supabase dashboard only. Without R2 vars the app runs fine — uploads show "R2 not configured".

## Docs (source of truth)

`docs/` — overview, schema, auth, API/actions, UI, admin, media, security, stack, build status, tests, day-1 workflows.
