-- ============================================================
-- Daima Ventures — platform schema v1
-- System of record: profiles, KYC applications, activity events.
-- Multi-tenant ready (tenant column on events; RLS role-based).
-- ============================================================

-- Roles --------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('user', 'admin', 'super_admin');
exception when duplicate_object then null; end $$;

-- Profiles (1:1 with auth.users) --------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  last_sign_in_at timestamptz,
  ip_address text,
  geo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Applications (KYC submissions) --------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  product text not null,
  loan_amount numeric not null,
  loan_purpose text,
  applicant jsonb not null default '{}'::jsonb,
  region text,
  district text,
  subcounty text,
  village text,
  ip_address text,
  geo jsonb,
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_status_idx on public.applications(status);
create index if not exists applications_created_at_idx on public.applications(created_at desc);
create index if not exists applications_region_idx on public.applications(region);
create index if not exists applications_submitted_by_idx on public.applications(submitted_by);

-- Events (append-only activity log, CloudEvents-style payloads) --------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  tenant text not null default 'daima-ventures',
  type text not null,
  actor uuid references auth.users(id) on delete set null,
  actor_role text,
  payload jsonb not null default '{}'::jsonb,
  ip_address text,
  geo jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_created_at_idx on public.events(created_at desc);
create index if not exists events_type_idx on public.events(type);
create index if not exists events_actor_idx on public.events(actor);

-- Row Level Security ---------------------------------------------------
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.events enable row level security;

-- profiles: users manage their own row; staff can read all
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_select_staff" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
  );

-- applications: staff full access, users read their own
create policy "applications_all_staff" on public.applications
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
  );

create policy "applications_select_own" on public.applications
  for select using (submitted_by = auth.uid());

-- events: staff read all; users read their own activity
create policy "events_select_staff" on public.events
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'super_admin'))
  );

create policy "events_select_own_actor" on public.events
  for select using (actor = auth.uid());

-- Auto-create a profile on signup --------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, last_sign_in_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url',
    new.last_sign_in_at
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Touch updated_at -----------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Admin helpers (super admin only; enforced inside the functions) -------
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role public.user_role,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin') then
    raise exception 'Forbidden';
  end if;
  return query
    select u.id, u.email, u.full_name, u.role, u.last_sign_in_at, u.created_at
    from public.profiles u
    order by u.created_at desc;
end;
$$;

create or replace function public.set_user_role(target uuid, new_role public.user_role)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin') then
    raise exception 'Forbidden';
  end if;
  update public.profiles set role = new_role where id = target;
end;
$$;
