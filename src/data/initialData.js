import { SURGERY_PRESETS } from "../constants/surgeryPresets";

export const INITIAL_USERS = [
  { id:"u1", name:"김원장",   role:"owner",     pin:"1234", active:true },
  { id:"u2", name:"이매니저", role:"manager",   pin:"1111", active:true },
  { id:"u3", name:"박위생사", role:"hygienist", pin:"0000", active:true },
  { id:"u4", name:"최위생사", role:"hygienist", pin:"0000", active:true },
  { id:"u5", name:"정위생사", role:"hygienist", pin:"0000", active:true },
];

export const INIT_ITEMS = [
  { id:"1", name:"라텍스 장갑 (M)",      category_id:1, unit:"박스", current_qty:3,  min_qty:5,  location:"창고 A-1",   expiry:null },
  { id:"2", name:"리도카인 앰플",         category_id:2, unit:"박스", current_qty:2,  min_qty:3,  location:"약품 캐비닛", expiry:"2026-07-15" },
  { id:"3", name:"임플란트 픽스처 3.5mm", category_id:3, unit:"개",   current_qty:8,  min_qty:3,  location:"창고 B-2",   expiry:null },
  { id:"4", name:"알코올 솜",             category_id:1, unit:"팩",   current_qty:12, min_qty:5,  location:"처치실",     expiry:"2026-06-01" },
  { id:"5", name:"거즈 (4x4)",            category_id:1, unit:"박스", current_qty:6,  min_qty:4,  location:"창고 A-2",   expiry:null },
  { id:"6", name:"지르코니아 블록 A2",    category_id:3, unit:"개",   current_qty:1,  min_qty:2,  location:"기공실",     expiry:null },
  { id:"7", name:"마취 바늘 (27G)",       category_id:2, unit:"박스", current_qty:4,  min_qty:2,  location:"약품 캐비닛", expiry:"2027-03-20" },
  { id:"8", name:"치실 (민트)",           category_id:1, unit:"개",   current_qty:15, min_qty:10, location:"접수대",     expiry:null },
];

// 3개월치 거래 데이터 (2월~5월) — 소비 분석용
export const INIT_TXS = [
  // ─── 5월 (이번달) ─────────────────────────────
  { id:"t1",  item_id:"1", type:"out", qty:2,  note:"진료실 보충",        created_at:"2026-05-16T09:30:00", user:"이매니저" },
  { id:"t2",  item_id:"3", type:"in",  qty:5,  note:"GS바이오텍 발주",    created_at:"2026-05-15T14:00:00", user:"이매니저" },
  { id:"t3",  item_id:"2", type:"out", qty:1,  note:"치료 사용",          created_at:"2026-05-15T11:15:00", user:"박위생사" },
  { id:"t4",  item_id:"6", type:"out", qty:2,  note:"보철 제작",          created_at:"2026-05-14T15:30:00", user:"이매니저" },
  { id:"t5",  item_id:"4", type:"in",  qty:10, note:"정기 발주",          created_at:"2026-05-13T10:00:00", user:"이매니저" },
  { id:"t6",  item_id:"1", type:"out", qty:3,  note:"진료실 보충",        created_at:"2026-05-12T09:00:00", user:"박위생사" },
  { id:"t7",  item_id:"5", type:"out", qty:2,  note:"처치 사용",          created_at:"2026-05-11T14:00:00", user:"최위생사" },
  { id:"t8",  item_id:"8", type:"out", qty:3,  note:"환자 배포",          created_at:"2026-05-10T10:30:00", user:"정위생사" },
  { id:"t9",  item_id:"7", type:"out", qty:1,  note:"마취 시술",          created_at:"2026-05-09T15:00:00", user:"박위생사" },
  { id:"t10", item_id:"4", type:"out", qty:2,  note:"처치 사용",          created_at:"2026-05-08T11:00:00", user:"최위생사" },
  { id:"t11", item_id:"2", type:"out", qty:1,  note:"임플란트 마취",      created_at:"2026-05-07T09:30:00", user:"이매니저" },
  { id:"t12", item_id:"1", type:"in",  qty:10, note:"5월 정기 발주",      created_at:"2026-05-06T14:00:00", user:"이매니저" },
  { id:"t13", item_id:"3", type:"out", qty:1,  note:"임플란트 시술",      created_at:"2026-05-05T10:00:00", user:"이매니저" },
  { id:"t14", item_id:"5", type:"out", qty:2,  note:"드레싱 처치",        created_at:"2026-05-04T15:30:00", user:"박위생사" },
  { id:"t15", item_id:"8", type:"in",  qty:20, note:"5월 발주",           created_at:"2026-05-03T09:00:00", user:"이매니저" },
  // ─── 4월 ──────────────────────────────────────
  { id:"t16", item_id:"1", type:"out", qty:3,  note:"진료실 보충",        created_at:"2026-04-28T09:00:00", user:"박위생사" },
  { id:"t17", item_id:"4", type:"out", qty:3,  note:"처치 사용",          created_at:"2026-04-25T14:00:00", user:"최위생사" },
  { id:"t18", item_id:"7", type:"out", qty:2,  note:"마취 시술",          created_at:"2026-04-22T10:00:00", user:"이매니저" },
  { id:"t19", item_id:"2", type:"in",  qty:5,  note:"4월 발주",           created_at:"2026-04-20T09:00:00", user:"이매니저" },
  { id:"t20", item_id:"5", type:"out", qty:3,  note:"드레싱",             created_at:"2026-04-18T14:30:00", user:"정위생사" },
  { id:"t21", item_id:"8", type:"out", qty:5,  note:"환자 배포",          created_at:"2026-04-15T10:00:00", user:"박위생사" },
  { id:"t22", item_id:"1", type:"out", qty:2,  note:"진료실 보충",        created_at:"2026-04-13T09:30:00", user:"최위생사" },
  { id:"t23", item_id:"6", type:"out", qty:1,  note:"보철",               created_at:"2026-04-11T15:00:00", user:"이매니저" },
  { id:"t24", item_id:"3", type:"out", qty:2,  note:"임플란트",           created_at:"2026-04-09T10:00:00", user:"이매니저" },
  { id:"t25", item_id:"1", type:"in",  qty:10, note:"4월 정기 발주",      created_at:"2026-04-07T09:00:00", user:"이매니저" },
  { id:"t26", item_id:"4", type:"out", qty:2,  note:"처치 사용",          created_at:"2026-04-05T14:00:00", user:"박위생사" },
  { id:"t27", item_id:"2", type:"out", qty:2,  note:"임플란트 마취 2건",  created_at:"2026-04-03T10:30:00", user:"이매니저" },
  { id:"t28", item_id:"7", type:"in",  qty:5,  note:"4월 발주",           created_at:"2026-04-02T09:00:00", user:"이매니저" },
  { id:"t29", item_id:"5", type:"out", qty:2,  note:"드레싱",             created_at:"2026-04-01T15:00:00", user:"정위생사" },
  // ─── 3월 ──────────────────────────────────────
  { id:"t30", item_id:"1", type:"out", qty:4,  note:"진료실 보충",        created_at:"2026-03-27T09:00:00", user:"박위생사" },
  { id:"t31", item_id:"8", type:"out", qty:6,  note:"환자 배포",          created_at:"2026-03-24T14:00:00", user:"정위생사" },
  { id:"t32", item_id:"4", type:"in",  qty:10, note:"3월 발주",           created_at:"2026-03-22T09:00:00", user:"이매니저" },
  { id:"t33", item_id:"2", type:"out", qty:2,  note:"마취 시술",          created_at:"2026-03-20T10:00:00", user:"이매니저" },
  { id:"t34", item_id:"5", type:"out", qty:3,  note:"드레싱 처치",        created_at:"2026-03-18T15:00:00", user:"최위생사" },
  { id:"t35", item_id:"7", type:"out", qty:1,  note:"마취 시술",          created_at:"2026-03-15T10:30:00", user:"박위생사" },
  { id:"t36", item_id:"1", type:"out", qty:2,  note:"진료실 보충",        created_at:"2026-03-13T09:00:00", user:"최위생사" },
  { id:"t37", item_id:"3", type:"out", qty:2,  note:"임플란트",           created_at:"2026-03-11T14:00:00", user:"이매니저" },
  { id:"t38", item_id:"6", type:"in",  qty:5,  note:"3월 발주",           created_at:"2026-03-09T09:00:00", user:"이매니저" },
  { id:"t39", item_id:"1", type:"in",  qty:10, note:"3월 정기 발주",      created_at:"2026-03-07T09:00:00", user:"이매니저" },
  { id:"t40", item_id:"4", type:"out", qty:4,  note:"처치 사용",          created_at:"2026-03-05T14:00:00", user:"박위생사" },
  { id:"t41", item_id:"8", type:"out", qty:4,  note:"환자 배포",          created_at:"2026-03-03T10:00:00", user:"정위생사" },
  { id:"t42", item_id:"2", type:"in",  qty:5,  note:"3월 발주",           created_at:"2026-03-01T09:00:00", user:"이매니저" },
  // ─── 2월 ──────────────────────────────────────
  { id:"t43", item_id:"1", type:"out", qty:3,  note:"진료실 보충",        created_at:"2026-02-25T09:00:00", user:"박위생사" },
  { id:"t44", item_id:"5", type:"out", qty:2,  note:"드레싱",             created_at:"2026-02-22T14:00:00", user:"최위생사" },
  { id:"t45", item_id:"8", type:"out", qty:4,  note:"환자 배포",          created_at:"2026-02-20T10:00:00", user:"정위생사" },
  { id:"t46", item_id:"7", type:"out", qty:2,  note:"마취 시술",          created_at:"2026-02-18T15:00:00", user:"이매니저" },
  { id:"t47", item_id:"4", type:"out", qty:3,  note:"처치 사용",          created_at:"2026-02-15T09:30:00", user:"박위생사" },
  { id:"t48", item_id:"1", type:"in",  qty:10, note:"2월 발주",           created_at:"2026-02-10T09:00:00", user:"이매니저" },
  { id:"t49", item_id:"2", type:"out", qty:2,  note:"임플란트 마취",      created_at:"2026-02-08T14:00:00", user:"이매니저" },
  { id:"t50", item_id:"3", type:"out", qty:1,  note:"임플란트",           created_at:"2026-02-05T10:00:00", user:"이매니저" },
];

// 데모용 — ordered 상태 1건 포함 (입고 대기 시뮬레이션)
export const INIT_ORDERS = [
  { id:"o1", item_id:"1", requested_by:"박위생사", requested_at:"2026-05-16T08:10:00", qty:10, note:"재고 급하게 필요합니다", status:"pending",  reviewed_by:null,     reviewed_at:null,                    review_note:"" },
  { id:"o2", item_id:"6", requested_by:"최위생사", requested_at:"2026-05-15T16:30:00", qty:5,  note:"보철 작업용",          status:"ordered",  reviewed_by:"이매니저", reviewed_at:"2026-05-15T17:00:00",  review_note:"승인합니다" },
  { id:"o3", item_id:"2", requested_by:"정위생사", requested_at:"2026-05-14T10:00:00", qty:3,  note:"마취 시술 예정",       status:"received", reviewed_by:"김원장",  reviewed_at:"2026-05-14T11:00:00",  review_note:"" },
  { id:"o4", item_id:"5", requested_by:"박위생사", requested_at:"2026-05-13T09:00:00", qty:4,  note:"거즈 부족",            status:"rejected", reviewed_by:"이매니저", reviewed_at:"2026-05-13T14:00:00",  review_note:"이번달 예산 초과" },
];

export const INIT_SURGERIES = [
  { id:"s1", title:"오전 임플란트 수술", patient:"홍길동", type:"implant", scheduled_date:"2026-05-18", scheduled_time:"10:30", note:"3.5mm 픽스처 확인", required_items:SURGERY_PRESETS.implant.items, created_by:"김원장", prep_confirmed:false, prepared_by:null, prepared_at:null },
  { id:"s2", title:"오후 보철 세팅", patient:"이지은", type:"prostho", scheduled_date:"2026-05-19", scheduled_time:"15:00", note:"지르코니아 블록 확인", required_items:SURGERY_PRESETS.prostho.items, created_by:"이매니저", prep_confirmed:false, prepared_by:null, prepared_at:null },
];

export const INIT_NOTIFS = [
  { id:"n1", type:"low_stock",  item_id:"1", message:"라텍스 장갑 (M) 재고가 부족합니다",    sub:"현재 3박스 · 최소 5박스",     is_read:false, created_at:"2026-05-16T08:00:00" },
  { id:"n2", type:"low_stock",  item_id:"6", message:"지르코니아 블록 A2 재고가 부족합니다", sub:"현재 1개 · 최소 2개",         is_read:false, created_at:"2026-05-16T08:01:00" },
  { id:"n3", type:"order_req",  item_id:"1", message:"라텍스 장갑 발주 요청이 도착했습니다", sub:"박위생사 · 10박스",            is_read:false, created_at:"2026-05-16T08:10:00" },
  { id:"n4", type:"ordered",    item_id:"6", message:"지르코니아 블록 A2 발주가 완료됐습니다",sub:"이매니저 승인 · 5개 배송 중", is_read:false, created_at:"2026-05-15T17:00:00" },
  { id:"n5", type:"surgery_today", item_id:null, message:"오늘 예정된 수술 준비가 필요합니다", sub:"오전 임플란트 수술 · 10:30", is_read:false, created_at:"2026-05-18T08:00:00" },
];
