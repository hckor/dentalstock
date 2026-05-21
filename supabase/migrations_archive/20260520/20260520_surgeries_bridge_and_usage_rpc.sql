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
