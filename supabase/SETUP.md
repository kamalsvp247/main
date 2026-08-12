# Supabase Setup Guide for T2Hub

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Create a new organization (or use existing)
4. Create a new project:
   - Name: `t2hub`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
   - Plan: Free tier is fine for development

## 2. Get API Keys

After project creation, go to:
**Settings → API**

You will see:
- **Project URL** → `SUPABASE_URL`
- **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for client-side)
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (for server-side, keep secret!)

## 3. Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Paste the contents of `supabase/schema.sql`
4. Click **"Run"**

This creates:
- `users` table
- `agents` table
- `quotas` table
- `payments` table
- `audit_logs` table
- `otp_requests` table
- `sessions` table
- Indexes and RLS policies

## 4. Configure Environment Variables

### Local Development (`.env`)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vercel Production

```bash
vercel env add SUPABASE_URL production --value "https://your-project.supabase.co" --yes --non-interactive --no-sensitive
vercel env add SUPABASE_SERVICE_ROLE_KEY production --value "your-service-role-key" --yes --non-interactive
```

## 5. Data Seeding

After Supabase is configured, seed initial data:

```bash
npm run db:seed
```

This creates:
- Master Agent: `master@t2hub.app` / password from `MASTER_AGENT_PASSWORD` env
- Admin: `admin@t2hub.app` / password from `ADMIN_PASSWORD` env
- Staff: `staff@t2hub.app` / password from `STAFF_PASSWORD` env

## 6. Verify Connection

```bash
curl http://localhost:3000/api/seed
```

Expected response:
```json
{
  "success": true,
  "data": {
    "master_agent": { "email": "master@t2hub.app", ... },
    "admin": { "email": "admin@t2hub.app", ... },
    "staff": { "email": "staff@t2hub.app", ... }
  }
}
```

## 7. Important Notes

| Topic | Detail |
|-------|--------|
| **Service Role Key** | Has admin access, never expose to client-side |
| **Anon Key** | Safe for client-side, respects RLS policies |
| **RLS Policies** | Currently permissive for development, tighten in production |
| **Data Persistence** | Supabase persists across restarts (unlike lowdb on Vercel) |
| **Migrations** | Use Supabase CLI or SQL Editor for schema changes |

## 8. Supabase CLI (Optional)

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-id
supabase db push
```
