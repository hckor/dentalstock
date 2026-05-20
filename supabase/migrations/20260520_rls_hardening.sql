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
