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
