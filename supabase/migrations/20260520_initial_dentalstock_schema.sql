-- DentalStock baseline schema
-- Consolidated from the 20260520 migration set so Supabase CLI sees one stable version.
-- Historical source files are kept under supabase/migrations_archive/20260520.

-- -----------------------------------------------------------------------------
-- Source: 20260520_initial_dentalstock_schema.sql
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- Source: 20260520_rls_hardening.sql
-- -----------------------------------------------------------------------------

-- DentalStock RLS hardening
-- Idempotent migration: safe to re-run after the initial schema migration.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'manager', 'staff', 'hygienist'));

create or replace function public.is_clinic_owner(target_clinic_id uuid)
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
      and role = 'owner'
  )
$$;

create or replace function public.harden_order_user_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.requested_by = current_user_id;
    new.status = 'pending';
    new.approved_by = null;
    new.approved_at = null;
  elsif tg_op = 'UPDATE' then
    new.clinic_id = old.clinic_id;
    new.requested_by = old.requested_by;

    if new.status in ('approved', 'ordered', 'shipping', 'received', 'rejected')
      and old.status is distinct from new.status then
      new.approved_by = current_user_id;
      new.approved_at = coalesce(new.approved_at, now());
    elsif new.approved_by is distinct from old.approved_by then
      new.approved_by = current_user_id;
      new.approved_at = coalesce(new.approved_at, now());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_harden_user_fields on public.orders;
create trigger orders_harden_user_fields
before insert or update on public.orders
for each row execute function public.harden_order_user_fields();

create or replace function public.harden_tx_actor_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is not null then
    new.actor_id = current_user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists txs_harden_actor_id on public.txs;
create trigger txs_harden_actor_id
before insert on public.txs
for each row execute function public.harden_tx_actor_id();

drop policy if exists "managers can update clinic profiles" on public.profiles;
drop policy if exists "owners can update clinic profiles" on public.profiles;
create policy "owners can update clinic profiles"
on public.profiles for update
using (public.is_clinic_owner(clinic_id))
with check (public.is_clinic_owner(clinic_id));

drop policy if exists "members can create stock transactions" on public.txs;
create policy "members can create stock transactions"
on public.txs for insert
with check (
  public.is_clinic_member(clinic_id)
  and actor_id = auth.uid()
);

drop policy if exists "members can create orders" on public.orders;
create policy "members can create orders"
on public.orders for insert
with check (
  public.is_clinic_member(clinic_id)
  and requested_by = auth.uid()
  and status = 'pending'
  and approved_by is null
  and approved_at is null
);

drop policy if exists "managers can update orders" on public.orders;
create policy "managers can update orders"
on public.orders for update
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "managers can manage items" on public.items;
drop policy if exists "managers can create items" on public.items;
drop policy if exists "managers can update items" on public.items;
create policy "managers can create items"
on public.items for insert
with check (public.can_manage_clinic(clinic_id));

create policy "managers can update items"
on public.items for update
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "managers can manage surgeries" on public.surgeries;
drop policy if exists "managers can create surgeries" on public.surgeries;
drop policy if exists "managers can update surgeries" on public.surgeries;
create policy "managers can create surgeries"
on public.surgeries for insert
with check (public.can_manage_clinic(clinic_id));

create policy "managers can update surgeries"
on public.surgeries for update
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "managers can manage settings" on public.settings;
drop policy if exists "managers can create settings" on public.settings;
drop policy if exists "managers can update settings" on public.settings;
create policy "managers can create settings"
on public.settings for insert
with check (public.can_manage_clinic(clinic_id));

create policy "managers can update settings"
on public.settings for update
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

-- vendor_credentials and order_jobs intentionally keep RLS enabled with no client policies.

-- -----------------------------------------------------------------------------
-- Source: 20260520_items_bridge_and_seed.sql
-- -----------------------------------------------------------------------------

-- DentalStock items bridge + demo seed
-- Run after 20260520_initial_dentalstock_schema.sql and 20260520_rls_hardening.sql.

alter table public.items
  add column if not exists legacy_id text;

alter table public.items
  add column if not exists app_data jsonb not null default '{}'::jsonb;

create unique index if not exists items_clinic_id_legacy_id_idx
on public.items(clinic_id, legacy_id)
where legacy_id is not null;

with seed_items as (
  select *
  from jsonb_to_recordset($$[
    {"id":"1","name":"라텍스 장갑 (S)","category_id":1,"unit":"박스","current_qty":8,"min_qty":5,"location":"창고 A-1","expiry":null},
    {"id":"2","name":"라텍스 장갑 (M)","category_id":1,"unit":"박스","current_qty":4,"min_qty":5,"location":"창고 A-1","expiry":null,"vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":5200},{"vendor_id":2,"vendor_name":"오스템몰","price":5000}]},
    {"id":"3","name":"니트릴 장갑 (L)","category_id":1,"unit":"박스","current_qty":12,"min_qty":5,"location":"창고 A-2","expiry":null},
    {"id":"4","name":"마스크 KF94","category_id":1,"unit":"박스","current_qty":15,"min_qty":10,"location":"창고 A-3","expiry":"2028-01-01"},
    {"id":"5","name":"덴탈 마스크","category_id":1,"unit":"박스","current_qty":9,"min_qty":10,"location":"창고 A-3","expiry":"2027-10-15","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":11000},{"vendor_id":2,"vendor_name":"오스템몰","price":10400}]},
    {"id":"6","name":"거즈 4x4","category_id":1,"unit":"팩","current_qty":7,"min_qty":10,"location":"창고 B-1","expiry":"2026-11-20","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":7800},{"vendor_id":2,"vendor_name":"오스템몰","price":8200}]},
    {"id":"7","name":"코튼롤","category_id":1,"unit":"봉","current_qty":18,"min_qty":8,"location":"창고 B-2","expiry":null},
    {"id":"8","name":"알코올 스왑","category_id":1,"unit":"박스","current_qty":14,"min_qty":10,"location":"창고 B-3","expiry":"2027-04-01"},
    {"id":"9","name":"석션 팁","category_id":1,"unit":"봉","current_qty":5,"min_qty":6,"location":"창고 C-1","expiry":null,"vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":4500},{"vendor_id":2,"vendor_name":"오스템몰","price":4300}]},
    {"id":"10","name":"3-way syringe tip","category_id":1,"unit":"봉","current_qty":11,"min_qty":5,"location":"창고 C-1","expiry":null},
    {"id":"11","name":"리도카인 2%","category_id":2,"unit":"앰플","current_qty":22,"min_qty":10,"location":"약품실 D-1","expiry":"2026-08-12"},
    {"id":"12","name":"에피네프린","category_id":2,"unit":"앰플","current_qty":3,"min_qty":5,"location":"응급키트","expiry":"2026-05-30","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":36000},{"vendor_id":2,"vendor_name":"오스템몰","price":34200}]},
    {"id":"13","name":"아목시실린","category_id":2,"unit":"통","current_qty":7,"min_qty":3,"location":"약품실 D-2","expiry":"2027-03-01"},
    {"id":"14","name":"이부프로펜","category_id":2,"unit":"통","current_qty":10,"min_qty":5,"location":"약품실 D-2","expiry":"2027-09-15"},
    {"id":"15","name":"클로르헥시딘 가글","category_id":2,"unit":"병","current_qty":6,"min_qty":4,"location":"약품실 D-3","expiry":"2026-12-20"},
    {"id":"16","name":"레진 A1","category_id":3,"unit":"개","current_qty":5,"min_qty":5,"location":"재료실 E-1","expiry":"2026-10-01"},
    {"id":"17","name":"레진 A2","category_id":3,"unit":"개","current_qty":7,"min_qty":5,"location":"재료실 E-1","expiry":"2026-09-10"},
    {"id":"18","name":"레진 A3","category_id":3,"unit":"개","current_qty":2,"min_qty":5,"location":"재료실 E-1","expiry":"2026-09-10","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":17000},{"vendor_id":2,"vendor_name":"오스템몰","price":15800}]},
    {"id":"19","name":"본딩제","category_id":3,"unit":"병","current_qty":4,"min_qty":3,"location":"재료실 E-2","expiry":"2026-07-15"},
    {"id":"20","name":"에칭젤","category_id":3,"unit":"개","current_qty":8,"min_qty":4,"location":"재료실 E-2","expiry":"2027-01-11"},
    {"id":"21","name":"GI Cement","category_id":3,"unit":"세트","current_qty":3,"min_qty":2,"location":"재료실 E-3","expiry":"2026-06-22"},
    {"id":"22","name":"Temp Cement","category_id":3,"unit":"세트","current_qty":5,"min_qty":3,"location":"재료실 E-3","expiry":"2027-03-12"},
    {"id":"23","name":"알지네이트","category_id":3,"unit":"봉","current_qty":6,"min_qty":4,"location":"인상재실 F-1","expiry":"2026-08-01"},
    {"id":"24","name":"실리콘 인상재 Heavy","category_id":3,"unit":"통","current_qty":4,"min_qty":3,"location":"인상재실 F-1","expiry":"2026-11-10"},
    {"id":"25","name":"실리콘 인상재 Light","category_id":3,"unit":"통","current_qty":2,"min_qty":3,"location":"인상재실 F-2","expiry":"2026-10-18","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":23500},{"vendor_id":2,"vendor_name":"오스템몰","price":22900}]},
    {"id":"26","name":"Bite Registration","category_id":3,"unit":"개","current_qty":7,"min_qty":3,"location":"인상재실 F-2","expiry":"2027-02-01"},
    {"id":"27","name":"임플란트 픽스처 4.0mm","category_id":3,"unit":"개","current_qty":12,"min_qty":10,"location":"임플란트실 G-1","expiry":null},
    {"id":"28","name":"임플란트 픽스처 4.5mm","category_id":3,"unit":"개","current_qty":9,"min_qty":10,"location":"임플란트실 G-1","expiry":null,"vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":82000},{"vendor_id":2,"vendor_name":"오스템몰","price":79500}]},
    {"id":"29","name":"Healing Abutment","category_id":3,"unit":"개","current_qty":15,"min_qty":8,"location":"임플란트실 G-2","expiry":null},
    {"id":"30","name":"Cover Screw","category_id":3,"unit":"개","current_qty":20,"min_qty":10,"location":"임플란트실 G-2","expiry":null},
    {"id":"31","name":"Bone Graft","category_id":3,"unit":"병","current_qty":4,"min_qty":5,"location":"냉장 H-1","expiry":"2026-09-25","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":69000},{"vendor_id":2,"vendor_name":"오스템몰","price":71000}]},
    {"id":"32","name":"Collagen Membrane","category_id":3,"unit":"개","current_qty":6,"min_qty":4,"location":"냉장 H-1","expiry":"2026-12-12"},
    {"id":"33","name":"교정 브라켓 MBT","category_id":3,"unit":"세트","current_qty":5,"min_qty":3,"location":"교정실 I-1","expiry":null},
    {"id":"34","name":"NiTi Wire 0.014","category_id":3,"unit":"개","current_qty":18,"min_qty":10,"location":"교정실 I-2","expiry":null},
    {"id":"35","name":"Power Chain","category_id":3,"unit":"롤","current_qty":9,"min_qty":5,"location":"교정실 I-2","expiry":null},
    {"id":"36","name":"구강 카메라","category_id":4,"unit":"대","current_qty":2,"min_qty":1,"location":"진료실 1","expiry":null},
    {"id":"37","name":"광중합기","category_id":4,"unit":"대","current_qty":4,"min_qty":2,"location":"장비실 J-1","expiry":null},
    {"id":"38","name":"초음파 스케일러 팁","category_id":4,"unit":"개","current_qty":8,"min_qty":3,"location":"장비실 J-2","expiry":null},
    {"id":"39","name":"멸균 파우치","category_id":1,"unit":"박스","current_qty":11,"min_qty":5,"location":"멸균실 K-1","expiry":"2028-03-01"},
    {"id":"40","name":"멸균 인디케이터","category_id":1,"unit":"팩","current_qty":3,"min_qty":4,"location":"멸균실 K-1","expiry":"2026-07-07","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":9800},{"vendor_id":2,"vendor_name":"오스템몰","price":9400}]}
  ]$$::jsonb) as item(
    id text,
    name text,
    category_id integer,
    unit text,
    current_qty numeric,
    min_qty numeric,
    location text,
    expiry text,
    vendor_options jsonb
  )
)
insert into public.items (
  clinic_id,
  legacy_id,
  name,
  category,
  unit,
  stock,
  min_stock,
  desired_stock,
  vendor,
  memo,
  app_data
)
select
  '00000000-0000-0000-0000-000000000001',
  id,
  name,
  category_id::text,
  unit,
  current_qty,
  min_qty,
  min_qty,
  null,
  location,
  jsonb_strip_nulls(jsonb_build_object(
    'id', id,
    'category_id', category_id,
    'location', location,
    'expiry', expiry,
    'vendor_options', vendor_options
  ))
from seed_items
on conflict (clinic_id, legacy_id) where legacy_id is not null
do update set
  name = excluded.name,
  category = excluded.category,
  unit = excluded.unit,
  stock = excluded.stock,
  min_stock = excluded.min_stock,
  desired_stock = excluded.desired_stock,
  memo = excluded.memo,
  app_data = excluded.app_data,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- Source: 20260520_stock_transaction_rpc.sql
-- -----------------------------------------------------------------------------

-- DentalStock stock transaction RPC
-- Applies stock movement and writes txs atomically.

create or replace function public.apply_stock_transaction(
  p_item_id uuid,
  p_type text,
  p_quantity numeric,
  p_reason text default null
)
returns public.items
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  item_row public.items;
  next_stock numeric;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_type not in ('in', 'out') then
    raise exception 'invalid_stock_transaction_type';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'invalid_stock_transaction_quantity';
  end if;

  select *
  into item_row
  from public.items
  where id = p_item_id
  for update;

  if item_row.id is null then
    raise exception 'item_not_found';
  end if;

  if not public.is_clinic_member(item_row.clinic_id) then
    raise exception 'clinic_access_denied';
  end if;

  if p_type = 'out' and item_row.stock < p_quantity then
    raise exception 'insufficient_stock';
  end if;

  next_stock := case
    when p_type = 'in' then item_row.stock + p_quantity
    else item_row.stock - p_quantity
  end;

  update public.items
  set stock = next_stock,
      updated_at = now()
  where id = item_row.id
  returning * into item_row;

  insert into public.txs (
    clinic_id,
    item_id,
    type,
    quantity,
    reason,
    actor_id
  )
  values (
    item_row.clinic_id,
    item_row.id,
    p_type,
    p_quantity,
    nullif(trim(coalesce(p_reason, '')), ''),
    current_user_id
  );

  return item_row;
end;
$$;

revoke all on function public.apply_stock_transaction(uuid, text, numeric, text) from public;
revoke all on function public.apply_stock_transaction(uuid, text, numeric, text) from anon;
grant execute on function public.apply_stock_transaction(uuid, text, numeric, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Source: 20260520_orders_bridge_and_seed.sql
-- -----------------------------------------------------------------------------

-- DentalStock orders bridge + demo seed
-- Run after stock/item migrations.

alter table public.orders
  add column if not exists legacy_id text;

alter table public.orders
  add column if not exists app_data jsonb not null default '{}'::jsonb;

create unique index if not exists orders_clinic_id_legacy_id_idx
on public.orders(clinic_id, legacy_id)
where legacy_id is not null;

with seed_orders as (
  select *
  from jsonb_to_recordset($$[
    {"id":"o1","item_id":"12","requested_by":"박위생사","requested_at":"2026-05-19T08:10:00","qty":10,"note":"에피네프린 재고 부족","status":"pending","reviewed_by":null,"reviewed_at":null,"review_note":"","vendor_id":"2","vendor_name":"오스템몰","vendor_price":34200,"vendor_selection":"lowest"},
    {"id":"o2","item_id":"18","requested_by":"최위생사","requested_at":"2026-05-18T16:30:00","qty":5,"note":"레진 A3 시급","status":"ordered","vendor_id":"2","vendor_name":"오스템몰","vendor_price":15800,"vendor_selection":"lowest","reviewed_by":"이매니저","reviewed_at":"2026-05-18T17:00:00","review_note":"승인합니다","carrier":"CJ대한통운","tracking_number":"9876543210","shipping_events":[{"status":"배송중","timestamp":"2026-05-19T09:20:00","location":"서울 집배센터","completed":true},{"status":"주문접수","timestamp":"2026-05-18T17:00:00","location":"도매 사이트","completed":true}]},
    {"id":"o3","item_id":"6","requested_by":"정위생사","requested_at":"2026-05-12T10:00:00","qty":10,"note":"거즈 부족","status":"received","vendor_id":"1","vendor_name":"덴올","vendor_price":7800,"vendor_selection":"lowest","reviewed_by":"이매니저","reviewed_at":"2026-05-12T11:00:00","review_note":"","carrier":"롯데택배","tracking_number":"5522331144","shipping_events":[{"status":"입고완료","timestamp":"2026-05-14T10:30:00","location":"치과 재고실","completed":true},{"status":"배송중","timestamp":"2026-05-13T15:10:00","location":"서울 물류센터","completed":true},{"status":"주문접수","timestamp":"2026-05-12T11:00:00","location":"도매 사이트","completed":true}]},
    {"id":"o4","item_id":"5","requested_by":"박위생사","requested_at":"2026-05-10T09:00:00","qty":5,"note":"덴탈 마스크 부족","status":"rejected","reviewed_by":"이매니저","reviewed_at":"2026-05-10T14:00:00","review_note":"이번달 예산 초과","vendor_id":"2","vendor_name":"오스템몰","vendor_price":10400,"vendor_selection":"lowest"}
  ]$$::jsonb) as order_row(
    id text,
    item_id text,
    requested_by text,
    requested_at timestamptz,
    qty numeric,
    note text,
    status text,
    reviewed_by text,
    reviewed_at timestamptz,
    review_note text,
    vendor_id text,
    vendor_name text,
    vendor_price numeric,
    vendor_selection text,
    carrier text,
    tracking_number text,
    shipping_events jsonb
  )
)
insert into public.orders (
  clinic_id,
  legacy_id,
  vendor,
  status,
  shipment_group_id,
  tracking_number,
  requested_at,
  approved_at,
  received_at,
  items,
  totals,
  notes,
  app_data
)
select
  '00000000-0000-0000-0000-000000000001',
  id,
  coalesce(vendor_name, '거래처 미정'),
  status,
  null,
  tracking_number,
  requested_at,
  case when status in ('ordered', 'received') then reviewed_at else null end,
  case when status = 'received' then coalesce((shipping_events->0->>'timestamp')::timestamptz, reviewed_at) else null end,
  jsonb_build_array(jsonb_build_object('item_id', item_id, 'qty', qty)),
  jsonb_strip_nulls(jsonb_build_object('vendor_price', vendor_price)),
  note,
  jsonb_strip_nulls(jsonb_build_object(
    'id', id,
    'item_id', item_id,
    'requested_by', requested_by,
    'requested_at', requested_at,
    'qty', qty,
    'note', note,
    'status', status,
    'reviewed_by', reviewed_by,
    'reviewed_at', reviewed_at,
    'review_note', review_note,
    'vendor_id', vendor_id,
    'vendor_name', vendor_name,
    'vendor_price', vendor_price,
    'vendor_selection', vendor_selection,
    'carrier', carrier,
    'tracking_number', tracking_number,
    'shipping_events', shipping_events
  ))
from seed_orders
on conflict (clinic_id, legacy_id) where legacy_id is not null
do update set
  vendor = excluded.vendor,
  status = excluded.status,
  tracking_number = excluded.tracking_number,
  requested_at = excluded.requested_at,
  approved_at = excluded.approved_at,
  received_at = excluded.received_at,
  items = excluded.items,
  totals = excluded.totals,
  notes = excluded.notes,
  app_data = excluded.app_data,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- Source: 20260520_order_receipt_rpc.sql
-- -----------------------------------------------------------------------------

-- DentalStock order receipt RPC
-- Receives an ordered order, increments stock, and writes txs atomically.

drop function if exists public.receive_order_stock(uuid, numeric, text);

create or replace function public.receive_order_stock(
  p_order_id uuid,
  p_actual_qty numeric,
  p_note text default null,
  p_shipping_events jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  order_row public.orders;
  item_row public.items;
  order_item jsonb;
  item_legacy_id text;
  ordered_qty numeric;
  already_received numeric;
  total_received numeric;
  next_status text;
  received_at_value timestamptz := now();
  next_app_data jsonb;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_actual_qty is null or p_actual_qty <= 0 then
    raise exception 'invalid_receipt_quantity';
  end if;

  select *
  into order_row
  from public.orders
  where id = p_order_id
  for update;

  if order_row.id is null then
    raise exception 'order_not_found';
  end if;

  if not public.can_manage_clinic(order_row.clinic_id) then
    raise exception 'clinic_manage_denied';
  end if;

  if order_row.status <> 'ordered' then
    raise exception 'order_not_receivable';
  end if;

  order_item := coalesce(order_row.items->0, '{}'::jsonb);
  item_legacy_id := order_item->>'item_id';
  ordered_qty := nullif(order_item->>'qty', '')::numeric;
  already_received := coalesce(nullif(order_row.app_data->>'received_qty', '')::numeric, 0);
  total_received := already_received + p_actual_qty;
  next_status := case when total_received >= ordered_qty then 'received' else 'ordered' end;

  select *
  into item_row
  from public.items
  where clinic_id = order_row.clinic_id
    and (
      id::text = item_legacy_id
      or legacy_id = item_legacy_id
    )
  for update;

  if item_row.id is null then
    raise exception 'order_item_not_found';
  end if;

  update public.items
  set stock = stock + p_actual_qty,
      updated_at = received_at_value
  where id = item_row.id
  returning * into item_row;

  insert into public.txs (
    clinic_id,
    item_id,
    type,
    quantity,
    reason,
    actor_id
  )
  values (
    order_row.clinic_id,
    item_row.id,
    'in',
    p_actual_qty,
    nullif(trim(coalesce(p_note, '')), ''),
    current_user_id
  );

  next_app_data := jsonb_set(
    coalesce(order_row.app_data, '{}'::jsonb),
    '{status}',
    to_jsonb(next_status),
    true
  );
  next_app_data := jsonb_set(next_app_data, '{received_qty}', to_jsonb(total_received), true);
  next_app_data := jsonb_set(
    next_app_data,
    case when next_status = 'received' then '{received_at}' else '{partial_received_at}' end,
    to_jsonb(received_at_value),
    true
  );
  if p_shipping_events is not null and jsonb_typeof(p_shipping_events) = 'array' then
    next_app_data := jsonb_set(next_app_data, '{shipping_events}', p_shipping_events, true);
  end if;

  update public.orders
  set status = next_status,
      received_at = case when next_status = 'received' then received_at_value else public.orders.received_at end,
      app_data = next_app_data,
      updated_at = received_at_value
  where id = order_row.id
  returning * into order_row;

  return jsonb_build_object(
    'order', to_jsonb(order_row),
    'item', to_jsonb(item_row)
  );
end;
$$;

revoke all on function public.receive_order_stock(uuid, numeric, text, jsonb) from public;
revoke all on function public.receive_order_stock(uuid, numeric, text, jsonb) from anon;
grant execute on function public.receive_order_stock(uuid, numeric, text, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Source: 20260520_activity_bridge.sql
-- -----------------------------------------------------------------------------

-- DentalStock activity bridge
-- Adds stable legacy ids for client-created notifications and read-state syncing.

alter table public.notifs
  add column if not exists legacy_id text,
  add column if not exists app_data jsonb not null default '{}'::jsonb;

create unique index if not exists notifs_clinic_legacy_id_idx
on public.notifs (clinic_id, legacy_id);

drop policy if exists "members can create notifications" on public.notifs;
create policy "members can create notifications"
on public.notifs for insert
with check (public.is_clinic_member(clinic_id));

drop policy if exists "members can update clinic notifications" on public.notifs;
create policy "members can update clinic notifications"
on public.notifs for update
using (public.is_clinic_member(clinic_id))
with check (public.is_clinic_member(clinic_id));

drop policy if exists "members can create audit logs" on public.audit_logs;
create policy "members can create audit logs"
on public.audit_logs for insert
with check (public.is_clinic_member(clinic_id));

-- -----------------------------------------------------------------------------
-- Source: 20260520_staff_management.sql
-- -----------------------------------------------------------------------------

-- DentalStock staff management
-- Adds active staff state, role/profile RPCs, and last active owner protection.

alter table public.profiles
  add column if not exists email text,
  add column if not exists is_active boolean not null default true,
  add column if not exists disabled_at timestamptz,
  add column if not exists last_seen_at timestamptz;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is distinct from u.email;

update public.profiles
set disabled_at = null
where is_active = true
  and disabled_at is not null;

create index if not exists profiles_clinic_active_role_idx
on public.profiles (clinic_id, is_active, role);

create index if not exists profiles_email_idx
on public.profiles (email);

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'manager', 'hygienist', 'staff'));

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
      and is_active = true
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
      and is_active = true
  )
$$;

create or replace function public.is_clinic_owner(target_clinic_id uuid)
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
      and role = 'owner'
      and is_active = true
  )
$$;

create or replace function public.prevent_last_active_owner_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'owner' and old.is_active = true then
    if tg_op = 'DELETE'
      and not exists (
        select 1
        from public.profiles p
        where p.clinic_id = old.clinic_id
          and p.id <> old.id
          and p.role = 'owner'
          and p.is_active = true
      ) then
      raise exception 'Cannot remove the last active owner from a clinic'
        using errcode = '23514';
    end if;

    if tg_op = 'UPDATE'
      and (
        new.role is distinct from 'owner'
        or new.is_active is distinct from true
        or new.clinic_id is distinct from old.clinic_id
      )
      and not exists (
        select 1
        from public.profiles p
        where p.clinic_id = old.clinic_id
          and p.id <> old.id
          and p.role = 'owner'
          and p.is_active = true
      ) then
      raise exception 'Cannot remove the last active owner from a clinic'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.is_active = true then
    new.disabled_at = null;
  elsif new.disabled_at is null then
    new.disabled_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_last_active_owner_change on public.profiles;
create trigger profiles_prevent_last_active_owner_change
before update of clinic_id, role, is_active, disabled_at or delete on public.profiles
for each row execute function public.prevent_last_active_owner_change();

create or replace function public.set_profile_active(p_profile_id uuid, p_is_active boolean)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  changed_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select *
  into actor_profile
  from public.profiles
  where id = auth.uid()
    and is_active = true
    and role = 'owner';

  if not found then
    raise exception 'Only an active owner can change staff active state'
      using errcode = '42501';
  end if;

  select *
  into target_profile
  from public.profiles
  where id = p_profile_id
  for update;

  if not found or target_profile.clinic_id <> actor_profile.clinic_id then
    raise exception 'Profile not found'
      using errcode = 'P0002';
  end if;

  if p_is_active is null then
    raise exception 'Active state is required'
      using errcode = '22004';
  end if;

  if p_profile_id = auth.uid() and p_is_active = false then
    raise exception 'Owners cannot deactivate their own profile'
      using errcode = '42501';
  end if;

  if target_profile.role = 'owner'
    and target_profile.is_active = true
    and p_is_active = false
    and not exists (
      select 1
      from public.profiles p
      where p.clinic_id = target_profile.clinic_id
        and p.id <> target_profile.id
        and p.role = 'owner'
        and p.is_active = true
    ) then
    raise exception 'Cannot deactivate the last active owner'
      using errcode = '23514';
  end if;

  update public.profiles
  set is_active = p_is_active,
      disabled_at = case when p_is_active then null else coalesce(disabled_at, now()) end
  where id = p_profile_id
  returning *
  into changed_profile;

  insert into public.audit_logs (clinic_id, actor_id, action, target_type, target_id, metadata)
  values (
    actor_profile.clinic_id,
    actor_profile.id,
    'staff.active_changed',
    'profile',
    changed_profile.id::text,
    jsonb_build_object(
      'previous_is_active', target_profile.is_active,
      'is_active', changed_profile.is_active,
      'previous_disabled_at', target_profile.disabled_at,
      'disabled_at', changed_profile.disabled_at
    )
  );

  return changed_profile;
end;
$$;

create or replace function public.set_profile_role(p_profile_id uuid, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  changed_profile public.profiles%rowtype;
  normalized_role text := lower(nullif(btrim(p_role), ''));
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select *
  into actor_profile
  from public.profiles
  where id = auth.uid()
    and is_active = true
    and role = 'owner';

  if not found then
    raise exception 'Only an active owner can change staff roles'
      using errcode = '42501';
  end if;

  if normalized_role is null
    or normalized_role not in ('owner', 'manager', 'hygienist', 'staff') then
    raise exception 'Unsupported staff role: %', p_role
      using errcode = '22023';
  end if;

  select *
  into target_profile
  from public.profiles
  where id = p_profile_id
  for update;

  if not found or target_profile.clinic_id <> actor_profile.clinic_id then
    raise exception 'Profile not found'
      using errcode = 'P0002';
  end if;

  if target_profile.role = 'owner'
    and target_profile.is_active = true
    and normalized_role <> 'owner'
    and not exists (
      select 1
      from public.profiles p
      where p.clinic_id = target_profile.clinic_id
        and p.id <> target_profile.id
        and p.role = 'owner'
        and p.is_active = true
    ) then
    raise exception 'Cannot demote the last active owner'
      using errcode = '23514';
  end if;

  update public.profiles
  set role = normalized_role
  where id = p_profile_id
  returning *
  into changed_profile;

  insert into public.audit_logs (clinic_id, actor_id, action, target_type, target_id, metadata)
  values (
    actor_profile.clinic_id,
    actor_profile.id,
    'staff.role_changed',
    'profile',
    changed_profile.id::text,
    jsonb_build_object(
      'previous_role', target_profile.role,
      'role', changed_profile.role
    )
  );

  return changed_profile;
end;
$$;

create or replace function public.update_my_profile(p_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  changed_profile public.profiles%rowtype;
  normalized_name text := nullif(btrim(p_name), '');
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if normalized_name is null then
    raise exception 'Profile name is required'
      using errcode = '22023';
  end if;

  select *
  into actor_profile
  from public.profiles
  where id = auth.uid()
    and is_active = true
  for update;

  if not found then
    raise exception 'Active profile not found'
      using errcode = 'P0002';
  end if;

  update public.profiles
  set name = normalized_name
  where id = actor_profile.id
  returning *
  into changed_profile;

  insert into public.audit_logs (clinic_id, actor_id, action, target_type, target_id, metadata)
  values (
    actor_profile.clinic_id,
    actor_profile.id,
    'profile.updated',
    'profile',
    changed_profile.id::text,
    jsonb_build_object(
      'previous_name', actor_profile.name,
      'name', changed_profile.name
    )
  );

  return changed_profile;
end;
$$;

revoke execute on function public.is_clinic_member(uuid) from public, anon;
revoke execute on function public.can_manage_clinic(uuid) from public, anon;
revoke execute on function public.is_clinic_owner(uuid) from public, anon;
revoke execute on function public.prevent_last_active_owner_change() from public, anon;
revoke execute on function public.set_profile_active(uuid, boolean) from public, anon;
revoke execute on function public.set_profile_role(uuid, text) from public, anon;
revoke execute on function public.update_my_profile(text) from public, anon;

grant execute on function public.is_clinic_member(uuid) to authenticated;
grant execute on function public.can_manage_clinic(uuid) to authenticated;
grant execute on function public.is_clinic_owner(uuid) to authenticated;
grant execute on function public.set_profile_active(uuid, boolean) to authenticated;
grant execute on function public.set_profile_role(uuid, text) to authenticated;
grant execute on function public.update_my_profile(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Source: 20260520_surgeries_bridge_and_usage_rpc.sql
-- -----------------------------------------------------------------------------

-- DentalStock surgery bridge and usage-confirmation RPC
-- Keeps app-specific surgery fields while atomically decrementing stock on usage confirmation.

alter table public.surgeries
  add column if not exists legacy_id text,
  add column if not exists app_data jsonb not null default '{}'::jsonb,
  add column if not exists prepared_at timestamptz,
  add column if not exists usage_confirmed_at timestamptz;

create unique index if not exists surgeries_clinic_legacy_id_idx
on public.surgeries (clinic_id, legacy_id)
where legacy_id is not null;

with seed_surgeries (
  id,
  title,
  patient,
  type,
  scheduled_date,
  scheduled_time,
  note,
  required_items,
  created_by,
  prep_confirmed,
  prepared_by,
  prepared_at,
  usage_confirmed,
  usage_confirmed_by,
  usage_confirmed_at,
  actual_items
) as (
  values
    (
      's1',
      '오전 임플란트 수술',
      '홍길동',
      'implant',
      '2026-05-20',
      '10:30',
      '4.0mm 픽스처 확인',
      '[{"item_id":"2","qty":1},{"item_id":"7","qty":3},{"item_id":"8","qty":2},{"item_id":"9","qty":2},{"item_id":"11","qty":2},{"item_id":"27","qty":1},{"item_id":"29","qty":1},{"item_id":"30","qty":1}]'::jsonb,
      '김원장',
      false,
      null,
      null,
      false,
      null,
      null,
      '[]'::jsonb
    ),
    (
      's2',
      '오후 보철 세팅',
      '이지은',
      'prostho',
      '2026-05-21',
      '15:00',
      '인상재 및 임시 시멘트 확인',
      '[{"item_id":"2","qty":1},{"item_id":"7","qty":3},{"item_id":"8","qty":2},{"item_id":"9","qty":2},{"item_id":"11","qty":1},{"item_id":"22","qty":1},{"item_id":"24","qty":1},{"item_id":"25","qty":1}]'::jsonb,
      '이매니저',
      false,
      null,
      null,
      false,
      null,
      null,
      '[]'::jsonb
    ),
    (
      's3',
      '발치 예정',
      '김민수',
      'extraction',
      '2026-05-22',
      '11:00',
      '하악 대구치',
      '[{"item_id":"2","qty":1},{"item_id":"6","qty":3},{"item_id":"7","qty":3},{"item_id":"8","qty":2},{"item_id":"9","qty":2},{"item_id":"11","qty":2}]'::jsonb,
      '김원장',
      false,
      null,
      null,
      false,
      null,
      null,
      '[]'::jsonb
    )
)
insert into public.surgeries (
  clinic_id,
  legacy_id,
  patient_name,
  procedure_name,
  scheduled_at,
  status,
  expected_items,
  actual_items,
  notes,
  prepared_at,
  usage_confirmed_at,
  app_data
)
select
  '00000000-0000-0000-0000-000000000001',
  id,
  patient,
  title,
  (scheduled_date || 'T' || scheduled_time || ':00+09:00')::timestamptz,
  case
    when usage_confirmed then 'completed'
    when prep_confirmed then 'prepared'
    else 'planned'
  end,
  required_items,
  coalesce(actual_items, '[]'::jsonb),
  note,
  prepared_at::timestamptz,
  usage_confirmed_at::timestamptz,
  jsonb_strip_nulls(jsonb_build_object(
    'id', id,
    'title', title,
    'patient', patient,
    'type', type,
    'scheduled_date', scheduled_date,
    'scheduled_time', scheduled_time,
    'note', note,
    'required_items', required_items,
    'created_by', created_by,
    'prep_confirmed', prep_confirmed,
    'prepared_by', prepared_by,
    'prepared_at', prepared_at,
    'usage_confirmed', usage_confirmed,
    'usage_confirmed_by', usage_confirmed_by,
    'usage_confirmed_at', usage_confirmed_at,
    'actual_items', actual_items
  ))
from seed_surgeries
on conflict (clinic_id, legacy_id) where legacy_id is not null
do update set
  patient_name = excluded.patient_name,
  procedure_name = excluded.procedure_name,
  scheduled_at = excluded.scheduled_at,
  expected_items = excluded.expected_items,
  notes = excluded.notes,
  app_data = public.surgeries.app_data || excluded.app_data,
  updated_at = now();

create or replace function public.confirm_surgery_usage(
  p_surgery_id uuid,
  p_actual_items jsonb,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  surgery_row public.surgeries;
  usage_row jsonb;
  item_row public.items;
  item_legacy_id text;
  usage_qty numeric;
  actor_name text;
  usage_confirmed_at_value timestamptz := now();
  next_app_data jsonb;
  updated_items jsonb := '[]'::jsonb;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  select name
  into actor_name
  from public.profiles
  where id = current_user_id;

  if p_actual_items is null or jsonb_typeof(p_actual_items) <> 'array' then
    raise exception 'invalid_usage_items';
  end if;

  select *
  into surgery_row
  from public.surgeries
  where id = p_surgery_id
  for update;

  if surgery_row.id is null then
    raise exception 'surgery_not_found';
  end if;

  if not public.can_manage_clinic(surgery_row.clinic_id) then
    raise exception 'clinic_manage_denied';
  end if;

  if surgery_row.status = 'completed' or coalesce((surgery_row.app_data->>'usage_confirmed')::boolean, false) then
    raise exception 'surgery_usage_already_confirmed';
  end if;

  for usage_row in select * from jsonb_array_elements(p_actual_items)
  loop
    item_legacy_id := usage_row->>'item_id';
    usage_qty := coalesce(nullif(usage_row->>'qty', '')::numeric, 0);

    if item_legacy_id is null then
      raise exception 'usage_item_id_required';
    end if;

    if usage_qty < 0 then
      raise exception 'invalid_usage_quantity';
    end if;

    if usage_qty = 0 then
      continue;
    end if;

    select *
    into item_row
    from public.items
    where clinic_id = surgery_row.clinic_id
      and (
        id::text = item_legacy_id
        or legacy_id = item_legacy_id
      )
    for update;

    if item_row.id is null then
      raise exception 'usage_item_not_found';
    end if;

    if item_row.stock < usage_qty then
      raise exception 'insufficient_stock';
    end if;

    update public.items
    set stock = stock - usage_qty,
        updated_at = usage_confirmed_at_value
    where id = item_row.id
    returning * into item_row;

    insert into public.txs (
      clinic_id,
      item_id,
      type,
      quantity,
      reason,
      actor_id
    )
    values (
      surgery_row.clinic_id,
      item_row.id,
      'out',
      usage_qty,
      nullif(trim(coalesce('수술 실사용 확정 (' || surgery_row.procedure_name || ')' || case when p_note is null or trim(p_note) = '' then '' else ' · ' || p_note end, '')), ''),
      current_user_id
    );

    updated_items := updated_items || jsonb_build_array(to_jsonb(item_row));
  end loop;

  next_app_data := jsonb_set(
    coalesce(surgery_row.app_data, '{}'::jsonb),
    '{usage_confirmed}',
    'true'::jsonb,
    true
  );
  next_app_data := jsonb_set(next_app_data, '{usage_confirmed_at}', to_jsonb(usage_confirmed_at_value), true);
  next_app_data := jsonb_set(next_app_data, '{usage_confirmed_by}', to_jsonb(coalesce(actor_name, '사용자')), true);
  next_app_data := jsonb_set(next_app_data, '{actual_items}', p_actual_items, true);
  next_app_data := jsonb_set(next_app_data, '{usage_note}', to_jsonb(coalesce(p_note, '')), true);

  update public.surgeries
  set status = 'completed',
      actual_items = p_actual_items,
      confirmed_by = current_user_id,
      usage_confirmed_at = usage_confirmed_at_value,
      notes = coalesce(nullif(p_note, ''), notes),
      app_data = next_app_data,
      updated_at = usage_confirmed_at_value
  where id = surgery_row.id
  returning * into surgery_row;

  return jsonb_build_object(
    'surgery', to_jsonb(surgery_row),
    'items', updated_items
  );
end;
$$;

revoke all on function public.confirm_surgery_usage(uuid, jsonb, text) from public;
revoke all on function public.confirm_surgery_usage(uuid, jsonb, text) from anon;
grant execute on function public.confirm_surgery_usage(uuid, jsonb, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Source: 20260520_price_monitoring.sql
-- -----------------------------------------------------------------------------

-- DentalStock price monitoring foundation
-- Stores vendor product candidates and observed prices for later crawler/API automation.

create table if not exists public.vendor_products (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  vendor_id text not null,
  vendor_name text not null,
  product_url text not null,
  sku text,
  package_unit text,
  min_order_qty numeric not null default 1 check (min_order_qty > 0),
  is_active boolean not null default true,
  app_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.price_snapshots (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  vendor_product_id uuid not null references public.vendor_products(id) on delete cascade,
  price numeric not null check (price >= 0),
  shipping_fee numeric not null default 0 check (shipping_fee >= 0),
  in_stock boolean not null default true,
  observed_at timestamptz not null default now(),
  source text not null default 'manual',
  raw_data jsonb not null default '{}'::jsonb
);

create index if not exists vendor_products_clinic_item_idx
on public.vendor_products (clinic_id, item_id, is_active);

create index if not exists vendor_products_clinic_vendor_idx
on public.vendor_products (clinic_id, vendor_id, is_active);

create index if not exists price_snapshots_product_observed_idx
on public.price_snapshots (vendor_product_id, observed_at desc);

drop trigger if exists vendor_products_touch_updated_at on public.vendor_products;
create trigger vendor_products_touch_updated_at before update on public.vendor_products
for each row execute function public.touch_updated_at();

alter table public.vendor_products enable row level security;
alter table public.price_snapshots enable row level security;

drop policy if exists "members can read vendor products" on public.vendor_products;
create policy "members can read vendor products"
on public.vendor_products for select
using (public.is_clinic_member(clinic_id));

drop policy if exists "managers can create vendor products" on public.vendor_products;
create policy "managers can create vendor products"
on public.vendor_products for insert
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "managers can update vendor products" on public.vendor_products;
create policy "managers can update vendor products"
on public.vendor_products for update
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "members can read price snapshots" on public.price_snapshots;
create policy "members can read price snapshots"
on public.price_snapshots for select
using (public.is_clinic_member(clinic_id));

drop policy if exists "managers can create price snapshots" on public.price_snapshots;
create policy "managers can create price snapshots"
on public.price_snapshots for insert
with check (public.can_manage_clinic(clinic_id));

drop policy if exists "managers can update price snapshots" on public.price_snapshots;
create policy "managers can update price snapshots"
on public.price_snapshots for update
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));
