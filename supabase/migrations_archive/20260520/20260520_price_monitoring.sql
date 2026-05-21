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
