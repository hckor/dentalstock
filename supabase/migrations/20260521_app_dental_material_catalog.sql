-- App-ready material catalog table for initial inventory and ordering recommendations.

create table if not exists public.dental_material_catalog (
  catalog_id text primary key,
  name text not null,
  display_name text not null,
  category text not null,
  category_id integer not null,
  source_category text,
  unit text not null,
  spec text,
  manufacturer text,
  min_order_qty integer not null default 1,
  expiry_managed boolean not null default false,
  search_keywords text[] not null default array[]::text[],
  vendor_options jsonb not null default '[]'::jsonb,
  source_product_ids jsonb not null default '[]'::jsonb,
  raw_names jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dental_material_catalog_category_idx
on public.dental_material_catalog (category_id, category);

create index if not exists dental_material_catalog_keywords_idx
on public.dental_material_catalog using gin (search_keywords);

create index if not exists dental_material_catalog_vendor_options_idx
on public.dental_material_catalog using gin (vendor_options);

drop trigger if exists dental_material_catalog_touch_updated_at on public.dental_material_catalog;
create trigger dental_material_catalog_touch_updated_at
before update on public.dental_material_catalog
for each row execute function public.touch_updated_at();

alter table public.dental_material_catalog enable row level security;

drop policy if exists "members can read dental material catalog" on public.dental_material_catalog;
create policy "members can read dental material catalog"
on public.dental_material_catalog for select
using (auth.role() = 'authenticated');

revoke insert, update, delete on public.dental_material_catalog from authenticated;
