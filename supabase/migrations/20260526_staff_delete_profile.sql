create or replace function public.delete_staff_profile(p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
begin
  -- This removes only the clinic profile row. Supabase Auth users must be deleted separately by a service-role backend if needed.
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
    raise exception 'Only an active owner can delete staff profiles'
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

  if p_profile_id = auth.uid() then
    raise exception 'Owners cannot delete their own profile'
      using errcode = '42501';
  end if;

  if target_profile.role = 'owner'
    and target_profile.is_active = true
    and not exists (
      select 1
      from public.profiles p
      where p.clinic_id = target_profile.clinic_id
        and p.id <> target_profile.id
        and p.role = 'owner'
        and p.is_active = true
    ) then
    raise exception 'Cannot delete the last active owner'
      using errcode = '23514';
  end if;

  insert into public.audit_logs (clinic_id, actor_id, action, target_type, target_id, metadata)
  values (
    actor_profile.clinic_id,
    actor_profile.id,
    'staff.deleted',
    'profile',
    target_profile.id::text,
    jsonb_build_object(
      'name', target_profile.name,
      'email', target_profile.email,
      'role', target_profile.role,
      'is_active', target_profile.is_active,
      'auth_user_deleted', false
    )
  );

  delete from public.profiles
  where id = target_profile.id;

  return target_profile.id;
end;
$$;

revoke execute on function public.delete_staff_profile(uuid) from public, anon;
grant execute on function public.delete_staff_profile(uuid) to authenticated;
