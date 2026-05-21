-- DentalStock items bridge + demo seed
-- Run after 20260520_initial_dentalstock_schema.sql and 20260520_rls_hardening.sql.

alter table public.items
  add column if not exists legacy_id text;

alter table public.items
  add column if not exists app_data jsonb not null default '{}'::jsonb;

create unique index if not exists items_clinic_id_legacy_id_idx
on public.items(clinic_id, legacy_id)
where legacy_id is not null;

with seed_items as (
  select *
  from jsonb_to_recordset($$[
    {"id":"1","name":"라텍스 장갑 (S)","category_id":1,"unit":"박스","current_qty":8,"min_qty":5,"location":"창고 A-1","expiry":null},
    {"id":"2","name":"라텍스 장갑 (M)","category_id":1,"unit":"박스","current_qty":4,"min_qty":5,"location":"창고 A-1","expiry":null,"vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":5200},{"vendor_id":2,"vendor_name":"오스템몰","price":5000}]},
    {"id":"3","name":"니트릴 장갑 (L)","category_id":1,"unit":"박스","current_qty":12,"min_qty":5,"location":"창고 A-2","expiry":null},
    {"id":"4","name":"마스크 KF94","category_id":1,"unit":"박스","current_qty":15,"min_qty":10,"location":"창고 A-3","expiry":"2028-01-01"},
    {"id":"5","name":"덴탈 마스크","category_id":1,"unit":"박스","current_qty":9,"min_qty":10,"location":"창고 A-3","expiry":"2027-10-15","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":11000},{"vendor_id":2,"vendor_name":"오스템몰","price":10400}]},
    {"id":"6","name":"거즈 4x4","category_id":1,"unit":"팩","current_qty":7,"min_qty":10,"location":"창고 B-1","expiry":"2026-11-20","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":7800},{"vendor_id":2,"vendor_name":"오스템몰","price":8200}]},
    {"id":"7","name":"코튼롤","category_id":1,"unit":"봉","current_qty":18,"min_qty":8,"location":"창고 B-2","expiry":null},
    {"id":"8","name":"알코올 스왑","category_id":1,"unit":"박스","current_qty":14,"min_qty":10,"location":"창고 B-3","expiry":"2027-04-01"},
    {"id":"9","name":"석션 팁","category_id":1,"unit":"봉","current_qty":5,"min_qty":6,"location":"창고 C-1","expiry":null,"vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":4500},{"vendor_id":2,"vendor_name":"오스템몰","price":4300}]},
    {"id":"10","name":"3-way syringe tip","category_id":1,"unit":"봉","current_qty":11,"min_qty":5,"location":"창고 C-1","expiry":null},
    {"id":"11","name":"리도카인 2%","category_id":2,"unit":"앰플","current_qty":22,"min_qty":10,"location":"약품실 D-1","expiry":"2026-08-12"},
    {"id":"12","name":"에피네프린","category_id":2,"unit":"앰플","current_qty":3,"min_qty":5,"location":"응급키트","expiry":"2026-05-30","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":36000},{"vendor_id":2,"vendor_name":"오스템몰","price":34200}]},
    {"id":"13","name":"아목시실린","category_id":2,"unit":"통","current_qty":7,"min_qty":3,"location":"약품실 D-2","expiry":"2027-03-01"},
    {"id":"14","name":"이부프로펜","category_id":2,"unit":"통","current_qty":10,"min_qty":5,"location":"약품실 D-2","expiry":"2027-09-15"},
    {"id":"15","name":"클로르헥시딘 가글","category_id":2,"unit":"병","current_qty":6,"min_qty":4,"location":"약품실 D-3","expiry":"2026-12-20"},
    {"id":"16","name":"레진 A1","category_id":3,"unit":"개","current_qty":5,"min_qty":5,"location":"재료실 E-1","expiry":"2026-10-01"},
    {"id":"17","name":"레진 A2","category_id":3,"unit":"개","current_qty":7,"min_qty":5,"location":"재료실 E-1","expiry":"2026-09-10"},
    {"id":"18","name":"레진 A3","category_id":3,"unit":"개","current_qty":2,"min_qty":5,"location":"재료실 E-1","expiry":"2026-09-10","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":17000},{"vendor_id":2,"vendor_name":"오스템몰","price":15800}]},
    {"id":"19","name":"본딩제","category_id":3,"unit":"병","current_qty":4,"min_qty":3,"location":"재료실 E-2","expiry":"2026-07-15"},
    {"id":"20","name":"에칭젤","category_id":3,"unit":"개","current_qty":8,"min_qty":4,"location":"재료실 E-2","expiry":"2027-01-11"},
    {"id":"21","name":"GI Cement","category_id":3,"unit":"세트","current_qty":3,"min_qty":2,"location":"재료실 E-3","expiry":"2026-06-22"},
    {"id":"22","name":"Temp Cement","category_id":3,"unit":"세트","current_qty":5,"min_qty":3,"location":"재료실 E-3","expiry":"2027-03-12"},
    {"id":"23","name":"알지네이트","category_id":3,"unit":"봉","current_qty":6,"min_qty":4,"location":"인상재실 F-1","expiry":"2026-08-01"},
    {"id":"24","name":"실리콘 인상재 Heavy","category_id":3,"unit":"통","current_qty":4,"min_qty":3,"location":"인상재실 F-1","expiry":"2026-11-10"},
    {"id":"25","name":"실리콘 인상재 Light","category_id":3,"unit":"통","current_qty":2,"min_qty":3,"location":"인상재실 F-2","expiry":"2026-10-18","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":23500},{"vendor_id":2,"vendor_name":"오스템몰","price":22900}]},
    {"id":"26","name":"Bite Registration","category_id":3,"unit":"개","current_qty":7,"min_qty":3,"location":"인상재실 F-2","expiry":"2027-02-01"},
    {"id":"27","name":"임플란트 픽스처 4.0mm","category_id":3,"unit":"개","current_qty":12,"min_qty":10,"location":"임플란트실 G-1","expiry":null},
    {"id":"28","name":"임플란트 픽스처 4.5mm","category_id":3,"unit":"개","current_qty":9,"min_qty":10,"location":"임플란트실 G-1","expiry":null,"vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":82000},{"vendor_id":2,"vendor_name":"오스템몰","price":79500}]},
    {"id":"29","name":"Healing Abutment","category_id":3,"unit":"개","current_qty":15,"min_qty":8,"location":"임플란트실 G-2","expiry":null},
    {"id":"30","name":"Cover Screw","category_id":3,"unit":"개","current_qty":20,"min_qty":10,"location":"임플란트실 G-2","expiry":null},
    {"id":"31","name":"Bone Graft","category_id":3,"unit":"병","current_qty":4,"min_qty":5,"location":"냉장 H-1","expiry":"2026-09-25","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":69000},{"vendor_id":2,"vendor_name":"오스템몰","price":71000}]},
    {"id":"32","name":"Collagen Membrane","category_id":3,"unit":"개","current_qty":6,"min_qty":4,"location":"냉장 H-1","expiry":"2026-12-12"},
    {"id":"33","name":"교정 브라켓 MBT","category_id":3,"unit":"세트","current_qty":5,"min_qty":3,"location":"교정실 I-1","expiry":null},
    {"id":"34","name":"NiTi Wire 0.014","category_id":3,"unit":"개","current_qty":18,"min_qty":10,"location":"교정실 I-2","expiry":null},
    {"id":"35","name":"Power Chain","category_id":3,"unit":"롤","current_qty":9,"min_qty":5,"location":"교정실 I-2","expiry":null},
    {"id":"36","name":"구강 카메라","category_id":4,"unit":"대","current_qty":2,"min_qty":1,"location":"진료실 1","expiry":null},
    {"id":"37","name":"광중합기","category_id":4,"unit":"대","current_qty":4,"min_qty":2,"location":"장비실 J-1","expiry":null},
    {"id":"38","name":"초음파 스케일러 팁","category_id":4,"unit":"개","current_qty":8,"min_qty":3,"location":"장비실 J-2","expiry":null},
    {"id":"39","name":"멸균 파우치","category_id":1,"unit":"박스","current_qty":11,"min_qty":5,"location":"멸균실 K-1","expiry":"2028-03-01"},
    {"id":"40","name":"멸균 인디케이터","category_id":1,"unit":"팩","current_qty":3,"min_qty":4,"location":"멸균실 K-1","expiry":"2026-07-07","vendor_options":[{"vendor_id":1,"vendor_name":"덴올","price":9800},{"vendor_id":2,"vendor_name":"오스템몰","price":9400}]}
  ]$$::jsonb) as item(
    id text,
    name text,
    category_id integer,
    unit text,
    current_qty numeric,
    min_qty numeric,
    location text,
    expiry text,
    vendor_options jsonb
  )
)
insert into public.items (
  clinic_id,
  legacy_id,
  name,
  category,
  unit,
  stock,
  min_stock,
  desired_stock,
  vendor,
  memo,
  app_data
)
select
  '00000000-0000-0000-0000-000000000001',
  id,
  name,
  category_id::text,
  unit,
  current_qty,
  min_qty,
  min_qty,
  null,
  location,
  jsonb_strip_nulls(jsonb_build_object(
    'id', id,
    'category_id', category_id,
    'location', location,
    'expiry', expiry,
    'vendor_options', vendor_options
  ))
from seed_items
on conflict (clinic_id, legacy_id) where legacy_id is not null
do update set
  name = excluded.name,
  category = excluded.category,
  unit = excluded.unit,
  stock = excluded.stock,
  min_stock = excluded.min_stock,
  desired_stock = excluded.desired_stock,
  memo = excluded.memo,
  app_data = excluded.app_data,
  updated_at = now();
