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
