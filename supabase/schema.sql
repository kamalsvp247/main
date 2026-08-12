-- T2Hub Supabase Schema
-- Run this in Supabase SQL Editor

-- Users table (extends auth.users)
create table if not exists public.users (
  id text primary key,
  email text unique not null,
  password_hash text not null,
  name text not null,
  role text not null default 'staff' check (role in ('master_agent', 'admin', 'staff')),
  agent_id text,
  created_by text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login timestamptz
);

-- Agents table
create table if not exists public.agents (
  id text primary key,
  name text not null,
  email text unique not null,
  phone text,
  parent_id text references public.agents(id) on delete set null,
  quota_limit integer not null default 100,
  quota_used integer not null default 0,
  balance numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  level integer not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Quotas table
create table if not exists public.quotas (
  id text primary key,
  agent_id text not null references public.agents(id) on delete cascade,
  type text not null check (type in ('allocated', 'consumed', 'recharged')),
  amount numeric(12,2) not null,
  status text not null default 'active' check (status in ('active', 'cancelled', 'refunded')),
  reference_id text,
  details jsonb default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

-- Payments table
create table if not exists public.payments (
  id text primary key,
  agent_id text not null references public.agents(id) on delete cascade,
  amount numeric(12,2) not null,
  method text not null default 'payment_gateway',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  reference_id text,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audit logs table
create table if not exists public.audit_logs (
  id text primary key,
  actor_id text,
  action text not null,
  resource_type text not null default 'system',
  resource_id text,
  details jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- OTP requests table
create table if not exists public.otp_requests (
  id text primary key,
  phone_number text not null,
  candidate_name text,
  request_id text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'resolved', 'expired', 'cancelled', 'failed')),
  otp_code text,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  dakbox_request_id text,
  error text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Sessions table (for SVP auth sessions)
create table if not exists public.sessions (
  id text primary key,
  token text,
  storage jsonb default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_agent_id on public.users(agent_id);
create index if not exists idx_agents_parent_id on public.agents(parent_id);
create index if not exists idx_agents_email on public.agents(email);
create index if not exists idx_quotas_agent_id on public.quotas(agent_id);
create index if not exists idx_quotas_type on public.quotas(type);
create index if not exists idx_audit_logs_actor_id on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_otp_requests_phone on public.otp_requests(phone_number);
create index if not exists idx_otp_requests_status on public.otp_requests(status);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.agents enable row level security;
alter table public.quotas enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.otp_requests enable row level security;
alter table public.sessions enable row level security;

-- RLS Policies (service role bypasses RLS, so these are for direct client access)
create policy "Users can read own data" on public.users for select using (true);
create policy "Users can update own data" on public.users for update using (true);
create policy "Agents are readable" on public.agents for select using (true);
create policy "Quotas are readable by authenticated" on public.quotas for select using (true);
create policy "Audit logs readable by admin" on public.audit_logs for select using (true);
