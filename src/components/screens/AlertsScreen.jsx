import { useMemo } from "react";
import {
  AlertTriangle, Clock, Truck, ShoppingCart, XCircle, PackageCheck,
  CalendarDays, ClipboardCheck, ChevronRight
} from "lucide-react";
import { T, font } from "../../constants/colors";
import { fmtFull } from "../../utils/helpers";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";

const TYPE_META = {
  low_stock:      {bg:T.orange50, color:T.orange500, Icon:AlertTriangle, actionLabel:"발주 요청"},
  expiry:         {bg:T.red50,    color:T.red500,    Icon:Clock,         actionLabel:"확인"},
  order_req:      {bg:T.orange50, color:T.orange500, Icon:ShoppingCart,  actionLabel:"검토"},
  ordered:        {bg:T.teal50,   color:T.teal500,   Icon:Truck,         actionLabel:"입고 확인"},
  order_rejected: {bg:T.red50,    color:T.red500,    Icon:XCircle,       actionLabel:null},
  received:       {bg:T.green50,  color:T.green500,  Icon:PackageCheck,  actionLabel:null},
  surgery_today:  {bg:T.blue50,   color:T.blue500,   Icon:CalendarDays,  actionLabel:null},
  surgery_ready:  {bg:T.green50,  color:T.green500,  Icon:ClipboardCheck,actionLabel:null},
  surgery_reminder:{bg:T.orange50,color:T.orange500, Icon:Clock,         actionLabel:null},
};

function groupByDate(notifs) {
  const today = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  const groups = {};
  notifs.forEach(n => {
    const d = n.created_at.slice(0,10);
    const label = d === today ? "오늘" : d === yesterday ? "어제" : fmtFull(n.created_at).slice(0,8);
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return Object.entries(groups);
}

export function AlertsScreen({notifs, setNotifs}) {
  const unread = notifs.filter(n => !n.is_read).length;
  const grouped = useMemo(() => groupByDate(notifs), [notifs]);

  const markRead = (id) => setNotifs(p => p.map(x => x.id===id ? {...x, is_read:true} : x));
  const markAllRead = () => setNotifs(p => p.map(n => ({...n, is_read:true})));

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <p style={{margin:0, fontSize: 16, color:T.grey500}}>
          액션 필요 <span style={{fontWeight:700, color:T.red500}}>{unread}건</span>
        </p>
        <button onClick={markAllRead} style={{fontSize: 16, color:T.blue500, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600}}>
          모두 읽음
        </button>
      </div>

      {notifs.length === 0 ? (
        <div style={{textAlign:"center", padding:"40px 0"}}>
          <p style={{margin:0, fontSize: 16, color:T.grey400}}>새로운 알림이 없어요</p>
        </div>
      ) : grouped.map(([dateLabel, dayNotifs]) => (
        <div key={dateLabel} style={{marginBottom:20}}>
          <p style={{margin:"0 0 8px", fontSize: 16, fontWeight:700, color:T.grey500}}>{dateLabel}</p>
          <Card>
            {dayNotifs.map((n, i) => {
              const m = TYPE_META[n.type] || TYPE_META.order_req;
              const Icon = m.Icon;
              return (
                <div key={n.id}>
                  <div style={{padding:"18px 20px", opacity:n.is_read ? 0.5 : 1, display:"flex", flexDirection:"column", gap:10}}>
                    <div style={{display:"flex", alignItems:"flex-start", gap:12}}>
                      {/* 읽음 상태 인디케이터 */}
                      {!n.is_read && (
                        <div style={{position:"absolute", left:0, top:0, bottom:0, width:3, background:m.color, borderRadius:"0 2px 2px 0"}}/>
                      )}
                      <div style={{width:48, height:48, borderRadius:10, background:m.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                        <Icon size={22} color={m.color}/>
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <p style={{margin:0, fontSize: 16, fontWeight:n.is_read?400:600, color:T.grey900, lineHeight:1.45}}>{n.message}</p>
                        {n.sub && <p style={{margin:"2px 0 0", fontSize: 16, color:T.grey500}}>{n.sub}</p>}
                        <p style={{margin:"4px 0 0", fontSize: 16, color:T.grey400}}>{fmtFull(n.created_at)}</p>
                      </div>
                      {!n.is_read && <div style={{width:8, height:8, borderRadius:9999, background:T.red500, flexShrink:0, marginTop:4}}/>}
                    </div>

                    {/* 액션 버튼 (읽지 않은 중요 알림에만) */}
                    {!n.is_read && m.actionLabel && (
                      <button onClick={()=>markRead(n.id)} style={{alignSelf:"flex-start", marginLeft:50, padding:"12px 20px", borderRadius:9999, border:"none", background:m.color, color:T.white, fontSize: 16, fontWeight:700, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:5}}>
                        {m.actionLabel} <ChevronRight size={16}/>
                      </button>
                    )}
                    {n.is_read && (
                      <div style={{height:0}}/>
                    )}
                  </div>
                  {i < dayNotifs.length-1 && <Divider/>}
                </div>
              );
            })}
          </Card>
        </div>
      ))}
    </div>
  );
}
