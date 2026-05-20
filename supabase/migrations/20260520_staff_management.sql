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
