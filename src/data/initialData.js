import { SURGERY_PRESETS } from "../constants/surgeryPresets";

export const INITIAL_USERS = [
  { id:"u1", name:"김원장",   role:"owner",     pin:"1234", active:true },
  { id:"u2", name:"이매니저", role:"manager",   pin:"1111", active:true },
  { id:"u3", name:"박위생사", role:"hygienist", pin:"0000", active:true },
  { id:"u4", name:"최위생사", role:"hygienist", pin:"0000", active:true },
  { id:"u5", name:"정위생사", role:"hygienist", pin:"0000", active:true },
];

export const INIT_ITEMS = [
  // ===== 소모품 =====
  { id:"1",  name:"라텍스 장갑 (S)",        category_id:1, unit:"박스", current_qty:8,  min_qty:5,  location:"창고 A-1",      expiry:null          },
  { id:"2",  name:"라텍스 장갑 (M)",        category_id:1, unit:"박스", current_qty:4,  min_qty:5,  location:"창고 A-1",      expiry:null          },
  { id:"3",  name:"니트릴 장갑 (L)",        category_id:1, unit:"박스", current_qty:12, min_qty:5,  location:"창고 A-2",      expiry:null          },
  { id:"4",  name:"마스크 KF94",            category_id:1, unit:"박스", current_qty:15, min_qty:10, location:"창고 A-3",      expiry:"2028-01-01"  },
  { id:"5",  name:"덴탈 마스크",            category_id:1, unit:"박스", current_qty:9,  min_qty:10, location:"창고 A-3",      expiry:"2027-10-15"  },
  { id:"6",  name:"거즈 4x4",              category_id:1, unit:"팩",   current_qty:7,  min_qty:10, location:"창고 B-1",      expiry:"2026-11-20"  },
  { id:"7",  name:"코튼롤",                category_id:1, unit:"봉",   current_qty:18, min_qty:8,  location:"창고 B-2",      expiry:null          },
  { id:"8",  name:"알코올 스왑",            category_id:1, unit:"박스", current_qty:14, min_qty:10, location:"창고 B-3",      expiry:"2027-04-01"  },
  { id:"9",  name:"석션 팁",               category_id:1, unit:"봉",   current_qty:5,  min_qty:6,  location:"창고 C-1",      expiry:null          },
  { id:"10", name:"3-way syringe tip",    category_id:1, unit:"봉",   current_qty:11, min_qty:5,  location:"창고 C-1",      expiry:null          },
  { id:"39", name:"멸균 파우치",            category_id:1, unit:"박스", current_qty:11, min_qty:5,  location:"멸균실 K-1",    expiry:"2028-03-01"  },
  { id:"40", name:"멸균 인디케이터",        category_id:1, unit:"팩",   current_qty:3,  min_qty:4,  location:"멸균실 K-1",    expiry:"2026-07-07"  },

  // ===== 의약품 =====
  { id:"11", name:"리도카인 2%",            category_id:2, unit:"앰플", current_qty:22, min_qty:10, location:"약품실 D-1",    expiry:"2026-08-12"  },
  { id:"12", name:"에피네프린",             category_id:2, unit:"앰플", current_qty:3,  min_qty:5,  location:"응급키트",       expiry:"2026-05-30"  },
  { id:"13", name:"아목시실린",             category_id:2, unit:"통",   current_qty:7,  min_qty:3,  location:"약품실 D-2",    expiry:"2027-03-01"  },
  { id:"14", name:"이부프로펜",             category_id:2, unit:"통",   current_qty:10, min_qty:5,  location:"약품실 D-2",    expiry:"2027-09-15"  },
  { id:"15", name:"클로르헥시딘 가글",      category_id:2, unit:"병",   current_qty:6,  min_qty:4,  location:"약품실 D-3",    expiry:"2026-12-20"  },

  // ===== 보철 / 충전 재료 =====
  { id:"16", name:"레진 A1",               category_id:3, unit:"개",   current_qty:5,  min_qty:5,  location:"재료실 E-1",    expiry:"2026-10-01"  },
  { id:"17", name:"레진 A2",               category_id:3, unit:"개",   current_qty:7,  min_qty:5,  location:"재료실 E-1",    expiry:"2026-09-10"  },
  { id:"18", name:"레진 A3",               category_id:3, unit:"개",   current_qty:2,  min_qty:5,  location:"재료실 E-1",    expiry:"2026-09-10"  },
  { id:"19", name:"본딩제",                category_id:3, unit:"병",   current_qty:4,  min_qty:3,  location:"재료실 E-2",    expiry:"2026-07-15"  },
  { id:"20", name:"에칭젤",                category_id:3, unit:"개",   current_qty:8,  min_qty:4,  location:"재료실 E-2",    expiry:"2027-01-11"  },
  { id:"21", name:"GI Cement",            category_id:3, unit:"세트", current_qty:3,  min_qty:2,  location:"재료실 E-3",    expiry:"2026-06-22"  },
  { id:"22", name:"Temp Cement",          category_id:3, unit:"세트", current_qty:5,  min_qty:3,  location:"재료실 E-3",    expiry:"2027-03-12"  },

  // ===== 인상재 =====
  { id:"23", name:"알지네이트",             category_id:3, unit:"봉",   current_qty:6,  min_qty:4,  location:"인상재실 F-1",  expiry:"2026-08-01"  },
  { id:"24", name:"실리콘 인상재 Heavy",    category_id:3, unit:"통",   current_qty:4,  min_qty:3,  location:"인상재실 F-1",  expiry:"2026-11-10"  },
  { id:"25", name:"실리콘 인상재 Light",    category_id:3, unit:"통",   current_qty:2,  min_qty:3,  location:"인상재실 F-2",  expiry:"2026-10-18"  },
  { id:"26", name:"Bite Registration",    category_id:3, unit:"개",   current_qty:7,  min_qty:3,  location:"인상재실 F-2",  expiry:"2027-02-01"  },

  // ===== 임플란트 =====
  { id:"27", name:"임플란트 픽스처 4.0mm", category_id:3, unit:"개",   current_qty:12, min_qty:10, location:"임플란트실 G-1", expiry:null          },
  { id:"28", name:"임플란트 픽스처 4.5mm", category_id:3, unit:"개",   current_qty:9,  min_qty:10, location:"임플란트실 G-1", expiry:null          },
  { id:"29", name:"Healing Abutment",     category_id:3, unit:"개",   current_qty:15, min_qty:8,  location:"임플란트실 G-2", expiry:null          },
  { id:"30", name:"Cover Screw",          category_id:3, unit:"개",   current_qty:20, min_qty:10, location:"임플란트실 G-2", expiry:null          },
  { id:"31", name:"Bone Graft",           category_id:3, unit:"병",   current_qty:4,  min_qty:5,  location:"냉장 H-1",      expiry:"2026-09-25"  },
  { id:"32", name:"Collagen Membrane",    category_id:3, unit:"개",   current_qty:6,  min_qty:4,  location:"냉장 H-1",      expiry:"2026-12-12"  },

  // ===== 교정 =====
  { id:"33", name:"교정 브라켓 MBT",       category_id:3, unit:"세트", current_qty:5,  min_qty:3,  location:"교정실 I-1",    expiry:null          },
  { id:"34", name:"NiTi Wire 0.014",      category_id:3, unit:"개",   current_qty:18, min_qty:10, location:"교정실 I-2",    expiry:null          },
  { id:"35", name:"Power Chain",          category_id:3, unit:"롤",   current_qty:9,  min_qty:5,  location:"교정실 I-2",    expiry:null          },

  // ===== 장비 =====
  { id:"36", name:"구강 카메라",            category_id:4, unit:"대",   current_qty:2,  min_qty:1,  location:"진료실 1",      expiry:null          },
  { id:"37", name:"광중합기",              category_id:4, unit:"대",   current_qty:4,  min_qty:2,  location:"장비실 J-1",    expiry:null          },
  { id:"38", name:"초음파 스케일러 팁",    category_id:4, unit:"개",   current_qty:8,  min_qty:3,  location:"장비실 J-2",    expiry:null          },
];

// 3개월치 거래 데이터 (2월~5월) — 소비 분석용
export const INIT_TXS = [
  // ─── 5월 ──────────────────────────────────────
  { id:"t1",  item_id:"2",  type:"out", qty:2,  note:"진료실 보충",        created_at:"2026-05-19T09:30:00", user:"이매니저" },
  { id:"t2",  item_id:"11", type:"out", qty:3,  note:"임플란트 마취",      created_at:"2026-05-19T10:00:00", user:"박위생사" },
  { id:"t3",  item_id:"27", type:"out", qty:1,  note:"임플란트 시술",      created_at:"2026-05-19T10:30:00", user:"이매니저" },
  { id:"t4",  item_id:"29", type:"out", qty:1,  note:"어버트먼트 장착",    created_at:"2026-05-19T11:00:00", user:"이매니저" },
  { id:"t5",  item_id:"6",  type:"out", qty:3,  note:"처치 사용",          created_at:"2026-05-18T09:00:00", user:"최위생사" },
  { id:"t6",  item_id:"7",  type:"out", qty:2,  note:"발치 처치",          created_at:"2026-05-18T14:00:00", user:"박위생사" },
  { id:"t7",  item_id:"17", type:"out", qty:1,  note:"레진 충전",          created_at:"2026-05-17T11:00:00", user:"최위생사" },
  { id:"t8",  item_id:"8",  type:"in",  qty:10, note:"5월 정기 발주",      created_at:"2026-05-16T09:00:00", user:"이매니저" },
  { id:"t9",  item_id:"12", type:"out", qty:1,  note:"응급 처치",          created_at:"2026-05-15T16:00:00", user:"박위생사" },
  { id:"t10", item_id:"2",  type:"in",  qty:5,  note:"5월 발주",           created_at:"2026-05-14T09:00:00", user:"이매니저" },
  { id:"t11", item_id:"18", type:"out", qty:2,  note:"레진 충전 2건",      created_at:"2026-05-13T14:00:00", user:"최위생사" },
  { id:"t12", item_id:"6",  type:"in",  qty:10, note:"5월 거즈 발주",      created_at:"2026-05-12T09:00:00", user:"이매니저" },
  { id:"t13", item_id:"11", type:"out", qty:2,  note:"발치 마취",          created_at:"2026-05-10T10:00:00", user:"정위생사" },
  { id:"t14", item_id:"9",  type:"out", qty:3,  note:"석션 팁 교체",       created_at:"2026-05-08T09:30:00", user:"박위생사" },
  // ─── 4월 ──────────────────────────────────────
  { id:"t15", item_id:"2",  type:"out", qty:3,  note:"진료실 보충",        created_at:"2026-04-28T09:00:00", user:"박위생사" },
  { id:"t16", item_id:"11", type:"out", qty:4,  note:"마취 시술 4건",      created_at:"2026-04-25T14:00:00", user:"이매니저" },
  { id:"t17", item_id:"7",  type:"out", qty:3,  note:"처치 사용",          created_at:"2026-04-22T10:00:00", user:"최위생사" },
  { id:"t18", item_id:"6",  type:"out", qty:4,  note:"드레싱",             created_at:"2026-04-20T14:30:00", user:"정위생사" },
  { id:"t19", item_id:"27", type:"out", qty:2,  note:"임플란트 2건",       created_at:"2026-04-18T10:00:00", user:"이매니저" },
  { id:"t20", item_id:"17", type:"out", qty:2,  note:"레진 충전",          created_at:"2026-04-15T11:00:00", user:"최위생사" },
  { id:"t21", item_id:"2",  type:"in",  qty:5,  note:"4월 발주",           created_at:"2026-04-13T09:00:00", user:"이매니저" },
  { id:"t22", item_id:"11", type:"in",  qty:10, note:"4월 리도카인 발주",  created_at:"2026-04-10T09:00:00", user:"이매니저" },
  { id:"t23", item_id:"8",  type:"out", qty:4,  note:"소독 처치",          created_at:"2026-04-08T14:00:00", user:"박위생사" },
  { id:"t24", item_id:"24", type:"out", qty:1,  note:"보철 인상",          created_at:"2026-04-05T10:30:00", user:"이매니저" },
  // ─── 3월 ──────────────────────────────────────
  { id:"t25", item_id:"2",  type:"out", qty:4,  note:"진료실 보충",        created_at:"2026-03-27T09:00:00", user:"박위생사" },
  { id:"t26", item_id:"11", type:"out", qty:3,  note:"마취 시술",          created_at:"2026-03-24T14:00:00", user:"이매니저" },
  { id:"t27", item_id:"6",  type:"out", qty:5,  note:"드레싱 처치",        created_at:"2026-03-20T10:00:00", user:"최위생사" },
  { id:"t28", item_id:"7",  type:"out", qty:4,  note:"처치 사용",          created_at:"2026-03-18T15:00:00", user:"정위생사" },
  { id:"t29", item_id:"27", type:"out", qty:3,  note:"임플란트 3건",       created_at:"2026-03-15T10:30:00", user:"이매니저" },
  { id:"t30", item_id:"8",  type:"out", qty:4,  note:"소독 처치",          created_at:"2026-03-13T09:00:00", user:"최위생사" },
  { id:"t31", item_id:"2",  type:"in",  qty:5,  note:"3월 발주",           created_at:"2026-03-10T09:00:00", user:"이매니저" },
  { id:"t32", item_id:"11", type:"in",  qty:5,  note:"3월 리도카인 발주",  created_at:"2026-03-07T09:00:00", user:"이매니저" },
  // ─── 2월 ──────────────────────────────────────
  { id:"t33", item_id:"2",  type:"out", qty:3,  note:"진료실 보충",        created_at:"2026-02-25T09:00:00", user:"박위생사" },
  { id:"t34", item_id:"6",  type:"out", qty:3,  note:"드레싱",             created_at:"2026-02-22T14:00:00", user:"최위생사" },
  { id:"t35", item_id:"11", type:"out", qty:2,  note:"마취 시술",          created_at:"2026-02-18T10:00:00", user:"이매니저" },
  { id:"t36", item_id:"7",  type:"out", qty:2,  note:"처치 사용",          created_at:"2026-02-15T15:00:00", user:"정위생사" },
  { id:"t37", item_id:"27", type:"out", qty:1,  note:"임플란트",           created_at:"2026-02-12T10:00:00", user:"이매니저" },
  { id:"t38", item_id:"8",  type:"in",  qty:10, note:"2월 발주",           created_at:"2026-02-10T09:00:00", user:"이매니저" },
];

export const INIT_ORDERS = [
  { id:"o1", item_id:"12", requested_by:"박위생사", requested_at:"2026-05-19T08:10:00", qty:10, note:"에피네프린 재고 부족",  status:"pending",  reviewed_by:null,      reviewed_at:null,                   review_note:"" },
  { id:"o2", item_id:"18", requested_by:"최위생사", requested_at:"2026-05-18T16:30:00", qty:5,  note:"레진 A3 시급",         status:"ordered",  reviewed_by:"이매니저", reviewed_at:"2026-05-18T17:00:00", review_note:"승인합니다", carrier:"CJ대한통운", tracking_number:"9876543210" },
  { id:"o3", item_id:"6",  requested_by:"정위생사", requested_at:"2026-05-12T10:00:00", qty:10, note:"거즈 부족",            status:"received", reviewed_by:"이매니저", reviewed_at:"2026-05-12T11:00:00", review_note:"" },
  { id:"o4", item_id:"5",  requested_by:"박위생사", requested_at:"2026-05-10T09:00:00", qty:5,  note:"덴탈 마스크 부족",    status:"rejected", reviewed_by:"이매니저", reviewed_at:"2026-05-10T14:00:00", review_note:"이번달 예산 초과" },
];

export const INIT_SURGERIES = [
  { id:"s1", title:"오전 임플란트 수술", patient:"홍길동", type:"implant",   scheduled_date:"2026-05-20", scheduled_time:"10:30", note:"4.0mm 픽스처 확인",    required_items:SURGERY_PRESETS.implant.items,   created_by:"김원장",  prep_confirmed:false, prepared_by:null, prepared_at:null },
  { id:"s2", title:"오후 보철 세팅",     patient:"이지은", type:"prostho",   scheduled_date:"2026-05-21", scheduled_time:"15:00", note:"인상재 및 임시 시멘트 확인", required_items:SURGERY_PRESETS.prostho.items, created_by:"이매니저", prep_confirmed:false, prepared_by:null, prepared_at:null },
  { id:"s3", title:"발치 예정",          patient:"김민수", type:"extraction", scheduled_date:"2026-05-22", scheduled_time:"11:00", note:"하악 대구치",          required_items:SURGERY_PRESETS.extraction.items, created_by:"김원장",  prep_confirmed:false, prepared_by:null, prepared_at:null },
];

export const INIT_NOTIFS = [
  { id:"n1", type:"low_stock",  item_id:"2",  message:"라텍스 장갑 (M) 재고가 부족합니다",  sub:"현재 4박스 · 최소 5박스",    is_read:false, created_at:"2026-05-20T08:00:00" },
  { id:"n2", type:"low_stock",  item_id:"12", message:"에피네프린 재고가 부족합니다",        sub:"현재 3앰플 · 최소 5앰플",    is_read:false, created_at:"2026-05-20T08:01:00" },
  { id:"n3", type:"low_stock",  item_id:"18", message:"레진 A3 재고가 부족합니다",           sub:"현재 2개 · 최소 5개",         is_read:false, created_at:"2026-05-20T08:02:00" },
  { id:"n4", type:"order_req",  item_id:"12", message:"에피네프린 발주 요청이 도착했습니다", sub:"박위생사 · 10앰플",           is_read:false, created_at:"2026-05-19T08:10:00" },
  { id:"n5", type:"ordered",    item_id:"18", message:"레진 A3 발주가 완료됐습니다",         sub:"이매니저 승인 · 5개 배송 중", is_read:false, created_at:"2026-05-18T17:00:00" },
  { id:"n6", type:"surgery_today", item_id:null, message:"오늘 예정된 수술 준비가 필요합니다", sub:"오전 임플란트 수술 · 10:30", is_read:false, created_at:"2026-05-20T08:00:00" },
];
