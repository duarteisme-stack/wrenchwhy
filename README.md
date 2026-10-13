# WrenchWHY? (Supabase edition, Phase 1 scaffold)

## Honest status
**Done:** React/TS/Tailwind app, fiery homepage, register/login (Supabase Auth), pending-approval gate, Postgres schema with Row Level Security, admin approval function, atomic booking function (database-level double-booking prevention + 15-min holds).
**NOT done:** admin UI, mechanic/service pages, calendars, availability rules (shop hours/shifts/breaks/leave), booking UI, PayMongo + webhooks, QR image/scanner, Brevo emails (Edge Functions), PDF receipts, search, reports, reviews, storage buckets.

## Setup (free tier, no card)
1. supabase.com > New project. Save the database password.
2. SQL Editor > paste `supabase/migrations/001_init.sql` > Run.
3. Authentication > Providers > Email enabled (keep "Confirm email" on).
4. Project Settings > API: copy URL and anon key into `.env` (copy `.env.example`).
5. `npm install && npm run dev`

## First admin
Register on the site, then in the SQL Editor run:
`update profiles set role='admin', approval_status='approved' where email='YOUR@EMAIL';`
Clients cannot do this themselves (no update policy for customers).

## Secrets
Brevo and PayMongo keys go in Supabase > Edge Functions > Secrets, never in the frontend or GitHub.
Note: free projects pause after about 1 week of inactivity (resume from the dashboard).

## Update 2: calendar, booking, admin, QR
Run `supabase/migrations/002_calendar_admin_qr.sql` in the SQL Editor after 001.
- `/calendar` is public (no login): weekly grid, free mechanics per slot. Booking needs an approved account.
- `/appointments` customer list with QR codes and cancel. `/admin` approvals, services, mechanics, appointments. `/admin/scan` camera scanner plus manual lookup.
- Booking is "pay at the shop" (no online payment yet). Shop hours are fixed Mon-Sat 8:00-17:00 Manila time.
- Still not built: PayMongo, Brevo email function, PDF receipts, breaks/leave per mechanic, reviews, reports.
