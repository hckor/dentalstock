import { useState, useEffect, useRef } from "react";
import {
  Home, Package, ArrowDownToLine, ArrowUpFromLine, Bell,
  Search, Plus, Minus, ChevronRight, AlertTriangle, Clock, X,
  ChevronDown, ChevronUp, Truck, Users, LogOut, Check, UserPlus,
  Edit2, Delete, ShoppingCart, CheckCircle, XCircle,
  ClipboardList, PackageCheck, CircleDot, Stethoscope, CalendarDays, ClipboardCheck
} from "lucide-react";

// ─── TOSS TOKENS ──────────────────────────────────────
const T = {
  blue500:"#2563eb",   blue600:"#2272eb",   blue50:"#e8f3ff",
  white:"#ffffff",
  grey900:"#191f28",   grey800:"#333d4b",   grey700:"#4e5968",
  grey600:"#6b7684",   grey500:"#8b95a1",   grey400:"#b0b8c1",
  grey300:"#d1d6db",   grey200:"#e5e8eb",   grey100:"#f2f4f6",  grey50:"#f9fafb",
  red500:"#f04452",    red50:"#fff0f1",
  green500:"#03b26c",  green50:"#eafaf3",
  orange500:"#fe9800", orange50:"#fff8ec",
  yellow500:"#ffc342", yellow50:"#fff9df",
  purple500:"#a234c7", purple50:"#f8eafd",
  teal500:"#18a5a5",   teal50:"#e6f7f7",
};
const font = `"Toss Product Sans","Tossface","SF Pro KR","SF Pro Display",-apple-system,BlinkMacSystemFont,"Basier Square","Apple SD Gothic Neo",Roboto,"Noto Sans KR",sans-serif`;
const CS   = "0px 2px 8px rgba(0,0,0,0.08)";

// ─── 권한 ─────────────────────────────────────────────
const PERMS = {
  owner:     { items:true, staff:true, orders_approve:true,  stats:true  },
  manager:   { items:true, staff:true, orders_approve:true,  stats:true  },
  hygienist: { items:true, staff:false,orders_approve:false, stats:false },
};
const can = (role, p) => PERMS[role]?.[p] ?? false;

const ROLE_META = {
  owner:     { label:"원장",       color:T.purple500, bg:T.purple50 },
  manager:   { label:"매니저",     color:T.blue500,   bg:T.blue50   },
  hygienist: { label:"치과위생사", color:T.green500,  bg:T.green50  },
};

// ─── 발주 상태 ────────────────────────────────────────
// pending  → 요청됨 (아직 검토 전)
// ordered  → 승인 완료 + 발주 접수 (배송 대기)
// received → 입고 확인 완료 (재고 반영됨)
// rejected → 거절됨
const ORDER_ST = {
  pending:  { bg:T.orange50,  text:T.orange500, border:"#ffd580", label:"발주요청됨", short:"요청됨"  },
  ordered:  { bg:T.teal50,    text:T.teal500,   border:"#99dede", label:"입고대기",   short:"입고대기" },
  received: { bg:T.green50,   text:T.green500,  border:"#b7eed6", label:"입고완료",   short:"입고완료" },
  rejected: { bg:T.red50,     text:T.red500,    border:"#f9c0c5", label:"거절됨",     short:"거절됨"  },
};

// ─── 초기 데이터 ──────────────────────────────────────
const INITIAL_USERS = [
  { id:"u1", name:"김원장",   role:"owner",     pin:"1234", active:true },
  { id:"u2", name:"이매니저", role:"manager",   pin:"1111", active:true },
  { id:"u3", name:"박위생사", role:"hygienist", pin:"0000", active:true },
  { id:"u4", name:"최위생사", role:"hygienist", pin:"0000", active:true },
  { id:"u5", name:"정위생사", role:"hygienist", pin:"0000", active:true },
];
const CATEGORIES = [
  { id:1, name:"소모품", color:T.blue500   },
  { id:2, name:"의약품", color:T.red500    },
  { id:3, name:"재료",   color:T.purple500 },
  { id:4, name:"장비",   color:T.orange500 },
];
const INIT_ITEMS = [
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
const INIT_TXS = [
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
const INIT_ORDERS = [
  { id:"o1", item_id:"1", requested_by:"박위생사", requested_at:"2026-05-16T08:10:00", qty:10, note:"재고 급하게 필요합니다", status:"pending",  reviewed_by:null,     reviewed_at:null,                    review_note:"" },
  { id:"o2", item_id:"6", requested_by:"최위생사", requested_at:"2026-05-15T16:30:00", qty:5,  note:"보철 작업용",          status:"ordered",  reviewed_by:"이매니저", reviewed_at:"2026-05-15T17:00:00",  review_note:"승인합니다" },
  { id:"o3", item_id:"2", requested_by:"정위생사", requested_at:"2026-05-14T10:00:00", qty:3,  note:"마취 시술 예정",       status:"received", reviewed_by:"김원장",  reviewed_at:"2026-05-14T11:00:00",  review_note:"" },
  { id:"o4", item_id:"5", requested_by:"박위생사", requested_at:"2026-05-13T09:00:00", qty:4,  note:"거즈 부족",            status:"rejected", reviewed_by:"이매니저", reviewed_at:"2026-05-13T14:00:00",  review_note:"이번달 예산 초과" },
];
const SURGERY_PRESETS = {
  implant: {
    label:"임플란트",
    items:[{item_id:"1", qty:1}, {item_id:"2", qty:1}, {item_id:"3", qty:2}, {item_id:"5", qty:1}, {item_id:"7", qty:1}],
  },
  prostho: {
    label:"보철",
    items:[{item_id:"1", qty:1}, {item_id:"5", qty:1}, {item_id:"6", qty:2}],
  },
  extraction: {
    label:"발치",
    items:[{item_id:"1", qty:1}, {item_id:"2", qty:1}, {item_id:"4", qty:1}, {item_id:"5", qty:1}, {item_id:"7", qty:1}],
  },
};
const INIT_SURGERIES = [
  { id:"s1", title:"오전 임플란트 수술", patient:"홍길동", type:"implant", scheduled_date:"2026-05-18", scheduled_time:"10:30", note:"3.5mm 픽스처 확인", required_items:SURGERY_PRESETS.implant.items, created_by:"김원장", prep_confirmed:false, prepared_by:null, prepared_at:null },
  { id:"s2", title:"오후 보철 세팅", patient:"이지은", type:"prostho", scheduled_date:"2026-05-19", scheduled_time:"15:00", note:"지르코니아 블록 확인", required_items:SURGERY_PRESETS.prostho.items, created_by:"이매니저", prep_confirmed:false, prepared_by:null, prepared_at:null },
];
const INIT_NOTIFS = [
  { id:"n1", type:"low_stock",  item_id:"1", message:"라텍스 장갑 (M) 재고가 부족합니다",    sub:"현재 3박스 · 최소 5박스",     is_read:false, created_at:"2026-05-16T08:00:00" },
  { id:"n2", type:"low_stock",  item_id:"6", message:"지르코니아 블록 A2 재고가 부족합니다", sub:"현재 1개 · 최소 2개",         is_read:false, created_at:"2026-05-16T08:01:00" },
  { id:"n3", type:"order_req",  item_id:"1", message:"라텍스 장갑 발주 요청이 도착했습니다", sub:"박위생사 · 10박스",            is_read:false, created_at:"2026-05-16T08:10:00" },
  { id:"n4", type:"ordered",    item_id:"6", message:"지르코니아 블록 A2 발주가 완료됐습니다",sub:"이매니저 승인 · 5개 배송 중", is_read:false, created_at:"2026-05-15T17:00:00" },
  { id:"n5", type:"surgery_today", item_id:null, message:"오늘 예정된 수술 준비가 필요합니다", sub:"오전 임플란트 수술 · 10:30", is_read:false, created_at:"2026-05-18T08:00:00" },
];

// ─── HELPERS ──────────────────────────────────────────
const getStatus   = (i) => i.current_qty<=0?"danger":i.current_qty<i.min_qty?"warning":"ok";
const ST = {
  ok:      { bg:T.green50,  text:T.green500,  border:"#b7eed6", label:"정상" },
  warning: { bg:T.orange50, text:T.orange500, border:"#ffd580", label:"부족" },
  danger:  { bg:T.red50,    text:T.red500,    border:"#f9c0c5", label:"소진" },
};
const catName   = (id) => CATEGORIES.find(c=>c.id===id)?.name  || "-";
const catColor  = (id) => CATEGORIES.find(c=>c.id===id)?.color || T.grey400;
const daysUntil = (d)  => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;
const todayKey  = () => new Date().toISOString().slice(0,10);
const fmtDate   = (s)  => new Date(s).toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit"});
const fmtFull   = (s)  => new Date(s).toLocaleDateString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
const initials  = (n)  => n.slice(0,1);

// 특정 품목의 활성 발주 (pending | ordered) 찾기
const getActiveOrder = (orders, itemId) =>
  orders.find(o => o.item_id===itemId && (o.status==="pending"||o.status==="ordered")) || null;
const monthKey = (s) => new Date(s).toISOString().slice(0,7);
const pct = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0;

// ─── SHARED UI ────────────────────────────────────────
const Card = ({children, style={}}) => (
  <div style={{background:T.white, borderRadius:12, border:"none", boxShadow:CS, ...style}}>
    {children}
  </div>
);
const Divider = () => <div style={{height:1, background:T.grey100, margin:"0 16px"}}/>;
const Chip = ({label, color, bg, border}) => (
  <span style={{fontSize:12, fontWeight:700, padding:"3px 7px", borderRadius:12, background:bg, color, border:"none", lineHeight:"18px", whiteSpace:"nowrap"}}>{label}</span>
);
const Avatar = ({name, role, size=44}) => {
  const m = ROLE_META[role];
  return <div style={{width:size, height:size, borderRadius:9999, background:m.bg, border:`2px solid ${m.color}22`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
    <span style={{fontSize:size*.4, fontWeight:700, color:m.color}}>{initials(name)}</span>
  </div>;
};
const SecTitle = ({children}) => <p style={{margin:"0 0 10px", fontSize:14, fontWeight:600, color:T.grey800}}>{children}</p>;
const Inp = ({value, onChange, placeholder, type="text", style={}}) => (
  <input value={value} onChange={onChange} placeholder={placeholder} type={type}
    style={{width:"100%", padding:"14px 16px", borderRadius:12, border:`1px solid rgba(2,32,71,0.05)`, background:"rgba(0,23,51,0.02)", fontSize:17, fontWeight:400, color:T.grey800, fontFamily:font, outline:"none", boxSizing:"border-box", ...style}}/>
);

// ─── PIN ──────────────────────────────────────────────
function PinPad({onChange, onDelete}) {
  const keys=["1","2","3","4","5","6","7","8","9","","0","del"];
  return (
    <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
      {keys.map((k,i) => k===""?<div key={i}/> : (
        <button key={i} onClick={()=>k==="del"?onDelete():onChange(k)}
          style={{padding:"18px 0", borderRadius:14, border:`1px solid ${T.grey200}`, background:T.white, cursor:"pointer", fontFamily:font, fontSize:k==="del"?14:22, fontWeight:600, color:T.grey900, display:"flex", alignItems:"center", justifyContent:"center"}}>
          {k==="del"?<Delete size={20} color={T.grey600}/>:k}
        </button>
      ))}
    </div>
  );
}
function PinDots({length, filled, error}) {
  return <div style={{display:"flex", justifyContent:"center", gap:16, margin:"24px 0"}}>
    {Array.from({length}).map((_,i) => (
      <div key={i} style={{width:14, height:14, borderRadius:9999, background:error?T.red500:i<filled?T.grey900:T.grey200, transition:"background 150ms"}}/>
    ))}
  </div>;
}
function useToast() {
  const [t,setT] = useState(null);
  const show = msg => { setT(msg); setTimeout(()=>setT(null), 2400); };
  return [t, show];
}

// ════════════════════════════════════════════════════
//  APP ROOT
// ════════════════════════════════════════════════════
export default function DentalStock() {
  const [appState,    setAppState]    = useState("login_select");
  const [users,       setUsers]       = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(null);
  const [pinTarget,   setPinTarget]   = useState(null);
  const [items,       setItems]       = useState(INIT_ITEMS);
  const [txs,         setTxs]         = useState(INIT_TXS);
  const [orders,      setOrders]      = useState(INIT_ORDERS);
  const [surgeries,   setSurgeries]   = useState(INIT_SURGERIES);
  const [notifs,      setNotifs]      = useState(INIT_NOTIFS);

  const unread        = notifs.filter(n=>!n.is_read).length;
  const pendingOrders = orders.filter(o=>o.status==="pending").length;

  return (
    <div style={{display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", background:T.grey100, fontFamily:font, padding:20}}>
      <div style={{width:"min(100%, 390px)", height:"min(844px, calc(100vh - 40px))", background:T.grey50, borderRadius:24, boxShadow:"0px 8px 24px rgba(0,0,0,0.16)", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative"}}>
        {appState==="login_select" && <LoginSelect users={users} onSelect={u=>{setPinTarget(u);setAppState("login_pin");}}/>}
        {appState==="login_pin"    && pinTarget && <LoginPin user={pinTarget} onSuccess={()=>{setCurrentUser(pinTarget);setAppState("app");}} onBack={()=>{setPinTarget(null);setAppState("login_select");}}/>}
        {appState==="app"          && currentUser && (
          <MainApp
            currentUser={currentUser} users={users} setUsers={setUsers}
            items={items} setItems={setItems}
            txs={txs} setTxs={setTxs}
            orders={orders} setOrders={setOrders}
            surgeries={surgeries} setSurgeries={setSurgeries}
            notifs={notifs} setNotifs={setNotifs}
            unread={unread} pendingOrders={pendingOrders}
            onLogout={()=>{setCurrentUser(null);setPinTarget(null);setAppState("login_select");}}
          />
        )}
      </div>
      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        *::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════
function LoginSelect({users, onSelect}) {
  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", background:T.white}}>
      <div style={{padding:"56px 24px 28px", textAlign:"center"}}>
        <div style={{width:64, height:64, borderRadius:20, background:T.blue50, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px"}}>
          <Stethoscope size={34} color={T.blue500} strokeWidth={2.2}/>
        </div>
        <h1 style={{margin:"0 0 6px", fontSize:24, fontWeight:700, color:T.grey900}}>DentalStock</h1>
        <p style={{margin:0, fontSize:14, color:T.grey500}}>누구로 로그인할까요?</p>
      </div>
      <div style={{flex:1, overflowY:"auto", padding:"0 16px 16px"}}>
        {users.filter(u=>u.active).map((u,i) => {
          const m = ROLE_META[u.role];
          return (
            <button key={u.id} onClick={()=>onSelect(u)}
              style={{width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 16px", marginBottom:8, background:T.white, borderRadius:16, border:`1px solid ${T.grey200}`, cursor:"pointer", fontFamily:font, boxShadow:CS, animation:`fadeUp ${150+i*50}ms both`}}>
              <Avatar name={u.name} role={u.role} size={48}/>
              <div style={{flex:1, textAlign:"left"}}>
                <p style={{margin:0, fontSize:16, fontWeight:700, color:T.grey900}}>{u.name}</p>
                <span style={{fontSize:12, fontWeight:600, color:m.color, background:m.bg, padding:"2px 8px", borderRadius:9999}}>{m.label}</span>
              </div>
              <ChevronRight size={18} color={T.grey400}/>
            </button>
          );
        })}
      </div>
      <p style={{textAlign:"center", fontSize:12, color:T.grey400, padding:"0 0 28px"}}>데모 PIN: 원장 1234 · 매니저 1111 · 위생사 0000</p>
    </div>
  );
}

function LoginPin({user, onSuccess, onBack}) {
  const [pin,   setPin]   = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const LEN = 4;
  const onKey = k => {
    if (pin.length >= LEN) return;
    const next = pin + k;
    setPin(next);
    if (next.length === LEN) {
      setTimeout(() => {
        if (next === user.pin) { onSuccess(); }
        else { setError(true); setShake(true); setTimeout(()=>{setPin(""); setError(false); setShake(false);}, 600); }
      }, 120);
    }
  };
  const m = ROLE_META[user.role];
  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", background:T.white}}>
      <button onClick={onBack} style={{alignSelf:"flex-start", margin:"16px 16px 0", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:T.grey600, fontFamily:font, fontSize:14}}>
        <ChevronRight size={16} style={{transform:"rotate(180deg)"}}/> 다른 계정
      </button>
      <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 32px"}}>
        <Avatar name={user.name} role={user.role} size={72}/>
        <p style={{margin:"16px 0 4px", fontSize:20, fontWeight:700, color:T.grey900}}>{user.name}</p>
        <span style={{fontSize:13, fontWeight:600, color:m.color, background:m.bg, padding:"3px 12px", borderRadius:9999, marginBottom:8}}>{m.label}</span>
        <p style={{margin:0, fontSize:14, color:T.grey500}}>PIN 4자리를 입력하세요</p>
        <div style={{animation:shake?"shake 400ms":"none"}}><PinDots length={LEN} filled={pin.length} error={error}/></div>
        {error && <p style={{margin:"0 0 12px", fontSize:13, color:T.red500, fontWeight:600}}>PIN이 올바르지 않습니다</p>}
      </div>
      <div style={{padding:"0 24px 40px"}}><PinPad onChange={onKey} onDelete={()=>{setPin(p=>p.slice(0,-1)); setError(false);}}/></div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════
function MainApp({currentUser, users, setUsers, items, setItems, txs, setTxs, orders, setOrders, surgeries, setSurgeries, notifs, setNotifs, unread, pendingOrders, onLogout}) {
  const [tab,     setTab]     = useState("home");
  const [modal,   setModal]   = useState(null);
  const [selItem, setSelItem] = useState(null);
  const [form,    setForm]    = useState({qty:1, note:""});
  const [search,  setSearch]  = useState("");
  const [cat,     setCat]     = useState(0);
  const [toast,   showToast]  = useToast();
  const [editItemsState, setEditItemsState] = useState(null); // {initialItems, onSave, title}
  const firedPushesRef    = useRef(new Set());
  const firedRemindersRef = useRef(new Set());

  const role       = currentUser.role;
  const canApprove = can(role, "orders_approve");
  const adminBadge = canApprove ? pendingOrders : 0;

  const openModal = (type, item=null) => { setSelItem(item); setForm({qty:1, note:""}); setModal(type); };

  const openItemsEditor = (initialItems, onSave, title) =>
    setEditItemsState({initialItems, onSave, title});

  const updateSurgeryItems = (surgeryId, newItems) => {
    setSurgeries(p=>p.map(s=>s.id===surgeryId?{...s, required_items:newItems}:s));
    showToast("준비 품목이 수정되었습니다.");
  };

  const requestPushPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(()=>{});
    }
  };
  const firePush = (key, title, body) => {
    if (firedPushesRef.current.has(key)) return;
    firedPushesRef.current.add(key);
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, {body, tag:key}); } catch(_) {}
    }
  };

  // ── 입출고 처리 ─────────────────────────────────────
  const commit = type => {
    if (!selItem) return;
    const requestedQty = Math.max(1, parseInt(form.qty)||1);
    const qty   = type==="out" ? Math.min(requestedQty, selItem.current_qty) : requestedQty;
    if (type==="out" && qty < requestedQty) {
      showToast(`현재 재고는 ${selItem.current_qty}${selItem.unit}입니다.`);
    }
    if (type==="out" && qty === 0) return;
    const after = type==="in" ? selItem.current_qty+qty : selItem.current_qty-qty;
    const upd   = items.map(i=>i.id===selItem.id?{...i,current_qty:after}:i);
    setItems(upd);
    setTxs(p=>[{id:`t${Date.now()}`, item_id:selItem.id, type, qty, note:form.note, created_at:new Date().toISOString(), user:currentUser.name},...p]);
    const u = upd.find(i=>i.id===selItem.id);
    if (u.current_qty < u.min_qty)
      setNotifs(p=>[{id:`n${Date.now()}`, type:"low_stock", item_id:selItem.id, message:`${selItem.name} 재고가 부족합니다`, sub:`현재 ${u.current_qty}${selItem.unit} · 최소 ${selItem.min_qty}${selItem.unit}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast(`${type==="in"?"입고":"출고"} ${qty}${selItem.unit} 완료`);
    setModal(null);
  };

  // ── 발주 요청 ────────────────────────────────────────
  const submitOrder = (item, qty, note) => {
    if (getActiveOrder(orders, item.id)) {
      showToast("이미 처리 중인 발주가 있습니다.");
      setModal(null);
      return;
    }
    setOrders(p=>[{id:`o${Date.now()}`, item_id:item.id, requested_by:currentUser.name, requested_at:new Date().toISOString(), qty, note, status:"pending", reviewed_by:null, reviewed_at:null, review_note:""},...p]);
    setNotifs(p=>[{id:`n${Date.now()}`, type:"order_req", item_id:item.id, message:`${item.name} 발주 요청이 도착했습니다`, sub:`${currentUser.name} · ${qty}${item.unit}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("발주 요청이 접수되었습니다");
    setModal(null);
  };

  // ── 발주 승인 (ordered 상태로, 재고 반영 없음) ────────
  const approveOrder = (orderId, reviewNote) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "pending") {
      showToast("처리할 발주 요청을 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("발주 품목을 찾을 수 없습니다.");
      return;
    }
    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"ordered", reviewed_by:currentUser.name, reviewed_at:new Date().toISOString(), review_note:reviewNote}:o));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"ordered", item_id:item.id, message:`${item.name} 발주가 완료되었습니다`, sub:`${currentUser.name} 승인 · ${order.qty}${item.unit} 배송 대기`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("발주가 승인되었습니다.");
  };

  // ── 발주 거절 ────────────────────────────────────────
  const rejectOrder = (orderId, reviewNote) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "pending") {
      showToast("처리할 발주 요청을 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("발주 품목을 찾을 수 없습니다.");
      return;
    }
    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"rejected", reviewed_by:currentUser.name, reviewed_at:new Date().toISOString(), review_note:reviewNote}:o));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"order_rejected", item_id:item.id, message:`${item.name} 발주가 거절되었습니다`, sub:`${currentUser.name} · ${reviewNote||"사유 없음"}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("발주 요청이 거절되었습니다");
  };

  // ── 실 입고 확인 (ordered → received, 재고 반영) ──────
  const confirmReceipt = (orderId, actualQty, note) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order || order.status !== "ordered") {
      showToast("입고 확인할 발주를 찾을 수 없습니다.");
      return;
    }
    const item  = items.find(i=>i.id===order.item_id);
    if (!item) {
      showToast("입고 품목을 찾을 수 없습니다.");
      return;
    }
    const after = item.current_qty + actualQty;
    setItems(p=>p.map(i=>i.id===item.id?{...i, current_qty:after}:i));
    setTxs(p=>[{id:`t${Date.now()}`, item_id:item.id, type:"in", qty:actualQty, note:`발주 입고 확인 (요청자: ${order.requested_by})${note?` · ${note}`:""}`, created_at:new Date().toISOString(), user:currentUser.name},...p]);
    setOrders(p=>p.map(o=>o.id===orderId?{...o, status:"received"}:o));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"received", item_id:item.id, message:`${item.name} 입고 확인 완료`, sub:`${currentUser.name} 확인 · ${actualQty}${item.unit} 입고`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast(`${actualQty}${item.unit} 입고 확인 완료`);
    setModal(null);
  };

  const addSurgery = (data) => {
    const preset = SURGERY_PRESETS[data.type] || SURGERY_PRESETS.implant;
    const requiredItems = (data.required_items && data.required_items.length) ? data.required_items : preset.items;
    const surgery = {
      id:`s${Date.now()}`,
      title:data.title || preset.label,
      patient:data.patient || "-",
      type:data.type,
      scheduled_date:data.scheduled_date,
      scheduled_time:data.scheduled_time,
      note:data.note,
      required_items:requiredItems,
      created_by:currentUser.name,
      prep_confirmed:false,
      prepared_by:null,
      prepared_at:null,
    };
    setSurgeries(p=>[surgery,...p]);
    if (surgery.scheduled_date===todayKey()) {
      setNotifs(p=>[{id:`n${Date.now()}`, type:"surgery_today", surgery_id:surgery.id, item_id:null, message:"오늘 예정된 수술 준비가 필요합니다", sub:`${surgery.title} · ${surgery.scheduled_time}`, is_read:false, created_at:new Date().toISOString()},...p]);
      firePush(`today:${surgery.id}`, "오늘 수술 일정", `${surgery.title} · ${surgery.scheduled_time}`);
    }
    showToast("수술 일정이 등록되었습니다.");
  };

  const confirmSurgeryPrep = (surgeryId) => {
    const surgery = surgeries.find(s=>s.id===surgeryId);
    if (!surgery) return;
    setSurgeries(p=>p.map(s=>s.id===surgeryId?{...s, prep_confirmed:true, prepared_by:currentUser.name, prepared_at:new Date().toISOString()}:s));
    setNotifs(p=>[{id:`n${Date.now()}`, type:"surgery_ready", surgery_id:surgeryId, item_id:null, message:"수술 준비 확인이 완료되었습니다", sub:`${surgery.title} · ${currentUser.name}`, is_read:false, created_at:new Date().toISOString()},...p]);
    showToast("수술 준비가 확인되었습니다.");
  };

  // ── 로그인 직후: 브라우저 푸쉬 권한 요청 + 당일 수술 인앱 알림 자동 생성 ──
  useEffect(() => {
    requestPushPermission();
    const today = todayKey();
    const todays = surgeries.filter(s=>s.scheduled_date===today);
    if (todays.length === 0) return;
    setNotifs(p => {
      const existing = new Set(p.filter(n=>n.type==="surgery_today"&&n.surgery_id).map(n=>n.surgery_id));
      const missing = todays.filter(s=>!existing.has(s.id));
      if (missing.length === 0) return p;
      const created = missing.map(s=>({
        id:`n${Date.now()}-${s.id}`, type:"surgery_today", surgery_id:s.id, item_id:null,
        message:"오늘 예정된 수술 준비가 필요합니다",
        sub:`${s.title} · ${s.scheduled_time}`,
        is_read:false, created_at:new Date().toISOString(),
      }));
      return [...created, ...p];
    });
    // 브라우저 푸쉬 발화 (권한 거절 시 무동작)
    todays.forEach(s => firePush(`today:${s.id}`, "오늘 수술 일정", `${s.title} · ${s.scheduled_time}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 30분 전 미준비 리마인더 ──
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      surgeries.forEach(s => {
        if (s.prep_confirmed) return;
        if (s.scheduled_date !== todayKey()) return;
        const start = new Date(`${s.scheduled_date}T${s.scheduled_time}`);
        const diffMin = (start - now) / 60000;
        if (diffMin > 0 && diffMin <= 30 && !firedRemindersRef.current.has(s.id)) {
          firedRemindersRef.current.add(s.id);
          const mins = Math.ceil(diffMin);
          setNotifs(p => [{
            id:`n${Date.now()}-r${s.id}`, type:"surgery_reminder", surgery_id:s.id, item_id:null,
            message:`${mins}분 후 수술 시작 — 준비 미완료`,
            sub:`${s.title} · ${s.scheduled_time}`,
            is_read:false, created_at:new Date().toISOString(),
          }, ...p]);
          firePush(`reminder:${s.id}`, "수술 임박 — 준비 미완료", `${s.title} · ${s.scheduled_time}`);
        }
      });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surgeries]);

  const filteredItems = items.filter(i=>i.name.includes(search)&&(cat===0||i.category_id===cat));
  const navItems = [
    {id:"home",      Icon:Home,            label:"홈"},
    {id:"inventory", Icon:Package,         label:"재고"},
    {id:"inout",     Icon:ArrowDownToLine, label:"입출고"},
    {id:"alerts",    Icon:Bell,            label:"알림", badge:unread},
    ...(canApprove?[{id:"admin", Icon:Users, label:"관리", badge:adminBadge}]:[]),
  ];

  return (
    <>
      {/* 상태바 */}
      <div style={{background:T.white, padding:"14px 24px 8px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${T.grey100}`}}>
        <span style={{fontSize:13, fontWeight:700, color:T.grey900}}>9:41</span>
        <div style={{width:110, height:24, background:T.grey900, borderRadius:12}}/>
        <span style={{fontSize:12, color:T.grey600}}>100%</span>
      </div>
      {/* 헤더 */}
      <div style={{background:T.white, padding:"12px 20px 14px", borderBottom:`1px solid ${T.grey100}`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:2}}>
              <p style={{margin:0, fontSize:12, color:T.grey400}}>DentalStock</p>
              <span style={{fontSize:11, fontWeight:600, color:ROLE_META[role].color, background:ROLE_META[role].bg, padding:"1px 8px", borderRadius:9999}}>{currentUser.name}</span>
            </div>
            <h1 style={{margin:0, fontSize:20, fontWeight:700, color:T.grey900}}>
              {{home:"대시보드",inventory:"재고 목록",inout:"입출고",alerts:"알림",admin:"관리"}[tab]}
            </h1>
          </div>
          <button onClick={()=>setTab("alerts")} style={{position:"relative", background:"none", border:"none", cursor:"pointer", padding:8}}>
            <Bell size={22} color={T.grey700}/>
            {unread>0&&<span style={{position:"absolute", top:4, right:4, background:T.red500, color:T.white, borderRadius:9999, fontSize:10, fontWeight:700, width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center"}}>{unread}</span>}
          </button>
        </div>
      </div>

      {/* 화면 */}
      <div style={{flex:1, overflowY:"auto", background:T.grey50}}>
        {tab==="home"      && <HomeScreen items={items} txs={txs} orders={orders} surgeries={surgeries} setTab={setTab} openModal={openModal} currentUser={currentUser} canApprove={canApprove} confirmSurgeryPrep={confirmSurgeryPrep} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>}
        {tab==="inventory" && <InventoryScreen items={filteredItems} search={search} setSearch={setSearch} cat={cat} setCat={setCat} openModal={openModal} items_all={items} setItems={setItems} orders={orders} showToast={showToast} currentUser={currentUser} confirmReceipt={confirmReceipt}/>}
        {tab==="inout"     && <InOutScreen items={items} txs={txs} openModal={openModal}/>}
        {tab==="alerts"    && <AlertsScreen notifs={notifs} setNotifs={setNotifs}/>}
        {tab==="admin"     && canApprove && <AdminScreen users={users} setUsers={setUsers} currentUser={currentUser} orders={orders} items={items} txs={txs} surgeries={surgeries} addSurgery={addSurgery} onLogout={onLogout} showToast={showToast} approveOrder={approveOrder} rejectOrder={rejectOrder} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>}
      </div>

      {/* 하단 탭 */}
      <div style={{background:T.white, borderTop:`1px solid ${T.grey100}`, display:"flex", padding:"6px 0 18px"}}>
        {navItems.map(({id,Icon,label,badge}) => {
          const a = tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, border:"none", background:"none", cursor:"pointer", padding:"6px 0", position:"relative"}}>
              <Icon size={22} color={a?T.blue500:T.grey400} strokeWidth={a?2.5:1.8}/>
              <span style={{fontSize:10, fontFamily:font, color:a?T.blue500:T.grey400, fontWeight:a?700:400}}>{label}</span>
              {badge>0&&<span style={{position:"absolute", top:4, left:"50%", marginLeft:6, background:T.red500, color:T.white, borderRadius:9999, fontSize:9, fontWeight:700, width:14, height:14, display:"flex", alignItems:"center", justifyContent:"center"}}>{badge}</span>}
              {a&&<div style={{position:"absolute", bottom:0, width:20, height:2, background:T.blue500, borderRadius:9999}}/>}
            </button>
          );
        })}
      </div>

      {/* 모달 */}
      {modal && (
        <div style={{position:"absolute", inset:0, background:"rgba(2,9,19,0.5)", zIndex:99, display:"flex", justifyContent:"center", alignItems:"flex-end"}} onClick={()=>setModal(null)}>
          <div style={{background:T.white, borderRadius:"16px 16px 0 0", width:"100%", maxHeight:"85vh", overflowY:"auto", paddingBottom:32, boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"center", padding:"12px 0 0"}}>
              <div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/>
            </div>
            {(modal==="in"||modal==="out")&&!selItem&&<ItemPickerSheet items={items} setSelItem={setSelItem} onClose={()=>setModal(null)}/>}
            {(modal==="in"||modal==="out")&&selItem&&<InOutSheet modal={modal} selItem={selItem} form={form} setForm={setForm} onCommit={()=>commit(modal)} onClose={()=>setModal(null)}/>}
            {modal==="order_req"&&selItem&&<OrderRequestSheet item={selItem} currentUser={currentUser} onSubmit={submitOrder} onClose={()=>setModal(null)} orders={orders}/>}
            {modal==="confirm_receipt"&&selItem&&<ReceiptConfirmSheet item={selItem} orders={orders} currentUser={currentUser} onConfirm={confirmReceipt} onClose={()=>setModal(null)}/>}
            {modal==="add_item"&&<AddItemModal setItems={setItems} onClose={()=>setModal(null)} showToast={showToast}/>}
            {modal==="edit_item"&&selItem&&<EditItemModal item={selItem} setItems={setItems} onClose={()=>setModal(null)} showToast={showToast}/>}
          </div>
        </div>
      )}

      {/* 수술 준비 품목 편집 시트 */}
      {editItemsState && (
        <div style={{position:"absolute", inset:0, background:"rgba(2,9,19,0.5)", zIndex:99, display:"flex", justifyContent:"center", alignItems:"flex-end"}} onClick={()=>setEditItemsState(null)}>
          <div style={{background:T.white, borderRadius:"16px 16px 0 0", width:"100%", maxHeight:"85vh", overflowY:"auto", paddingBottom:32, boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"center", padding:"12px 0 0"}}>
              <div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/>
            </div>
            <EditSurgeryItemsSheet
              initialItems={editItemsState.initialItems}
              allItems={items}
              title={editItemsState.title}
              onSave={editItemsState.onSave}
              onClose={()=>setEditItemsState(null)}
            />
          </div>
        </div>
      )}

      {toast&&<div style={{position:"absolute", bottom:86, left:20, right:20, background:T.grey900, color:T.white, padding:"12px 16px", borderRadius:12, fontSize:14, fontWeight:400, zIndex:999, boxShadow:"0px 4px 12px rgba(0,0,0,0.12)", animation:"fadeUp 150ms"}}>{toast}</div>}
    </>
  );
}

// ════════════════════════════════════════════════════
//  HOME
// ════════════════════════════════════════════════════
function HomeScreen({items, txs, orders, surgeries, setTab, openModal, currentUser, canApprove, confirmSurgeryPrep, openItemsEditor, updateSurgeryItems}) {
  const [statFilter, setStatFilter] = useState(null);
  const alertItems    = items.filter(i=>getStatus(i)!=="ok");
  const pendingCount  = orders.filter(o=>o.status==="pending").length;
  const waitingCount  = orders.filter(o=>o.status==="ordered").length; // 입고 대기
  const myOrders      = orders.filter(o=>o.requested_by===currentUser.name).slice(0,3);
  const todaySurgeries = surgeries.filter(s=>s.scheduled_date===todayKey()).sort((a,b)=>(a.scheduled_time||"").localeCompare(b.scheduled_time||""));

  const stats = [
    {id:"all",     label:"전체 품목", value:items.length,                                    color:T.grey900,  items},
    {id:"ok",      label:"정상",      value:items.filter(i=>getStatus(i)==="ok").length,     color:T.green500, items:items.filter(i=>getStatus(i)==="ok")},
    {id:"warning", label:"재고 부족", value:items.filter(i=>getStatus(i)==="warning").length,color:T.orange500,items:items.filter(i=>getStatus(i)==="warning")},
    {id:"danger",  label:"재고 소진", value:items.filter(i=>getStatus(i)==="danger").length, color:T.red500,   items:items.filter(i=>getStatus(i)==="danger")},
  ];
  const selectedStat = stats.find(s=>s.id===statFilter);

  return (
    <div>
      <div style={{padding:"16px 16px 0"}}>
        <Card style={{padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12}}>
          <Avatar name={currentUser.name} role={currentUser.role} size={44}/>
          <div>
            <p style={{margin:0, fontSize:15, fontWeight:700, color:T.grey900}}>{currentUser.name}님, 안녕하세요</p>
            <span style={{fontSize:12, fontWeight:600, color:ROLE_META[currentUser.role].color}}>{ROLE_META[currentUser.role].label}</span>
          </div>
        </Card>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16}}>
          {stats.map(s=>{
            const active = statFilter===s.id;
            return (
              <button key={s.id} onClick={()=>setStatFilter(active?null:s.id)}
                style={{textAlign:"left", padding:"14px 16px", border:"none", borderRadius:12, background:T.white, boxShadow:active?"0px 0px 0px 2px #2563eb, 0px 2px 8px rgba(0,0,0,0.08)":CS, cursor:"pointer", fontFamily:font}}>
                <p style={{margin:"0 0 4px", fontSize:12, color:active?T.blue500:T.grey500, fontWeight:active?600:400}}>{s.label}</p>
                <p style={{margin:0, fontSize:26, fontWeight:700, color:s.color, fontVariantNumeric:"tabular-nums"}}>{s.value}</p>
              </button>
            );
          })}
        </div>

        {selectedStat&&(
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px"}}>
              <div>
                <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900}}>{selectedStat.label} 상세</p>
                <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{selectedStat.value}개 품목</p>
              </div>
              <button onClick={()=>setStatFilter(null)} style={{border:"none", background:T.grey100, width:32, height:32, borderRadius:9999, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <X size={16} color={T.grey600}/>
              </button>
            </div>
            {selectedStat.items.length>0 ? selectedStat.items.map((item,i)=>{
              const sc = ST[getStatus(item)];
              const ao = getActiveOrder(orders, item.id);
              return (
                <div key={item.id}>
                  <button onClick={()=>openModal(getStatus(item)==="ok"?"out":"in",item)} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"none", border:"none", cursor:"pointer", fontFamily:font}}>
                    <div style={{width:8, height:8, borderRadius:9999, background:catColor(item.category_id), flexShrink:0}}/>
                    <div style={{flex:1, textAlign:"left", minWidth:0}}>
                      <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.name}</p>
                      <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{catName(item.category_id)} · {item.current_qty}{item.unit} / 최소 {item.min_qty}{item.unit}</p>
                    </div>
                    <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4}}>
                      <Chip label={sc.label} color={sc.text} bg={sc.bg} border={sc.border}/>
                      {ao&&<Chip label={ORDER_ST[ao.status].short} color={ORDER_ST[ao.status].text} bg={ORDER_ST[ao.status].bg} border={ORDER_ST[ao.status].border}/>}
                    </div>
                  </button>
                  {i<selectedStat.items.length-1&&<Divider/>}
                </div>
              );
            }) : (
              <p style={{margin:0, padding:"0 16px 18px", fontSize:14, color:T.grey500}}>조건에 맞는 품목이 없어요.</p>
            )}
          </Card>
        )}
      </div>

      {todaySurgeries.length>0&&(
        <div style={{padding:"0 16px 16px"}}>
          <SecTitle>오늘 수술 준비</SecTitle>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {todaySurgeries.map(surgery=>{
              const preset = SURGERY_PRESETS[surgery.type];
              const shortages = surgery.required_items.filter(req=>{
                const item = items.find(i=>i.id===req.item_id);
                return !item || item.current_qty < req.qty;
              });
              return (
                <Card key={surgery.id} style={{padding:"16px"}}>
                  <div style={{display:"flex", alignItems:"flex-start", gap:12, marginBottom:12}}>
                    <div style={{width:40, height:40, borderRadius:12, background:surgery.prep_confirmed?T.green50:T.blue50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                      {surgery.prep_confirmed?<ClipboardCheck size={20} color={T.green500}/>:<CalendarDays size={20} color={T.blue500}/>}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2, flexWrap:"wrap"}}>
                        <p style={{margin:0, fontSize:15, fontWeight:700, color:T.grey900}}>{surgery.title}</p>
                        <Chip label={preset?.label||"수술"} color={T.blue500} bg={T.blue50} border={T.blue50}/>
                      </div>
                      <p style={{margin:0, fontSize:12, color:T.grey500}}>{surgery.scheduled_time} · 환자 {surgery.patient}</p>
                    </div>
                    <Chip label={surgery.prep_confirmed?"준비완료":shortages.length>0?"부족확인":"준비필요"} color={surgery.prep_confirmed?T.green500:shortages.length>0?T.orange500:T.blue500} bg={surgery.prep_confirmed?T.green50:shortages.length>0?T.orange50:T.blue50} border={T.grey200}/>
                  </div>
                  <div style={{background:T.grey50, borderRadius:12, padding:"10px 12px", marginBottom:12}}>
                    {surgery.required_items.map((req,i)=>{
                      const item = items.find(it=>it.id===req.item_id);
                      const enough = item && item.current_qty>=req.qty;
                      return (
                        <div key={`${surgery.id}-${req.item_id}`} style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:i===0?"0 0 8px":i===surgery.required_items.length-1?"8px 0 0":"8px 0", borderTop:i===0?"none":`1px solid ${T.grey100}`}}>
                          <div style={{minWidth:0}}>
                            <p style={{margin:0, fontSize:13, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name||"삭제된 품목"}</p>
                            <p style={{margin:"2px 0 0", fontSize:11, color:T.grey500}}>필요 {req.qty}{item?.unit||""} · 현재 {item?.current_qty??0}{item?.unit||""}</p>
                          </div>
                          <Chip label={enough?"가능":"부족"} color={enough?T.green500:T.red500} bg={enough?T.green50:T.red50} border={T.grey200}/>
                        </div>
                      );
                    })}
                  </div>
                  {surgery.note&&<p style={{margin:"0 0 12px", fontSize:12, color:T.grey600}}>메모: {surgery.note}</p>}
                  {surgery.prep_confirmed ? (
                    <button disabled style={{width:"100%", padding:"12px 0", borderRadius:9999, border:"none", background:T.grey100, color:T.grey500, fontSize:14, fontWeight:600, cursor:"default", fontFamily:font}}>
                      {surgery.prepared_by} 준비 완료
                    </button>
                  ) : (
                    <div style={{display:"flex", gap:8}}>
                      <button
                        onClick={()=>openItemsEditor(surgery.required_items, (newItems)=>updateSurgeryItems(surgery.id, newItems), `${surgery.scheduled_time} · ${surgery.title}`)}
                        style={{flex:1, padding:"12px 0", borderRadius:9999, border:`1px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:4}}
                      ><Edit2 size={14}/>품목 편집</button>
                      <button
                        onClick={()=>confirmSurgeryPrep(surgery.id)}
                        style={{flex:2, padding:"12px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:font}}
                      >준비 확인 완료</button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 발주 대기 배너 — 매니저/원장 */}
      {canApprove && pendingCount>0 && (
        <div style={{padding:"0 16px 12px"}}>
          <button onClick={()=>setTab("admin")} style={{width:"100%", padding:"14px 16px", borderRadius:16, border:`1.5px solid ${T.orange500}44`, background:T.orange50, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:12}}>
            <div style={{width:36, height:36, borderRadius:9999, background:T.orange500, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}><ClipboardList size={18} color={T.white}/></div>
            <div style={{flex:1, textAlign:"left"}}>
              <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900}}>승인 대기 중인 발주 요청</p>
              <p style={{margin:"2px 0 0", fontSize:12, color:T.orange500, fontWeight:600}}>{pendingCount}건 검토 필요</p>
            </div>
            <ChevronRight size={18} color={T.orange500}/>
          </button>
        </div>
      )}

      {/* 입고 대기 배너 — 전 직원 (ordered 상태 있을 때) */}
      {waitingCount>0 && (
        <div style={{padding:"0 16px 12px"}}>
          <button onClick={()=>setTab("inventory")} style={{width:"100%", padding:"14px 16px", borderRadius:16, border:`1.5px solid ${T.teal500}44`, background:T.teal50, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:12}}>
            <div style={{width:36, height:36, borderRadius:9999, background:T.teal500, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}><PackageCheck size={18} color={T.white}/></div>
            <div style={{flex:1, textAlign:"left"}}>
              <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900}}>입고 확인이 필요합니다</p>
              <p style={{margin:"2px 0 0", fontSize:12, color:T.teal500, fontWeight:600}}>배송 완료된 품목 {waitingCount}건 — 재고에 등록해주세요</p>
            </div>
            <ChevronRight size={18} color={T.teal500}/>
          </button>
        </div>
      )}

      {/* 주의 품목 */}
      {alertItems.length>0 && (
        <div style={{padding:"0 16px 16px"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
            <SecTitle>주의 필요 품목</SecTitle>
            <button onClick={()=>setTab("inventory")} style={{fontSize:13, color:T.blue500, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600, paddingBottom:10}}>전체보기</button>
          </div>
          <Card>
            {alertItems.slice(0,3).map((item,i)=>{
              const sc  = ST[getStatus(item)];
              const ao  = getActiveOrder(orders, item.id);
              return (
                <div key={item.id}>
                  <button onClick={()=>openModal("in",item)} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit"}}>
                    <div style={{width:36, height:36, borderRadius:10, background:sc.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}><AlertTriangle size={18} color={sc.text}/></div>
                    <div style={{flex:1, textAlign:"left"}}>
                      <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{item.name}</p>
                      <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{item.current_qty}{item.unit} / 최소 {item.min_qty}{item.unit}</p>
                    </div>
                    <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4}}>
                      <Chip label={sc.label} color={sc.text} bg={sc.bg} border={sc.border}/>
                      {ao&&<Chip label={ORDER_ST[ao.status].short} color={ORDER_ST[ao.status].text} bg={ORDER_ST[ao.status].bg} border={ORDER_ST[ao.status].border}/>}
                    </div>
                  </button>
                  {i<alertItems.slice(0,3).length-1&&<Divider/>}
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* 내 발주 현황 */}
      {myOrders.length>0 && (
        <div style={{padding:"0 16px 16px"}}>
          <SecTitle>내 발주 현황</SecTitle>
          <Card>
            {myOrders.map((o,i)=>{
              const item = items.find(it=>it.id===o.item_id);
              const os   = ORDER_ST[o.status];
              return (
                <div key={o.id}>
                  <div style={{display:"flex", alignItems:"center", gap:12, padding:"14px 16px"}}>
                    <div style={{width:36, height:36, borderRadius:10, background:os.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}><ShoppingCart size={16} color={os.text}/></div>
                    <div style={{flex:1, minWidth:0}}>
                      <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name}</p>
                      <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{o.qty}{item?.unit} · {fmtDate(o.requested_at)}</p>
                    </div>
                    <Chip label={os.label} color={os.text} bg={os.bg} border={os.border}/>
                  </div>
                  {i<myOrders.length-1&&<Divider/>}
                </div>
              );
            })}
          </Card>
        </div>
      )}

      <div style={{padding:"0 16px 24px"}}>
        <SecTitle>최근 입출고</SecTitle>
        <Card>
          {txs.slice(0,4).map((tx,i)=>{
            const item = items.find(it=>it.id===tx.item_id);
            return (
              <div key={tx.id}>
                <div style={{display:"flex", alignItems:"center", gap:12, padding:"14px 16px"}}>
                  <div style={{width:36, height:36, borderRadius:10, background:tx.type==="in"?T.blue50:T.red50, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    {tx.type==="in"?<ArrowDownToLine size={16} color={T.blue500}/>:<ArrowUpFromLine size={16} color={T.red500}/>}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name}</p>
                    <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{tx.user} · {fmtDate(tx.created_at)}</p>
                  </div>
                  <span style={{fontSize:15, fontWeight:700, color:tx.type==="in"?T.blue500:T.red500, fontVariantNumeric:"tabular-nums"}}>{tx.type==="in"?"+":"-"}{tx.qty}</span>
                </div>
                {i<3&&<Divider/>}
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  INVENTORY SCREEN
// ════════════════════════════════════════════════════
function InventoryScreen({items, search, setSearch, cat, setCat, openModal, items_all, setItems, orders, showToast, currentUser, confirmReceipt}) {
  const [showAdd,  setShowAdd]  = useState(false);
  const [editItem, setEditItem] = useState(null);

  return (
    <div>
      <div style={{padding:"12px 16px 0"}}>
        <div style={{position:"relative", marginBottom:12}}>
          <div style={{position:"absolute", left:14, top:"50%", transform:"translateY(-50%)"}}><Search size={16} color={T.grey400}/></div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="품목명 검색"
            style={{width:"100%", padding:"12px 14px 12px 40px", borderRadius:12, border:`1px solid rgba(2,32,71,0.08)`, background:"rgba(0,23,51,0.02)", fontSize:15, color:T.grey800, fontFamily:font, outline:"none", boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex", gap:8, overflowX:"auto", paddingBottom:12}}>
          {[{id:0,name:"전체"},...CATEGORIES].map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} style={{flexShrink:0, padding:"7px 16px", borderRadius:9999, border:"none", cursor:"pointer", fontFamily:font, fontSize:13, fontWeight:600, background:cat===c.id?T.blue500:T.white, color:cat===c.id?T.white:T.grey700, boxShadow:cat===c.id?"none":CS, transition:"all 150ms"}}>{c.name}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"0 16px 8px"}}>
        <button onClick={()=>setShowAdd(true)} style={{width:"100%", padding:"13px 0", borderRadius:9999, border:`1.5px dashed ${T.blue500}`, background:T.blue50, color:T.blue500, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
          <Plus size={16}/> 품목 추가
        </button>
      </div>

      <div style={{padding:"8px 16px 24px"}}>
        <Card>
          {items.map((item,i) => {
            const st       = getStatus(item);
            const sc       = ST[st];
            const days     = daysUntil(item.expiry);
            const ao       = getActiveOrder(orders, item.id);  // 활성 발주 정보
            const isOrdered = ao?.status === "ordered"; // 입고 대기 중

            return (
              <div key={item.id}>
                <div style={{padding:"14px 16px"}}>
                  {/* 품목명 + 상태 뱃지 행 */}
                  <div style={{display:"flex", alignItems:"flex-start", gap:10, marginBottom:8}}>
                    <div style={{width:6, height:6, borderRadius:9999, background:catColor(item.category_id), flexShrink:0, marginTop:6}}/>
                    <div style={{flex:1}}>
                      <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{item.name}</p>
                      <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>{catName(item.category_id)} · {item.location}</p>
                    </div>
                    <div style={{display:"flex", alignItems:"center", gap:6, flexShrink:0}}>
                      <button onClick={()=>setEditItem(item)} style={{border:"none", background:T.grey100, borderRadius:8, padding:6, cursor:"pointer", display:"flex", alignItems:"center"}}><Edit2 size={13} color={T.grey600}/></button>
                    </div>
                  </div>

                  {/* ★ 재고 상태 + 발주 상태 칩 라인 */}
                  <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:10, flexWrap:"wrap"}}>
                    <Chip label={sc.label} color={sc.text} bg={sc.bg} border={sc.border}/>
                    {ao && (
                      <Chip
                        label={ORDER_ST[ao.status].label}
                        color={ORDER_ST[ao.status].text}
                        bg={ORDER_ST[ao.status].bg}
                        border={ORDER_ST[ao.status].border}
                      />
                    )}
                    {!ao && st!=="ok" && (
                      <Chip label="발주미요청" color={T.grey500} bg={T.grey100} border={T.grey200}/>
                    )}
                  </div>

                  {/* 재고 바 */}
                  <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:days&&days<=30?8:10}}>
                    <div style={{flex:1, height:4, background:T.grey100, borderRadius:9999, overflow:"hidden"}}>
                      <div style={{height:"100%", borderRadius:9999, background:st==="ok"?T.green500:st==="warning"?T.orange500:T.red500, width:`${Math.min(100,(item.current_qty/(item.min_qty*2))*100)}%`, transition:"width 250ms"}}/>
                    </div>
                    <span style={{fontSize:14, fontWeight:700, color:T.grey900, flexShrink:0, fontVariantNumeric:"tabular-nums"}}>{item.current_qty}<span style={{fontSize:11, color:T.grey400, fontWeight:400}}>{item.unit}</span></span>
                  </div>

                  {/* 유통기한 경고 */}
                  {days!==null&&days<=30&&(
                    <div style={{background:days<=7?T.red50:T.orange50, borderRadius:8, padding:"5px 10px", marginBottom:10, display:"flex", alignItems:"center", gap:6}}>
                      <Clock size={12} color={days<=7?T.red500:T.orange500}/>
                      <span style={{fontSize:12, color:days<=7?T.red500:T.orange500, fontWeight:600}}>유통기한 {days<=0?"만료":`${days}일 후 만료`} ({item.expiry})</span>
                    </div>
                  )}

                  {/* ★ 입고 대기 중일 때 → 입고 확인 강조 배너 */}
                  {isOrdered && (
                    <div style={{background:T.teal50, border:`1.5px solid ${T.teal500}44`, borderRadius:12, padding:"10px 12px", marginBottom:10}}>
                      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
                        <PackageCheck size={16} color={T.teal500}/>
                        <p style={{margin:0, fontSize:13, fontWeight:700, color:T.teal500}}>배송 완료 예정 — 입고 확인 필요</p>
                      </div>
                      <p style={{margin:"0 0 8px", fontSize:12, color:T.grey600}}>
                        발주 수량 <span style={{fontWeight:700, color:T.grey900}}>{ao.qty}{item.unit}</span> · 요청자: {ao.requested_by}
                      </p>
                      <button
                        onClick={()=>openModal("confirm_receipt", item)}
                        style={{width:"100%", padding:"10px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:6}}
                      >
                        <PackageCheck size={15}/> 실 입고 확인하기
                      </button>
                    </div>
                  )}

                  {/* 기본 버튼: 입고 / 출고 / 발주요청 */}
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1.2fr", gap:6}}>
                    <button onClick={()=>openModal("in",item)} style={{padding:"9px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:font}}>입고</button>
                    <button onClick={()=>openModal("out",item)} style={{padding:"9px 0", borderRadius:9999, border:"none", background:T.red500, color:T.white, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:font}}>출고</button>
                    <button
                      onClick={()=>openModal("order_req",item)}
                      disabled={!!ao}
                      style={{padding:"9px 0", borderRadius:9999, border:"none", background:ao?T.grey100:T.blue50, color:ao?T.grey400:T.blue500, fontSize:13, fontWeight:600, cursor:ao?"not-allowed":"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:4}}
                    >
                      <ShoppingCart size={13}/> {ao?"처리중":"발주"}
                    </button>
                  </div>
                </div>
                {i<items.length-1&&<Divider/>}
              </div>
            );
          })}
        </Card>
      </div>

      {showAdd&&(
        <div style={{position:"absolute", inset:0, background:"rgba(2,9,19,0.5)", zIndex:99, display:"flex", justifyContent:"center", alignItems:"flex-end"}} onClick={()=>setShowAdd(false)}>
          <div style={{background:T.white, borderRadius:"16px 16px 0 0", width:"100%", paddingBottom:32, boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"center", padding:"12px 0 0"}}><div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/></div>
            <AddItemModal setItems={setItems} onClose={()=>setShowAdd(false)} showToast={showToast}/>
          </div>
        </div>
      )}
      {editItem&&(
        <div style={{position:"absolute", inset:0, background:"rgba(2,9,19,0.5)", zIndex:99, display:"flex", justifyContent:"center", alignItems:"flex-end"}} onClick={()=>setEditItem(null)}>
          <div style={{background:T.white, borderRadius:"16px 16px 0 0", width:"100%", paddingBottom:32, boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex", justifyContent:"center", padding:"12px 0 0"}}><div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/></div>
            <EditItemModal item={editItem} setItems={setItems} onClose={()=>setEditItem(null)} showToast={showToast}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 시트: 입고 확인 ──────────────────────────────────
function ReceiptConfirmSheet({item, orders, currentUser, onConfirm, onClose}) {
  const order = orders.find(o=>o.item_id===item.id&&o.status==="ordered");
  const [qty,  setQty]  = useState(order?.qty || 1);
  const [note, setNote] = useState("");
  if (!order) return null;
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h2 style={{margin:0, fontSize:18, fontWeight:700, color:T.grey900}}>실 입고 확인</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={20} color={T.grey500}/></button>
      </div>

      {/* 발주 정보 */}
      <div style={{background:T.teal50, borderRadius:12, padding:"12px 14px", marginBottom:20, border:`1px solid ${T.teal500}33`}}>
        <p style={{margin:0, fontSize:13, color:T.grey600, marginBottom:4}}>발주 정보</p>
        <p style={{margin:0, fontSize:15, fontWeight:700, color:T.grey900}}>{item.name}</p>
        <div style={{display:"flex", gap:12, marginTop:6}}>
          <span style={{fontSize:12, color:T.grey600}}>발주 수량 <span style={{fontWeight:700, color:T.teal500}}>{order.qty}{item.unit}</span></span>
          <span style={{fontSize:12, color:T.grey600}}>요청자 <span style={{fontWeight:600, color:T.grey800}}>{order.requested_by}</span></span>
        </div>
      </div>

      {/* 실 수령 수량 — 발주량과 다를 수 있음 */}
      <p style={{margin:"0 0 6px", fontSize:13, fontWeight:600, color:T.grey700}}>실제 수령한 수량</p>
      <p style={{margin:"0 0 10px", fontSize:12, color:T.grey500}}>실제로 받은 수량을 확인 후 입력해주세요</p>
      <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:20}}>
        <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:44, height:44, borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
          <Minus size={18} color={T.grey700}/>
        </button>
        <div style={{flex:1, textAlign:"center"}}>
          <p style={{margin:0, fontSize:32, fontWeight:700, color:T.grey900, fontVariantNumeric:"tabular-nums"}}>{qty}</p>
          {qty !== order.qty && <p style={{margin:"2px 0 0", fontSize:12, color:T.orange500, fontWeight:600}}>발주량({order.qty})과 다릅니다</p>}
        </div>
        <button onClick={()=>setQty(q=>q+1)} style={{width:44, height:44, borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
          <Plus size={18} color={T.white}/>
        </button>
      </div>
      <p style={{margin:"0 0 8px", fontSize:13, fontWeight:600, color:T.grey700}}>특이사항 (선택)</p>
      <Inp value={note} onChange={e=>setNote(e.target.value)} placeholder="예: 1박스 파손, 일부 수령" style={{marginBottom:20}}/>
      <div style={{background:T.grey50, borderRadius:10, padding:"10px 14px", marginBottom:20, display:"flex", alignItems:"center", gap:8}}>
        <CircleDot size={14} color={T.green500}/>
        <p style={{margin:0, fontSize:12, color:T.grey600}}>확인 완료 시 <span style={{fontWeight:700, color:T.grey900}}>{item.current_qty} + {qty} = {item.current_qty+qty}{item.unit}</span>으로 재고가 업데이트됩니다</p>
      </div>
      <button onClick={()=>onConfirm(order.id, qty, note)} style={{width:"100%", padding:"16px 0", borderRadius:9999, border:"none", background:T.blue500, color:T.white, fontSize:16, fontWeight:600, cursor:"pointer", fontFamily:font}}>
        입고 확인 완료
      </button>
    </div>
  );
}

// ─── 시트: 발주 요청 ──────────────────────────────────
function OrderRequestSheet({item, currentUser, onSubmit, onClose, orders}) {
  const [qty,  setQty]  = useState(Math.max(1, item.min_qty - item.current_qty));
  const [note, setNote] = useState("");
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h2 style={{margin:0, fontSize:18, fontWeight:700, color:T.grey900}}>발주 요청</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={20} color={T.grey500}/></button>
      </div>
      <div style={{background:T.teal50, borderRadius:12, padding:"12px 14px", marginBottom:20, border:`1px solid ${T.teal500}22`}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
          <div style={{width:8, height:8, borderRadius:9999, background:catColor(item.category_id)}}/>
          <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900}}>{item.name}</p>
        </div>
        <p style={{margin:0, fontSize:13, color:T.grey600}}>
          현재 재고 <span style={{fontWeight:700, color:ST[getStatus(item)].text}}>{item.current_qty}{item.unit}</span>
          <span style={{color:T.grey400}}> · 최소 {item.min_qty}{item.unit}</span>
        </p>
      </div>
      <p style={{margin:"0 0 8px", fontSize:13, fontWeight:600, color:T.grey700}}>요청 수량</p>
      <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:20}}>
        <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:44, height:44, borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}><Minus size={18} color={T.grey700}/></button>
        <p style={{flex:1, textAlign:"center", margin:0, fontSize:32, fontWeight:700, color:T.grey900, fontVariantNumeric:"tabular-nums"}}>{qty}</p>
        <button onClick={()=>setQty(q=>q+1)} style={{width:44, height:44, borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}><Plus size={18} color={T.white}/></button>
      </div>
      <p style={{margin:"0 0 8px", fontSize:13, fontWeight:600, color:T.grey700}}>요청 사유 (선택)</p>
      <Inp value={note} onChange={e=>setNote(e.target.value)} placeholder="예: 재고 급하게 필요합니다" style={{marginBottom:16}}/>
      <div style={{display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:T.grey50, borderRadius:12, marginBottom:20, border:`1px solid ${T.grey200}`}}>
        <Avatar name={currentUser.name} role={currentUser.role} size={28}/>
        <p style={{margin:0, fontSize:13, color:T.grey600}}><span style={{fontWeight:600, color:T.grey900}}>{currentUser.name}</span> · 승인 후 배송 대기 → 직접 입고 확인</p>
      </div>
      <button onClick={()=>onSubmit(item,qty,note)} style={{width:"100%", padding:"16px 0", borderRadius:9999, border:"none", cursor:"pointer", fontFamily:font, fontSize:16, fontWeight:600, color:T.white, background:T.blue500}}>
        발주 요청하기
      </button>
    </div>
  );
}

// ─── 시트: 품목 선택 / 입출고 ─────────────────────────
function ItemPickerSheet({items, setSelItem, onClose}) {
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h2 style={{margin:0, fontSize:18, fontWeight:700, color:T.grey900}}>품목 선택</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={20} color={T.grey500}/></button>
      </div>
      {items.map((item,i) => (
        <div key={item.id}>
          <button onClick={()=>setSelItem(item)} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 0", background:"none", border:"none", cursor:"pointer", fontFamily:font}}>
            <div style={{width:8, height:8, borderRadius:9999, background:catColor(item.category_id), flexShrink:0}}/>
            <div style={{flex:1, textAlign:"left"}}>
              <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{item.name}</p>
              <p style={{margin:0, fontSize:12, color:T.grey500}}>{item.current_qty}{item.unit}</p>
            </div>
            <ChevronRight size={16} color={T.grey400}/>
          </button>
          {i<items.length-1&&<Divider/>}
        </div>
      ))}
    </div>
  );
}
function InOutSheet({modal, selItem, form, setForm, onCommit, onClose}) {
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h2 style={{margin:0, fontSize:18, fontWeight:700, color:T.grey900}}>{modal==="in"?"입고 등록":"출고 등록"}</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={20} color={T.grey500}/></button>
      </div>
      <div style={{background:T.grey50, borderRadius:12, padding:"12px 14px", marginBottom:20, border:`1px solid ${T.grey200}`}}>
        <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{selItem.name}</p>
        <p style={{margin:"4px 0 0", fontSize:13, color:T.grey600}}>현재 재고 <span style={{fontWeight:700, color:T.blue500}}>{selItem.current_qty}{selItem.unit}</span></p>
      </div>
      <p style={{margin:"0 0 8px", fontSize:13, fontWeight:600, color:T.grey700}}>수량</p>
      <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:20}}>
        <button onClick={()=>setForm(f=>({...f,qty:Math.max(1,f.qty-1)}))} style={{width:44,height:44,borderRadius:9999,border:`1.5px solid ${T.grey200}`,background:T.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Minus size={18} color={T.grey700}/></button>
        <p style={{flex:1,textAlign:"center",margin:0,fontSize:32,fontWeight:700,color:T.grey900,fontVariantNumeric:"tabular-nums"}}>{form.qty}</p>
        <button onClick={()=>setForm(f=>({...f,qty:f.qty+1}))} style={{width:44,height:44,borderRadius:9999,border:"none",background:T.blue500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={18} color={T.white}/></button>
      </div>
      <p style={{margin:"0 0 8px", fontSize:13, fontWeight:600, color:T.grey700}}>메모 (선택)</p>
      <Inp value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="예: 진료실 보충" style={{marginBottom:20}}/>
      <button onClick={onCommit} style={{width:"100%",padding:"16px 0",borderRadius:9999,border:"none",cursor:"pointer",fontFamily:font,fontSize:16,fontWeight:600,color:T.white,background:modal==="out"?T.red500:T.blue500}}>
        {modal==="in"?"입고 완료":"출고 완료"}
      </button>
    </div>
  );
}

// ─── 품목 추가/수정 ───────────────────────────────────
function AddItemModal({setItems, onClose, showToast}) {
  const [name,setName]=useState(""); const [catId,setCatId]=useState(1); const [unit,setUnit]=useState("개"); const [minQty,setMinQty]=useState(5); const [loc,setLoc]=useState("");
  const submit=()=>{if(!name.trim())return;setItems(p=>[...p,{id:`i${Date.now()}`,name:name.trim(),category_id:catId,unit,current_qty:0,min_qty:minQty,location:loc}]);showToast(`${name} 품목 추가 완료`);onClose();};
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:T.grey900}}>품목 추가</h2><button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer"}}><X size={20} color={T.grey500}/></button></div>
      <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>품목명</p><Inp value={name} onChange={e=>setName(e.target.value)} placeholder="예: 라텍스 장갑 (L)" style={{marginBottom:12}}/>
      <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:T.grey700}}>카테고리</p>
      <div style={{display:"flex",gap:8,marginBottom:12}}>{CATEGORIES.map(c=><button key={c.id} onClick={()=>setCatId(c.id)} style={{flex:1,padding:"9px 0",borderRadius:9999,border:"none",cursor:"pointer",fontFamily:font,fontSize:12,fontWeight:600,background:catId===c.id?c.color:T.grey100,color:catId===c.id?T.white:T.grey700}}>{c.name}</button>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>단위</p><Inp value={unit} onChange={e=>setUnit(e.target.value)} placeholder="개/박스"/></div>
        <div><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>최소수량</p><Inp value={minQty} onChange={e=>setMinQty(parseInt(e.target.value)||1)} type="number"/></div>
      </div>
      <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>보관 위치</p><Inp value={loc} onChange={e=>setLoc(e.target.value)} placeholder="예: 창고 A-1" style={{marginBottom:16}}/>
      <button onClick={submit} style={{width:"100%",padding:"16px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:font}}>추가 완료</button>
    </div>
  );
}
function EditItemModal({item, setItems, onClose, showToast}) {
  const [name,setName]=useState(item.name); const [catId,setCatId]=useState(item.category_id); const [unit,setUnit]=useState(item.unit); const [minQty,setMinQty]=useState(item.min_qty); const [loc,setLoc]=useState(item.location||"");
  const submit=()=>{setItems(p=>p.map(i=>i.id===item.id?{...i,name,category_id:catId,unit,min_qty:minQty,location:loc}:i));showToast(`${name} 수정 완료`);onClose();};
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{margin:0,fontSize:18,fontWeight:700,color:T.grey900}}>품목 수정</h2><button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer"}}><X size={20} color={T.grey500}/></button></div>
      <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>품목명</p><Inp value={name} onChange={e=>setName(e.target.value)} style={{marginBottom:12}}/>
      <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:T.grey700}}>카테고리</p>
      <div style={{display:"flex",gap:8,marginBottom:12}}>{CATEGORIES.map(c=><button key={c.id} onClick={()=>setCatId(c.id)} style={{flex:1,padding:"9px 0",borderRadius:9999,border:"none",cursor:"pointer",fontFamily:font,fontSize:12,fontWeight:600,background:catId===c.id?c.color:T.grey100,color:catId===c.id?T.white:T.grey700}}>{c.name}</button>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>단위</p><Inp value={unit} onChange={e=>setUnit(e.target.value)}/></div>
        <div><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>최소수량</p><Inp value={minQty} onChange={e=>setMinQty(parseInt(e.target.value)||1)} type="number"/></div>
      </div>
      <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>보관 위치</p><Inp value={loc} onChange={e=>setLoc(e.target.value)} style={{marginBottom:16}}/>
      <button onClick={submit} style={{width:"100%",padding:"16px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:font}}>수정 완료</button>
    </div>
  );
}

// ─── 시트: 수술 준비 품목 편집 ────────────────────────
function EditSurgeryItemsSheet({initialItems, allItems, onSave, onClose, title}) {
  const [draft, setDraft] = useState(initialItems.map(r=>({item_id:r.item_id, qty:r.qty})));
  const [picking, setPicking] = useState(false);
  const selectedIds = new Set(draft.map(r=>r.item_id));
  const candidates  = allItems.filter(i=>!selectedIds.has(i.id));

  const updateQty = (item_id, qty) =>
    setDraft(p=>p.map(r=>r.item_id===item_id?{...r, qty:Math.max(1, parseInt(qty)||1)}:r));
  const removeRow = (item_id) =>
    setDraft(p=>p.filter(r=>r.item_id!==item_id));
  const addRow = (item_id) => {
    setDraft(p=>[...p, {item_id, qty:1}]);
    setPicking(false);
  };

  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
        <h2 style={{margin:0, fontSize:18, fontWeight:700, color:T.grey900}}>준비 품목 편집</h2>
        <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer"}}><X size={20} color={T.grey500}/></button>
      </div>
      {title && <p style={{margin:"0 0 14px", fontSize:13, color:T.grey500}}>{title}</p>}

      {!picking && (
        <>
          <div style={{background:T.grey50, borderRadius:12, padding:"8px 4px", marginBottom:12}}>
            {draft.length===0 ? (
              <p style={{margin:0, padding:"18px 12px", fontSize:13, color:T.grey500, textAlign:"center"}}>품목이 비어 있어요. 아래에서 추가하세요.</p>
            ) : draft.map((r,i)=>{
              const item = allItems.find(it=>it.id===r.item_id);
              const enough = item && item.current_qty>=r.qty;
              return (
                <div key={r.item_id} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderTop:i===0?"none":`1px solid ${T.grey100}`}}>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name||"삭제된 품목"}</p>
                    <p style={{margin:"2px 0 0", fontSize:11, color:enough?T.grey500:T.red500}}>현재 {item?.current_qty??0}{item?.unit||""} {!enough&&item?"· 부족":""}</p>
                  </div>
                  <div style={{display:"flex", alignItems:"center", gap:6}}>
                    <button onClick={()=>updateQty(r.item_id, r.qty-1)} style={{width:28, height:28, borderRadius:9999, border:`1px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}><Minus size={14} color={T.grey700}/></button>
                    <input value={r.qty} onChange={e=>updateQty(r.item_id, e.target.value)} type="number" min={1}
                      style={{width:44, textAlign:"center", padding:"6px 0", borderRadius:8, border:`1px solid ${T.grey200}`, background:T.white, fontSize:14, fontWeight:700, color:T.grey900, fontFamily:font, outline:"none"}}/>
                    <button onClick={()=>updateQty(r.item_id, r.qty+1)} style={{width:28, height:28, borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}><Plus size={14} color={T.white}/></button>
                  </div>
                  <span style={{fontSize:11, color:T.grey400, width:24, textAlign:"right"}}>{item?.unit||""}</span>
                  <button onClick={()=>removeRow(r.item_id)} style={{border:"none", background:"none", cursor:"pointer", padding:4}}><X size={16} color={T.grey400}/></button>
                </div>
              );
            })}
          </div>
          <button onClick={()=>setPicking(true)} disabled={candidates.length===0}
            style={{width:"100%", padding:"12px 0", borderRadius:12, border:`1.5px dashed ${T.grey300}`, background:T.white, cursor:candidates.length===0?"default":"pointer", fontFamily:font, fontSize:14, fontWeight:600, color:candidates.length===0?T.grey400:T.blue500, marginBottom:16, display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
            <Plus size={16}/> 품목 추가
          </button>
          <div style={{display:"flex", gap:10, paddingBottom:8}}>
            <button onClick={onClose} style={{flex:1, padding:"14px 0", borderRadius:9999, border:`1px solid ${T.grey200}`, background:T.white, cursor:"pointer", fontFamily:font, fontSize:15, fontWeight:600, color:T.grey700}}>취소</button>
            <button onClick={()=>{onSave(draft); onClose();}} style={{flex:2, padding:"14px 0", borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", fontFamily:font, fontSize:15, fontWeight:600, color:T.white}}>저장</button>
          </div>
        </>
      )}

      {picking && (
        <>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <p style={{margin:0, fontSize:13, fontWeight:600, color:T.grey700}}>추가할 품목 선택</p>
            <button onClick={()=>setPicking(false)} style={{border:"none", background:"none", cursor:"pointer", fontSize:13, color:T.grey500, fontFamily:font}}>← 뒤로</button>
          </div>
          {candidates.length===0 ? (
            <p style={{margin:0, padding:"24px 0", fontSize:13, color:T.grey500, textAlign:"center"}}>모든 품목이 이미 추가되어 있어요.</p>
          ) : candidates.map((item,i)=>(
            <div key={item.id}>
              <button onClick={()=>addRow(item.id)} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 0", background:"none", border:"none", cursor:"pointer", fontFamily:font}}>
                <div style={{width:8, height:8, borderRadius:9999, background:catColor(item.category_id), flexShrink:0}}/>
                <div style={{flex:1, textAlign:"left"}}>
                  <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{item.name}</p>
                  <p style={{margin:0, fontSize:12, color:T.grey500}}>현재 {item.current_qty}{item.unit}</p>
                </div>
                <Plus size={16} color={T.blue500}/>
              </button>
              {i<candidates.length-1&&<Divider/>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
//  INOUT / ALERTS / ADMIN
// ════════════════════════════════════════════════════
function InOutScreen({items, txs, openModal}) {
  return (
    <div>
      <div style={{padding:"16px 16px 0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[{label:"입고 등록",sub:"재고가 들어왔어요",Icon:ArrowDownToLine,iconBg:T.blue50,iconColor:T.blue500,type:"in"},{label:"출고 등록",sub:"재고를 사용했어요",Icon:ArrowUpFromLine,iconBg:T.red50,iconColor:T.red500,type:"out"}].map(a=>(
            <button key={a.type} onClick={()=>openModal(a.type)} style={{padding:"20px 16px",borderRadius:16,border:`1px solid ${T.grey200}`,background:T.white,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:10,boxShadow:CS}}>
              <div style={{width:48,height:48,borderRadius:9999,background:a.iconBg,display:"flex",alignItems:"center",justifyContent:"center"}}><a.Icon size={24} color={a.iconColor}/></div>
              <div style={{textAlign:"center"}}><p style={{margin:0,fontSize:15,fontWeight:700,color:T.grey900}}>{a.label}</p><p style={{margin:"2px 0 0",fontSize:12,color:T.grey500}}>{a.sub}</p></div>
            </button>
          ))}
        </div>
        <SecTitle>입출고 이력</SecTitle>
        <Card style={{marginBottom:24}}>
          {txs.map((tx,i)=>{const item=items.find(it=>it.id===tx.item_id);return(
            <div key={tx.id}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px"}}>
                <div style={{width:36,height:36,borderRadius:10,background:tx.type==="in"?T.blue50:T.red50,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{tx.type==="in"?<ArrowDownToLine size={16} color={T.blue500}/>:<ArrowUpFromLine size={16} color={T.red500}/>}</div>
                <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:14,fontWeight:600,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item?.name}</p><p style={{margin:"2px 0 0",fontSize:12,color:T.grey500}}>{tx.note||"-"} · {tx.user}</p></div>
                <div style={{textAlign:"right",flexShrink:0}}><p style={{margin:0,fontSize:15,fontWeight:700,color:tx.type==="in"?T.blue500:T.red500,fontVariantNumeric:"tabular-nums"}}>{tx.type==="in"?"+":"-"}{tx.qty}</p><p style={{margin:0,fontSize:11,color:T.grey400}}>{fmtDate(tx.created_at)}</p></div>
              </div>
              {i<txs.length-1&&<Divider/>}
            </div>
          );})}
        </Card>
      </div>
    </div>
  );
}

function AlertsScreen({notifs, setNotifs}) {
  const TM = {
    low_stock:     {bg:T.orange50, color:T.orange500, Icon:AlertTriangle},
    expiry:        {bg:T.red50,    color:T.red500,    Icon:Clock},
    order_req:     {bg:T.orange50, color:T.orange500, Icon:ShoppingCart},
    ordered:       {bg:T.teal50,   color:T.teal500,   Icon:Truck},
    order_rejected:{bg:T.red50,    color:T.red500,    Icon:XCircle},
    received:      {bg:T.green50,  color:T.green500,  Icon:PackageCheck},
    surgery_today: {bg:T.blue50,   color:T.blue500,   Icon:CalendarDays},
    surgery_ready: {bg:T.green50,  color:T.green500,  Icon:ClipboardCheck},
    surgery_reminder:{bg:T.orange50,color:T.orange500,Icon:Clock},
  };
  const unread=notifs.filter(n=>!n.is_read).length;
  return (
    <div style={{padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <p style={{margin:0,fontSize:13,color:T.grey500}}>미확인 <span style={{fontWeight:700,color:T.red500}}>{unread}건</span></p>
        <button onClick={()=>setNotifs(p=>p.map(n=>({...n,is_read:true})))} style={{fontSize:13,color:T.blue500,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>모두 읽음</button>
      </div>
      <Card>
        {notifs.map((n,i)=>{const m=TM[n.type]||TM.order_req;return(
          <div key={n.id}>
            <button onClick={()=>setNotifs(p=>p.map(x=>x.id===n.id?{...x,is_read:true}:x))} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",opacity:n.is_read?0.55:1}}>
              <div style={{width:36,height:36,borderRadius:10,background:m.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:m.color}}><m.Icon size={18}/></div>
              <div style={{flex:1,textAlign:"left"}}><p style={{margin:0,fontSize:14,fontWeight:n.is_read?400:600,color:T.grey900,lineHeight:1.5}}>{n.message}</p><p style={{margin:"2px 0 0",fontSize:12,color:T.grey500}}>{n.sub}</p><p style={{margin:"4px 0 0",fontSize:11,color:T.grey400}}>{fmtFull(n.created_at)}</p></div>
              {!n.is_read&&<div style={{width:8,height:8,borderRadius:9999,background:T.red500,flexShrink:0,marginTop:4}}/>}
            </button>
            {i<notifs.length-1&&<Divider/>}
          </div>
        );})}
      </Card>
    </div>
  );
}

function AnalyticsTab({items, txs, orders}) {
  const latestTx = txs.reduce((latest, tx) => !latest || new Date(tx.created_at) > new Date(latest.created_at) ? tx : latest, null);
  const now = latestTx ? new Date(latestTx.created_at) : new Date();
  const currentMonth = now.toISOString().slice(0,7);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const prevMonth = prevMonthDate.toISOString().slice(0,7);
  const outTxs = txs.filter(tx=>tx.type==="out");
  const currentOut = outTxs.filter(tx=>monthKey(tx.created_at)===currentMonth);
  const prevOut = outTxs.filter(tx=>monthKey(tx.created_at)===prevMonth);
  const currentTotal = currentOut.reduce((sum,tx)=>sum+tx.qty,0);
  const prevTotal = prevOut.reduce((sum,tx)=>sum+tx.qty,0);
  const delta = currentTotal - prevTotal;
  const activeOrders = orders.filter(o=>o.status==="pending"||o.status==="ordered").length;
  const lowStock = items.filter(i=>getStatus(i)!=="ok").length;

  const byItem = items.map(item => {
    const used = currentOut.filter(tx=>tx.item_id===item.id).reduce((sum,tx)=>sum+tx.qty,0);
    const threeMonthUsed = outTxs.filter(tx=>tx.item_id===item.id).reduce((sum,tx)=>sum+tx.qty,0);
    const monthlyAvg = Math.max(0.1, threeMonthUsed / 4);
    const expectedDays = Math.round((item.current_qty / monthlyAvg) * 30);
    return {...item, used, expectedDays};
  }).sort((a,b)=>b.used-a.used);
  const maxUsed = Math.max(1, ...byItem.map(i=>i.used));

  const byCat = CATEGORIES.map(cat => {
    const catItems = items.filter(i=>i.category_id===cat.id).map(i=>i.id);
    const used = currentOut.filter(tx=>catItems.includes(tx.item_id)).reduce((sum,tx)=>sum+tx.qty,0);
    return {...cat, used};
  }).filter(c=>c.used>0);

  return (
    <div>
      <Card style={{padding:20, marginBottom:16}}>
        <p style={{margin:"0 0 8px", fontSize:14, fontWeight:400, color:T.grey500}}>이번 달 출고량</p>
        <div style={{display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:12}}>
          <p style={{margin:0, fontSize:32, lineHeight:"40px", fontWeight:700, color:T.grey900, fontVariantNumeric:"tabular-nums"}}>{currentTotal}</p>
          <Chip
            label={`${delta>=0?"+":""}${delta} 전월 대비`}
            color={delta>=0?T.red500:T.green500}
            bg={delta>=0?T.red50:T.green50}
            border={delta>=0?T.red50:T.green50}
          />
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:20}}>
          <div style={{background:T.grey50, borderRadius:12, padding:"12px 14px"}}>
            <p style={{margin:"0 0 4px", fontSize:12, color:T.grey500}}>주의 품목</p>
            <p style={{margin:0, fontSize:22, fontWeight:700, color:T.orange500, fontVariantNumeric:"tabular-nums"}}>{lowStock}</p>
          </div>
          <div style={{background:T.grey50, borderRadius:12, padding:"12px 14px"}}>
            <p style={{margin:"0 0 4px", fontSize:12, color:T.grey500}}>진행 발주</p>
            <p style={{margin:0, fontSize:22, fontWeight:700, color:T.blue500, fontVariantNumeric:"tabular-nums"}}>{activeOrders}</p>
          </div>
        </div>
      </Card>

      <SecTitle>많이 사용한 품목</SecTitle>
      <Card style={{marginBottom:16}}>
        {byItem.slice(0,5).map((item,i)=>(
          <div key={item.id}>
            <div style={{padding:"14px 16px"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:8}}>
                <div style={{minWidth:0}}>
                  <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.name}</p>
                  <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>예상 소진 {item.expectedDays}일</p>
                </div>
                <p style={{margin:0, fontSize:16, fontWeight:700, color:T.grey900, fontVariantNumeric:"tabular-nums"}}>{item.used}<span style={{fontSize:12, fontWeight:400, color:T.grey500}}>{item.unit}</span></p>
              </div>
              <div style={{height:6, borderRadius:9999, background:T.grey100, overflow:"hidden"}}>
                <div style={{height:"100%", width:`${pct(item.used,maxUsed)}%`, background:item.used===0?T.grey200:T.blue500, borderRadius:9999}}/>
              </div>
            </div>
            {i<Math.min(5,byItem.length)-1&&<Divider/>}
          </div>
        ))}
      </Card>

      <SecTitle>카테고리별 출고</SecTitle>
      <Card>
        {byCat.length>0 ? byCat.map((cat,i)=>(
          <div key={cat.id}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px"}}>
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <div style={{width:8, height:8, borderRadius:9999, background:cat.color}}/>
                <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{cat.name}</p>
              </div>
              <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900, fontVariantNumeric:"tabular-nums"}}>{cat.used}</p>
            </div>
            {i<byCat.length-1&&<Divider/>}
          </div>
        )) : (
          <p style={{margin:0, padding:"24px 16px", fontSize:14, color:T.grey500}}>이번 달 출고 기록이 아직 없어요.</p>
        )}
      </Card>
    </div>
  );
}

function SurgeryAdminTab({items, surgeries, addSurgery, openItemsEditor, updateSurgeryItems}) {
  const [type, setType] = useState("implant");
  const [title, setTitle] = useState("오전 임플란트 수술");
  const [patient, setPatient] = useState("");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("10:30");
  const [note, setNote] = useState("");
  const preset = SURGERY_PRESETS[type];
  const [draftItems, setDraftItems] = useState(preset.items.map(r=>({...r})));
  const [draftCustomized, setDraftCustomized] = useState(false);
  const sortedSurgeries = [...surgeries].sort((a,b)=>`${a.scheduled_date} ${a.scheduled_time}`.localeCompare(`${b.scheduled_date} ${b.scheduled_time}`));

  // 수술 유형 변경 시 사용자 편집이 없었다면 프리셋으로 동기화
  useEffect(() => {
    if (!draftCustomized) setDraftItems(preset.items.map(r=>({...r})));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const submit = () => {
    addSurgery({type, title:title.trim()||preset.label, patient:patient.trim(), scheduled_date:date, scheduled_time:time, note:note.trim(), required_items:draftItems});
    setTitle(preset.label);
    setPatient("");
    setNote("");
    setDraftItems(preset.items.map(r=>({...r})));
    setDraftCustomized(false);
  };

  const editDraft = () => openItemsEditor(
    draftItems,
    (newItems)=>{ setDraftItems(newItems); setDraftCustomized(true); },
    `${preset.label} · ${title || preset.label}`,
  );
  const resetDraft = () => { setDraftItems(preset.items.map(r=>({...r}))); setDraftCustomized(false); };

  return (
    <>
      <SecTitle>수술 일정 등록</SecTitle>
      <Card style={{padding:16, marginBottom:16}}>
        <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:T.grey700}}>수술 유형</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
          {Object.entries(SURGERY_PRESETS).map(([id,p])=>(
            <button key={id} onClick={()=>{setType(id); setTitle(p.label);}} style={{padding:"9px 0",borderRadius:9999,border:"none",background:type===id?T.blue500:T.grey100,color:type===id?T.white:T.grey700,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:font}}>{p.label}</button>
          ))}
        </div>
        <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>수술명</p>
        <Inp value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 오전 임플란트 수술" style={{marginBottom:10}}/>
        <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>환자명</p>
        <Inp value={patient} onChange={e=>setPatient(e.target.value)} placeholder="예: 홍길동" style={{marginBottom:10}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>날짜</p><Inp value={date} onChange={e=>setDate(e.target.value)} type="date"/></div>
          <div><p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>시간</p><Inp value={time} onChange={e=>setTime(e.target.value)} type="time"/></div>
        </div>
        <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.grey700}}>메모</p>
        <Inp value={note} onChange={e=>setNote(e.target.value)} placeholder="예: 픽스처 사이즈 확인" style={{marginBottom:14}}/>

        <div style={{background:T.grey50,borderRadius:12,padding:"10px 12px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,gap:8}}>
            <p style={{margin:0,fontSize:12,fontWeight:700,color:T.grey700}}>예상 준비 품목{draftCustomized&&<span style={{marginLeft:6,fontSize:11,fontWeight:600,color:T.blue500}}>· 사용자 편집</span>}</p>
            <div style={{display:"flex",gap:8}}>
              {draftCustomized&&<button onClick={resetDraft} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.grey500,fontFamily:font,fontWeight:600}}>기본값</button>}
              <button onClick={editDraft} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:T.blue500,fontFamily:font,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><Edit2 size={12}/>편집</button>
            </div>
          </div>
          {draftItems.length===0 ? (
            <p style={{margin:0,padding:"6px 0",fontSize:12,color:T.grey500}}>품목이 비어 있어요. "편집"으로 추가하세요.</p>
          ) : draftItems.map((req,i)=>{
            const item = items.find(it=>it.id===req.item_id);
            const enough = item && item.current_qty>=req.qty;
            return (
              <div key={req.item_id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:i===0?"0 0 7px":i===draftItems.length-1?"7px 0 0":"7px 0",borderTop:i===0?"none":`1px solid ${T.grey100}`}}>
                <span style={{fontSize:12,color:T.grey700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item?.name||"삭제된 품목"}</span>
                <span style={{fontSize:12,fontWeight:700,color:enough?T.green500:T.red500,whiteSpace:"nowrap"}}>{req.qty}{item?.unit||""}</span>
              </div>
            );
          })}
        </div>
        <button onClick={submit} style={{width:"100%",padding:"14px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:font}}>수술 일정 등록</button>
      </Card>

      <SecTitle>예정 수술</SecTitle>
      <Card>
        {sortedSurgeries.map((s,i)=>(
          <div key={s.id}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px"}}>
              <div style={{width:36,height:36,borderRadius:10,background:s.prep_confirmed?T.green50:T.blue50,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {s.prep_confirmed?<ClipboardCheck size={16} color={T.green500}/>:<CalendarDays size={16} color={T.blue500}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:14,fontWeight:600,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</p>
                <p style={{margin:"2px 0 0",fontSize:12,color:T.grey500}}>{s.scheduled_date} {s.scheduled_time} · {s.patient} · 품목 {s.required_items.length}개</p>
              </div>
              <Chip label={s.prep_confirmed?"준비완료":"준비전"} color={s.prep_confirmed?T.green500:T.orange500} bg={s.prep_confirmed?T.green50:T.orange50} border={T.grey200}/>
              {!s.prep_confirmed&&(
                <button
                  onClick={()=>openItemsEditor(s.required_items, (newItems)=>updateSurgeryItems(s.id, newItems), `${s.scheduled_date} ${s.scheduled_time} · ${s.title}`)}
                  title="품목 편집"
                  style={{border:"none",background:T.grey100,borderRadius:9999,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}
                ><Edit2 size={14} color={T.grey700}/></button>
              )}
            </div>
            {i<sortedSurgeries.length-1&&<Divider/>}
          </div>
        ))}
      </Card>
    </>
  );
}

function AdminScreen({users, setUsers, currentUser, orders, items, txs, surgeries, addSurgery, onLogout, showToast, approveOrder, rejectOrder, openItemsEditor, updateSurgeryItems}) {
  const [adminTab,     setAdminTab]     = useState("orders");
  const [reviewModal,  setReviewModal]  = useState(null);
  const [reviewNote,   setReviewNote]   = useState("");

  const pendingOrders = orders.filter(o=>o.status==="pending");
  const doneOrders    = orders.filter(o=>o.status!=="pending");

  const confirmReview = () => {
    if (!reviewModal) return;
    reviewModal.action==="approved" ? approveOrder(reviewModal.order.id, reviewNote) : rejectOrder(reviewModal.order.id, reviewNote);
    setReviewModal(null); setReviewNote("");
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column"}}>
      {/* 서브탭 */}
      <div style={{background:T.white,borderBottom:`1px solid ${T.grey100}`,padding:"12px 16px"}}>
        <div style={{display:"flex",gap:4,background:T.grey100,borderRadius:12,padding:4}}>
        {[{id:"orders",label:"발주 승인",badge:pendingOrders.length},{id:"surgery",label:"수술 준비"},{id:"analytics",label:"소비 분석"},{id:"staff",label:"직원 관리"}].map(t=>(
          <button key={t.id} onClick={()=>setAdminTab(t.id)} style={{flex:1,padding:"8px 0",border:"none",borderRadius:10,background:adminTab===t.id?T.white:"transparent",boxShadow:adminTab===t.id?"0px 2px 4px rgba(0,0,0,0.06)":"none",cursor:"pointer",fontFamily:font,fontSize:13,fontWeight:adminTab===t.id?700:600,color:adminTab===t.id?T.grey900:T.grey500,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {t.label}{t.badge>0&&<span style={{background:T.red500,color:T.white,borderRadius:9999,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{t.badge}</span>}
          </button>
        ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",background:T.grey50,padding:16}}>

        {adminTab==="orders"&&(
          <>
            {pendingOrders.length>0?(
              <>
                <SecTitle>승인 대기 ({pendingOrders.length}건)</SecTitle>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                  {pendingOrders.map(order=>{
                    const item=items.find(i=>i.id===order.item_id);
                    const st=getStatus(item||{current_qty:0,min_qty:1});
                    return (
                      <Card key={order.id} style={{padding:"14px 16px",border:`1.5px solid ${T.orange500}33`}}>
                        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:12}}>
                          <div style={{width:36,height:36,borderRadius:10,background:T.orange50,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><ShoppingCart size={16} color={T.orange500}/></div>
                          <div style={{flex:1}}>
                            <p style={{margin:0,fontSize:14,fontWeight:700,color:T.grey900}}>{item?.name}</p>
                            <p style={{margin:"2px 0 0",fontSize:12,color:T.grey500}}>요청: <span style={{fontWeight:600,color:T.grey800}}>{order.requested_by}</span> · {fmtFull(order.requested_at)}</p>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}><p style={{margin:0,fontSize:18,fontWeight:700,color:T.orange500,fontVariantNumeric:"tabular-nums"}}>{order.qty}<span style={{fontSize:12,fontWeight:400,color:T.grey500}}>{item?.unit}</span></p></div>
                        </div>
                        <div style={{background:T.grey50,borderRadius:8,padding:"8px 10px",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:6,height:6,borderRadius:9999,background:ST[st].text,flexShrink:0}}/>
                          <span style={{fontSize:12,color:T.grey600}}>현재 재고 <span style={{fontWeight:600,color:ST[st].text}}>{item?.current_qty}{item?.unit}</span><span style={{color:T.grey400}}> · 최소 {item?.min_qty}{item?.unit}</span></span>
                        </div>
                        {order.note&&<div style={{background:T.orange50,borderRadius:8,padding:"8px 10px",marginBottom:12}}><p style={{margin:0,fontSize:12,color:T.orange500}}>"{order.note}"</p></div>}
                        <p style={{margin:"0 0 8px",fontSize:12,color:T.grey500}}>승인 시 발주 완료 상태로 변경 → 직원이 실 입고 확인 후 재고 반영</p>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          <button onClick={()=>{setReviewModal({order,action:"rejected"});setReviewNote("");}} style={{padding:"11px 0",borderRadius:9999,border:`1.5px solid ${T.red500}`,background:T.red50,color:T.red500,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><XCircle size={15}/> 거절</button>
                          <button onClick={()=>{setReviewModal({order,action:"approved"});setReviewNote("");}} style={{padding:"11px 0",borderRadius:9999,border:"none",background:T.blue500,color:T.white,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Truck size={15}/> 발주 승인</button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            ):(
              <div style={{textAlign:"center",padding:"40px 20px"}}>
                <p style={{margin:0,fontSize:16,fontWeight:600,color:T.grey900}}>검토할 발주 요청이 없어요.</p>
                <p style={{margin:"6px 0 0",fontSize:13,color:T.grey500}}>새 요청이 들어오면 이곳에서 승인할 수 있어요.</p>
              </div>
            )}
            {doneOrders.length>0&&(
              <>
                <SecTitle>처리 이력</SecTitle>
                <Card>
                  {doneOrders.map((o,i)=>{
                    const item=items.find(it=>it.id===o.item_id); const os=ORDER_ST[o.status];
                    return (
                      <div key={o.id}>
                        <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",opacity:0.85}}>
                          <div style={{width:32,height:32,borderRadius:8,background:os.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            {o.status==="ordered"?<Truck size={14} color={os.text}/>:o.status==="received"?<PackageCheck size={14} color={os.text}/>:<XCircle size={14} color={os.text}/>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{margin:0,fontSize:13,fontWeight:600,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item?.name}</p>
                            <p style={{margin:"1px 0 0",fontSize:11,color:T.grey500}}>{o.requested_by} 요청 · {o.reviewed_by} 처리</p>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}><Chip label={os.label} color={os.text} bg={os.bg} border={os.border}/><p style={{margin:"4px 0 0",fontSize:11,color:T.grey400}}>{o.qty}{item?.unit}</p></div>
                        </div>
                        {i<doneOrders.length-1&&<Divider/>}
                      </div>
                    );
                  })}
                </Card>
              </>
            )}
          </>
        )}

        {adminTab==="analytics"&&(
          <AnalyticsTab items={items} txs={txs} orders={orders}/>
        )}

        {adminTab==="surgery"&&(
          <SurgeryAdminTab items={items} surgeries={surgeries} addSurgery={addSurgery} openItemsEditor={openItemsEditor} updateSurgeryItems={updateSurgeryItems}/>
        )}

        {adminTab==="staff"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
              {[{label:"총 입출고",value:txs.length,color:T.blue500},{label:"승인 대기",value:orders.filter(o=>o.status==="pending").length,color:T.orange500},{label:"입고 대기",value:orders.filter(o=>o.status==="ordered").length,color:T.teal500}].map(s=>(
                <Card key={s.label} style={{padding:"12px 10px"}}><p style={{margin:"0 0 4px",fontSize:11,color:T.grey500}}>{s.label}</p><p style={{margin:0,fontSize:22,fontWeight:700,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.value}</p></Card>
              ))}
            </div>
            <SecTitle>직원 목록</SecTitle>
            <Card style={{marginBottom:16}}>
              {users.map((u,i)=>{const m=ROLE_META[u.role]; const isMe=u.id===currentUser.id;return(
                <div key={u.id}>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",opacity:u.active?1:0.45}}>
                    <Avatar name={u.name} role={u.role} size={40}/>
                    <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6}}><p style={{margin:0,fontSize:14,fontWeight:600,color:T.grey900}}>{u.name}</p>{isMe&&<span style={{fontSize:10,fontWeight:700,color:T.blue500,background:T.blue50,padding:"1px 6px",borderRadius:9999}}>나</span>}</div><span style={{fontSize:12,fontWeight:600,color:m.color}}>{m.label}</span></div>
                    {!isMe&&<button onClick={()=>setUsers(p=>p.map(x=>x.id===u.id?{...x,active:!x.active}:x))} style={{padding:"5px 12px",borderRadius:9999,border:"none",cursor:"pointer",fontFamily:font,fontSize:12,fontWeight:600,background:u.active?T.red50:T.green50,color:u.active?T.red500:T.green500}}>{u.active?"비활성":"활성화"}</button>}
                  </div>
                  {i<users.length-1&&<Divider/>}
                </div>
              );})}
            </Card>
            <button onClick={onLogout} style={{width:"100%",padding:"14px 0",borderRadius:9999,border:`1.5px solid ${T.grey200}`,background:T.white,color:T.grey700,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <LogOut size={16} color={T.grey600}/> 로그아웃
            </button>
          </>
        )}
      </div>

      {/* 승인/거절 확인 모달 */}
      {reviewModal&&(
        <div style={{position:"absolute",inset:0,background:"rgba(2,9,19,0.5)",zIndex:99,display:"flex",justifyContent:"center",alignItems:"flex-end"}} onClick={()=>setReviewModal(null)}>
          <div style={{background:T.white,borderRadius:"16px 16px 0 0",width:"100%",padding:"20px 20px 40px",boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><div style={{width:36,height:4,borderRadius:9999,background:T.grey200}}/></div>
            <h2 style={{margin:"0 0 6px",fontSize:18,fontWeight:700,color:T.grey900}}>{reviewModal.action==="approved"?"발주 승인":"발주 거절"}</h2>
            <p style={{margin:"0 0 16px",fontSize:14,color:T.grey600}}>{reviewModal.action==="approved"?"승인 시 직원이 실 수령 후 직접 입고 확인합니다.":"거절 사유를 입력하면 요청자에게 알림이 전송됩니다."}</p>
            {(()=>{const item=items.find(i=>i.id===reviewModal.order.item_id);return(
              <div style={{background:T.grey50,borderRadius:12,padding:"12px 14px",marginBottom:16,border:`1px solid ${T.grey200}`}}>
                <p style={{margin:0,fontSize:14,fontWeight:600,color:T.grey900}}>{item?.name}</p>
                <p style={{margin:"4px 0 0",fontSize:13,color:T.grey600}}>{reviewModal.order.requested_by} · <span style={{fontWeight:700,color:T.teal500}}>{reviewModal.order.qty}{item?.unit}</span></p>
              </div>
            );})()}
            <p style={{margin:"0 0 8px",fontSize:13,fontWeight:600,color:T.grey700}}>{reviewModal.action==="approved"?"메모 (선택)":"거절 사유 (선택)"}</p>
            <Inp value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder={reviewModal.action==="approved"?"예: 승인합니다":"예: 이번달 예산 초과"} style={{marginBottom:20}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={()=>setReviewModal(null)} style={{padding:"14px 0",borderRadius:9999,border:`1.5px solid ${T.grey200}`,background:T.white,color:T.grey700,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:font}}>취소</button>
              <button onClick={confirmReview} style={{padding:"14px 0",borderRadius:9999,border:"none",background:reviewModal.action==="approved"?T.blue500:T.red500,color:T.white,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:font}}>
                {reviewModal.action==="approved"?"발주 승인":"거절"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
