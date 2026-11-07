# Criticaller 🐛→🦋

Make a call. Show your reasoning. Put a number on it. Get your receipts. See the build spec for the full product.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind · Supabase (Postgres, Auth, RLS) · Vercel

## Setup
1. `pnpm install`
2. Create a Supabase project. Run `supabase/migrations/*.sql` in order (SQL editor, or `supabase db push`).
3. In Supabase → Authentication: enable Email (magic link) and Google. Add redirect URLs
   `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`.
4. `cp .env.example .env.local` and fill in the Supabase keys.
5. `pnpm dev`

## Make yourself a moderator
After signing in once: `update profiles set is_moderator = true where handle = '<your-handle>';` (SQL editor, service role).

## Deploy
Import the repo in Vercel, set the env vars from `.env.example`, deploy, then attach the domain.
