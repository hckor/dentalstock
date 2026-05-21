-- DentalStock dental material catalog
-- Stores crawled vendor product data separately from clinic inventory.

create table if not exists public.dental_materials (
  id bigserial primary key,
  source text not null,
  source_product_id text not null,
  product_code text,
  name text not null,
  spec text,
  category text,
  package_unit text,
  manufacturer text,
  origin text,
  list_price_krw integer,
  sale_price_krw integer,
  category_url text,
  detail_url text,
  image_url text,
  scraped_at timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_product_id)
);

create index if not exists dental_materials_source_category_idx
on public.dental_materials (source, category);

create index if not exists dental_materials_name_idx
on public.dental_materials using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(product_code, '') || ' ' || coalesce(manufacturer, '')));

drop trigger if exists dental_materials_touch_updated_at on public.dental_materials;
create trigger dental_materials_touch_updated_at
before update on public.dental_materials
for each row execute function public.touch_updated_at();

alter table public.dental_materials enable row level security;

drop policy if exists "members can read dental materials" on public.dental_materials;
create policy "members can read dental materials"
on public.dental_materials for select
using (auth.role() = 'authenticated');

revoke insert, update, delete on public.dental_materials from authenticated;
