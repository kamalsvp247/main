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
- `NOVNC_PUBLIC_URL` if Railway gives noVNC a separate public domain. Use the full browser URL, for example `https://your-novnc-domain.up.railway.app/vnc.html`. Do not add `:6080` to a Railway public URL unless Railway explicitly tells you to use that port.

Railway injects `PORT`; `start.sh` uses that port for the health check and Next.js startup.

## 3. Vercel frontend/previews

Import the same GitHub repository into Vercel and add the same Supabase public variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RAILWAY_BACKEND_URL` pointing to the Railway service URL. Vercel API routes proxy SVP browser actions to this backend automatically, so the browser starts on Railway instead of Vercel.

Add server-only secrets too if you want Vercel API routes to access Supabase directly:

- `JWT_SECRET`
- `REFRESH_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The `vercel.json` file allows Vercel builds on every branch. Keep Railway as the production browser automation service because the Docker image includes Xvfb, VNC, noVNC, and Chromium.

## 4. Automatic env sync from this repo

Real `.env.railway` and `.env.vercel` files are intentionally git-ignored because they contain secrets. Copy the examples, fill the real values, login to each provider CLI, then run:

```bash
cp .env.railway.example .env.railway
cp .env.vercel.example .env.vercel
# edit both files with real values
railway login
vercel login
npm run env:railway
npm run env:vercel
```

The scripts skip empty placeholder values and push the remaining keys to the selected provider.
