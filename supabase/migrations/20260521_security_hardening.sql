-- DentalStock security hardening
-- Moves sensitive writes behind server-side checks and prevents UI state spoofing
-- from client-controlled app_data fields.

create or replace function public.strip_order_app_data_fields(value jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(value, '{}'::jsonb)
    - 'status'
    - 'requested_by_id'
    - 'approved_by_id'
    - 'shipment_group_id'
    - 'tracking_number'
    - 'reviewed_at'
    - 'received_at'
$$;

create or replace function public.orders_strip_app_data_trigger()
returns trigger
language plpgsql
as $$
begin
  new.app_data := public.strip_order_app_data_fields(new.app_data);
  return new;
end;
$$;

drop trigger if exists orders_strip_app_data on public.orders;
create trigger orders_strip_app_data
before insert or update of app_data on public.orders
for each row execute function public.orders_strip_app_data_trigger();

update public.orders
set app_data = public.strip_order_app_data_fields(app_data)
where app_data ?| array[
  'status',
  'requested_by_id',
  'approved_by_id',
  'shipment_group_id',
  'tracking_number',
  'reviewed_at',
  'received_at'
];

drop policy if exists "members can create audit logs" on public.audit_logs;
revoke insert, update, delete on public.audit_logs from authenticated;

create or replace function public.record_audit_log(
  p_action text,
  p_target_type text,
  p_target_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.audit_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  inserted_log public.audit_logs%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select *
  into actor_profile
  from public.profiles
  where id = auth.uid()
    and is_active = true;

  if actor_profile.id is null then
    raise exception 'active_profile_required';
  end if;

  insert into public.audit_logs (
    clinic_id,
    actor_id,
    action,
    target_type,
    target_id,
    metadata
  )
  values (
    actor_profile.clinic_id,
    actor_profile.id,
    left(coalesce(nullif(trim(p_action), ''), 'unknown'), 120),
    left(coalesce(nullif(trim(p_target_type), ''), 'unknown'), 80),
    nullif(left(coalesce(p_target_id, ''), 120), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into inserted_log;

  return inserted_log;
end;
$$;

grant execute on function public.record_audit_log(text, text, text, jsonb) to authenticated;

drop policy if exists "members can create notifications" on public.notifs;
drop policy if exists "members can update clinic notifications" on public.notifs;
drop policy if exists "members can update their notifications" on public.notifs;
drop policy if exists "members can update notification read state" on public.notifs;
revoke insert, update, delete on public.notifs from authenticated;
grant update(read_at) on public.notifs to authenticated;

create policy "members can update notification read state"
on public.notifs for update
using (
  public.is_clinic_member(clinic_id)
  and (user_id is null or user_id = auth.uid())
)
with check (
  public.is_clinic_member(clinic_id)
  and (user_id is null or user_id = auth.uid())
);

create or replace function public.set_notification_read_state(
  p_notification_id uuid,
  p_is_read boolean
)
returns public.notifs
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_row public.notifs%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select *
  into notification_row
  from public.notifs
  where id = p_notification_id
    and public.is_clinic_member(clinic_id)
    and (user_id is null or user_id = auth.uid())
  for update;

  if notification_row.id is null then
    raise exception 'notification_not_found';
  end if;

  update public.notifs
  set read_at = case when p_is_read then coalesce(read_at, now()) else null end
  where id = p_notification_id
  returning * into notification_row;

  return notification_row;
end;
$$;

grant execute on function public.set_notification_read_state(uuid, boolean) to authenticated;

drop policy if exists "managers can create settings" on public.settings;
drop policy if exists "managers can update settings" on public.settings;
drop policy if exists "managers can manage settings" on public.settings;
revoke insert, update, delete on public.settings from authenticated;

create or replace function public.sanitize_vendor_settings(p_vendors jsonb)
returns jsonb
language sql
immutable
as $$
  select case
    when jsonb_typeof(coalesce(p_vendors, '[]'::jsonb)) <> 'array' then '[]'::jsonb
    else coalesce((
      select jsonb_agg(
        case
          when jsonb_typeof(vendor) = 'object'
          then vendor - 'username' - 'password' - 'connected' - 'token' - 'secret'
          else vendor
        end
      )
      from jsonb_array_elements(p_vendors) as vendor
    ), '[]'::jsonb)
  end
$$;

create or replace function public.save_clinic_settings(
  p_vendors jsonb default '[]'::jsonb,
  p_reorder_rules jsonb default '{}'::jsonb,
  p_app_config jsonb default '{}'::jsonb
)
returns public.settings
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  saved_settings public.settings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select *
  into actor_profile
  from public.profiles
  where id = auth.uid()
    and is_active = true;

  if actor_profile.id is null or actor_profile.role not in ('owner', 'manager') then
    raise exception 'manager_required';
  end if;

  insert into public.settings (
    clinic_id,
    vendors,
    reorder_rules,
    app_config
  )
  values (
    actor_profile.clinic_id,
    public.sanitize_vendor_settings(p_vendors),
    coalesce(p_reorder_rules, '{}'::jsonb),
    coalesce(p_app_config, '{}'::jsonb)
  )
  on conflict (clinic_id)
  do update set
    vendors = excluded.vendors,
    reorder_rules = excluded.reorder_rules,
    app_config = excluded.app_config,
    updated_at = now()
  returning * into saved_settings;

  return saved_settings;
end;
$$;

grant execute on function public.save_clinic_settings(jsonb, jsonb, jsonb) to authenticated;
