# Daima Ventures Platform

Next.js 16 (App Router, TypeScript, Tailwind CSS) application for Daima Ventures —
hosts the public site, the financing application form, and a role-based admin
dashboard. Backend data lives in Supabase (Postgres) with Google OAuth sign-in.

## Stack

- **Next.js 16.2.12** (App Router, Turbopack)
- **Supabase** — Postgres database, RLS, Google OAuth, server actions
- **Tailwind CSS v4**
- Deployed to **Vercel**

## Local development

Requirements: Node.js 22+ and npm.

```bash
npm install
cp .env.example .env.local   # then fill in Supabase values (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app compiles and runs **without** any environment variables — pages render
and the form submits are rejected with a clear "not configured" message until
Supabase is connected.

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://<project>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key (admin queries, role changes). Never expose to the client. |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (defaults to `http://localhost:3000`). Used for OAuth redirects. |

## Database setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run `supabase/migrations/0001_init.sql`.
   This creates the `profiles`, `applications`, and `events` tables, row-level
   security policies, and the `admin_list_users` / `set_user_role` RPCs.
3. Create a user with role `super_admin` in the `profiles` table to unlock
   the `/admin` view (e.g. after your first Google sign-in, run
   `update profiles set role = 'super_admin' where email = 'you@example.com';`).

## Google OAuth

1. In Supabase: **Authentication → Providers → Google**, enable it and set the
   client ID/secret from a Google Cloud OAuth 2.0 Client.
2. In Google Cloud Console, add the authorized redirect URI:
   `https://<project>.supabase.co/auth/v1/callback`.
3. In Supabase **Authentication → URL Configuration**, set the site URL to your
   app URL and add it to the redirect allow list.

## Roles

- `user` — signed-in visitor. Sees `/profile` and `/dashboard`.
- `admin` — staff: reads all applications, events, and activity.
- `super_admin` — full `/admin` view: user roles, applications, activity log,
  and geo/IP overview.

`/profile` and `/dashboard` are guarded by `src/proxy.ts`. `/admin` is gated by
a page-level role check, and the `set_user_role` RPC enforces super-admin
server-side regardless of the UI.

## Application submissions

`POST /api/submit-application` validates the payload (UGX loan ranges, `+256`
phone, 14-character NIN), enriches it with IP geolocation via
[ipapi.co](https://ipapi.co), and inserts into the `applications` table plus an
`application.submitted` event. Returns `503` until Supabase is configured.

## Deploy to Vercel

1. Push this folder to a Git repository.
2. Import the repo in [Vercel](https://vercel.com) (framework auto-detects Next.js).
3. Add the environment variables from `.env.example` in project settings.
4. Deploy. Set `NEXT_PUBLIC_APP_URL` to the production URL and re-add the
   production URL to the Supabase redirect allow list.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build + type check
npm run start   # serve production build
npm run lint    # eslint
```
