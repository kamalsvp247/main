# Railway + Vercel + Supabase deployment

## 1. Supabase

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Copy these values from Project Settings > API:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Railway backend

Railway should use the included `railway.json` and `Dockerfile`.

Set these Railway variables:

- `NODE_ENV=production`
- `JWT_SECRET`
- `REFRESH_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional: `DAKBOX_API_KEY`, `DAKBOX_API_URL`, `SVP_BASE`, `SVP_API_BASE`

Railway injects `PORT`; `start.sh` uses that port for the health check and Next.js startup.

## 3. Vercel frontend/previews

Import the same GitHub repository into Vercel and add the same Supabase public variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RAILWAY_BACKEND_URL` pointing to the Railway service URL

Add server-only secrets too if you want Vercel API routes to access Supabase directly:

- `JWT_SECRET`
- `REFRESH_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The `vercel.json` file allows Vercel builds on every branch. Keep Railway as the production browser automation service because the Docker image includes Xvfb, VNC, noVNC, and Chromium.
