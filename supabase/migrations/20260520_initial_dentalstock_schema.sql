-- DentalStock initial Supabase schema
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  category text not null default 'general',
  unit text not null default '개',
  stock numeric(12, 2) not null default 0 check (stock >= 0),
  min_stock numeric(12, 2) not null default 0 check (min_stock >= 0),
  desired_stock numeric(12, 2) not null default 0 check (desired_stock >= 0),
  vendor text,
  memo text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.txs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  type text not null check (type in ('in', 'out', 'adjust')),
  quantity numeric(12, 2) not null check (quantity > 0),
  reason text,
  actor_id uuid references public.profiles(id) on delete set null,
  surgery_id uuid,
  order_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  vendor text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'ordered', 'shipping', 'received', 'rejected', 'cancelled')),
  requested_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  shipment_group_id text,
  tracking_number text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  received_at timestamptz,
  items jsonb not null default '[]'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.surgeries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_name text not null,
  procedure_name text not null,
  scheduled_at timestamptz not null,
  status text not null default 'planned' check (status in ('planned', 'prepared', 'completed', 'cancelled')),
  expected_items jsonb not null default '[]'::jsonb,
  actual_items jsonb not null default '[]'::jsonb,
  prepared_by uuid references public.profiles(id) on delete set null,
  confirmed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  vendors jsonb not null default '[]'::jsonb,
  reorder_rules jsonb not null default '{}'::jsonb,
  app_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_credentials (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  vendor text not null,
  encrypted_payload text not null,
  key_version text not null default 'v1',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, vendor)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.order_jobs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  vendor text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_clinic_id_idx on public.profiles(clinic_id);
create index if not exists items_clinic_id_name_idx on public.items(clinic_id, name);
create index if not exists txs_clinic_id_created_at_idx on public.txs(clinic_id, created_at desc);
create index if not exists txs_item_id_idx on public.txs(item_id);
create index if not exists orders_clinic_id_status_idx on public.orders(clinic_id, status);
create index if not exists surgeries_clinic_id_scheduled_at_idx on public.surgeries(clinic_id, scheduled_at desc);
create index if not exists notifs_user_id_created_at_idx on public.notifs(user_id, created_at desc);
create index if not exists audit_logs_clinic_id_created_at_idx on public.audit_logs(clinic_id, created_at desc);
create index if not exists order_jobs_status_created_at_idx on public.order_jobs(status, created_at);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clinics_touch_updated_at on public.clinics;
create trigger clinics_touch_updated_at before update on public.clinics
for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at before update on public.items
for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders
for each row execute function public.touch_updated_at();

drop trigger if exists surgeries_touch_updated_at on public.surgeries;
create trigger surgeries_touch_updated_at before update on public.surgeries
for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch_updated_at on public.settings;
create trigger settings_touch_updated_at before update on public.settings
for each row execute function public.touch_updated_at();

drop trigger if exists vendor_credentials_touch_updated_at on public.vendor_credentials;
create trigger vendor_credentials_touch_updated_at before update on public.vendor_credentials
for each row execute function public.touch_updated_at();

drop trigger if exists order_jobs_touch_updated_at on public.order_jobs;
create trigger order_jobs_touch_updated_at before update on public.order_jobs
for each row execute function public.touch_updated_at();

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.is_clinic_member(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and clinic_id = target_clinic_id
  )
$$;

create or replace function public.can_manage_clinic(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and clinic_id = target_clinic_id
      and role in ('owner', 'manager')
  )
$$;

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.txs enable row level security;
alter table public.orders enable row level security;
alter table public.surgeries enable row level security;
alter table public.notifs enable row level security;
alter table public.settings enable row level security;
alter table public.vendor_credentials enable row level security;
alter table public.audit_logs enable row level security;
alter table public.order_jobs enable row level security;

drop policy if exists "members can read their clinic" on public.clinics;
create policy "members can read their clinic"
on public.clinics for select
using (public.is_clinic_member(id));

drop policy if exists "members can read clinic profiles" on public.profiles;
create policy "members can read clinic profiles"
on public.profiles for select
using (public.is_clinic_member(clinic_id));

drop policy if exists "managers can update clinic profiles" on public.profiles;
create policy "managers can update clinic profiles"
on public.profiles for update
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "members can read items" on public.items;
create policy "members can read items"
on public.items for select
using (public.is_clinic_member(clinic_id));

drop policy if exists "managers can manage items" on public.items;
create policy "managers can manage items"
on public.items for all
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "members can read stock transactions" on public.txs;
create policy "members can read stock transactions"
on public.txs for select
using (public.is_clinic_member(clinic_id));

drop policy if exists "members can create stock transactions" on public.txs;
create policy "members can create stock transactions"
on public.txs for insert
with check (public.is_clinic_member(clinic_id));

drop policy if exists "members can read orders" on public.orders;
create policy "members can read orders"
on public.orders for select
using (public.is_clinic_member(clinic_id));

drop policy if exists "members can create orders" on public.orders;
create policy "members can create orders"
on public.orders for insert
with check (public.is_clinic_member(clinic_id));

drop policy if exists "managers can update orders" on public.orders;
create policy "managers can update orders"
on public.orders for update
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "members can read surgeries" on public.surgeries;
create policy "members can read surgeries"
on public.surgeries for select
using (public.is_clinic_member(clinic_id));

drop policy if exists "managers can manage surgeries" on public.surgeries;
create policy "managers can manage surgeries"
on public.surgeries for all
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "members can read notifications" on public.notifs;
create policy "members can read notifications"
on public.notifs for select
using (public.is_clinic_member(clinic_id) and (user_id is null or user_id = auth.uid()));

drop policy if exists "members can update their notifications" on public.notifs;
create policy "members can update their notifications"
on public.notifs for update
using (public.is_clinic_member(clinic_id) and (user_id is null or user_id = auth.uid()))
with check (public.is_clinic_member(clinic_id) and (user_id is null or user_id = auth.uid()));

drop policy if exists "members can read settings" on public.settings;
create policy "members can read settings"
on public.settings for select
using (public.is_clinic_member(clinic_id));

drop policy if exists "managers can manage settings" on public.settings;
create policy "managers can manage settings"
on public.settings for all
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "managers can read audit logs" on public.audit_logs;
create policy "managers can read audit logs"
on public.audit_logs for select
using (public.can_manage_clinic(clinic_id));

-- vendor_credentials and order_jobs intentionally have no browser policies.
-- They are for server-side service-role access only.

insert into public.clinics (id, name)
values ('00000000-0000-0000-0000-000000000001', 'DentalStock Demo Clinic')
on conflict (id) do nothing;

insert into public.settings (clinic_id, vendors, reorder_rules, app_config)
values (
  '00000000-0000-0000-0000-000000000001',
  '[
    {"id":"denall","name":"덴올","enabled":true},
    {"id":"osstem","name":"오스템몰","enabled":true},
    {"id":"edent","name":"이덴트","enabled":true}
  ]'::jsonb,
  '{"preferredStrategy":"lowest","maxAutoOrderAmount":50000}'::jsonb,
  '{"pilotMode":true}'::jsonb
)
on conflict (clinic_id) do nothing;
