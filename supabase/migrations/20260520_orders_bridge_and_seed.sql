-- DentalStock orders bridge + demo seed
-- Run after stock/item migrations.

alter table public.orders
  add column if not exists legacy_id text;

alter table public.orders
  add column if not exists app_data jsonb not null default '{}'::jsonb;

create unique index if not exists orders_clinic_id_legacy_id_idx
on public.orders(clinic_id, legacy_id)
where legacy_id is not null;

with seed_orders as (
  select *
  from jsonb_to_recordset($$[
    {"id":"o1","item_id":"12","requested_by":"박위생사","requested_at":"2026-05-19T08:10:00","qty":10,"note":"에피네프린 재고 부족","status":"pending","reviewed_by":null,"reviewed_at":null,"review_note":"","vendor_id":"2","vendor_name":"오스템몰","vendor_price":34200,"vendor_selection":"lowest"},
    {"id":"o2","item_id":"18","requested_by":"최위생사","requested_at":"2026-05-18T16:30:00","qty":5,"note":"레진 A3 시급","status":"ordered","vendor_id":"2","vendor_name":"오스템몰","vendor_price":15800,"vendor_selection":"lowest","reviewed_by":"이매니저","reviewed_at":"2026-05-18T17:00:00","review_note":"승인합니다","carrier":"CJ대한통운","tracking_number":"9876543210","shipping_events":[{"status":"배송중","timestamp":"2026-05-19T09:20:00","location":"서울 집배센터","completed":true},{"status":"주문접수","timestamp":"2026-05-18T17:00:00","location":"도매 사이트","completed":true}]},
    {"id":"o3","item_id":"6","requested_by":"정위생사","requested_at":"2026-05-12T10:00:00","qty":10,"note":"거즈 부족","status":"received","vendor_id":"1","vendor_name":"덴올","vendor_price":7800,"vendor_selection":"lowest","reviewed_by":"이매니저","reviewed_at":"2026-05-12T11:00:00","review_note":"","carrier":"롯데택배","tracking_number":"5522331144","shipping_events":[{"status":"입고완료","timestamp":"2026-05-14T10:30:00","location":"치과 재고실","completed":true},{"status":"배송중","timestamp":"2026-05-13T15:10:00","location":"서울 물류센터","completed":true},{"status":"주문접수","timestamp":"2026-05-12T11:00:00","location":"도매 사이트","completed":true}]},
    {"id":"o4","item_id":"5","requested_by":"박위생사","requested_at":"2026-05-10T09:00:00","qty":5,"note":"덴탈 마스크 부족","status":"rejected","reviewed_by":"이매니저","reviewed_at":"2026-05-10T14:00:00","review_note":"이번달 예산 초과","vendor_id":"2","vendor_name":"오스템몰","vendor_price":10400,"vendor_selection":"lowest"}
  ]$$::jsonb) as order_row(
    id text,
    item_id text,
    requested_by text,
    requested_at timestamptz,
    qty numeric,
    note text,
    status text,
    reviewed_by text,
    reviewed_at timestamptz,
    review_note text,
    vendor_id text,
    vendor_name text,
    vendor_price numeric,
    vendor_selection text,
    carrier text,
    tracking_number text,
    shipping_events jsonb
  )
)
insert into public.orders (
  clinic_id,
  legacy_id,
  vendor,
  status,
  shipment_group_id,
  tracking_number,
  requested_at,
  approved_at,
  received_at,
  items,
  totals,
  notes,
  app_data
)
select
  '00000000-0000-0000-0000-000000000001',
  id,
  coalesce(vendor_name, '거래처 미정'),
  status,
  null,
  tracking_number,
  requested_at,
  case when status in ('ordered', 'received') then reviewed_at else null end,
  case when status = 'received' then coalesce((shipping_events->0->>'timestamp')::timestamptz, reviewed_at) else null end,
  jsonb_build_array(jsonb_build_object('item_id', item_id, 'qty', qty)),
  jsonb_strip_nulls(jsonb_build_object('vendor_price', vendor_price)),
  note,
  jsonb_strip_nulls(jsonb_build_object(
    'id', id,
    'item_id', item_id,
    'requested_by', requested_by,
    'requested_at', requested_at,
    'qty', qty,
    'note', note,
    'status', status,
    'reviewed_by', reviewed_by,
    'reviewed_at', reviewed_at,
    'review_note', review_note,
    'vendor_id', vendor_id,
    'vendor_name', vendor_name,
    'vendor_price', vendor_price,
    'vendor_selection', vendor_selection,
    'carrier', carrier,
    'tracking_number', tracking_number,
    'shipping_events', shipping_events
  ))
from seed_orders
on conflict (clinic_id, legacy_id) where legacy_id is not null
do update set
  vendor = excluded.vendor,
  status = excluded.status,
  tracking_number = excluded.tracking_number,
  requested_at = excluded.requested_at,
  approved_at = excluded.approved_at,
  received_at = excluded.received_at,
  items = excluded.items,
  totals = excluded.totals,
  notes = excluded.notes,
  app_data = excluded.app_data,
  updated_at = now();
