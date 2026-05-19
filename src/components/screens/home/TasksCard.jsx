import { useMemo } from "react";
import { AlertTriangle, PackageCheck, ClipboardList } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";

export function TasksCard({ canApprove, pendingOrders, alertItems, waitingOrders, items, setTab }) {
  const tasks = useMemo(() => {
    const list = [];
    if (canApprove && pendingOrders.length > 0) {
      const first = pendingOrders[0];
      const itemName = items.find(i => i.id === first.item_id)?.name || "";
      list.push({id:"pending", Icon:ClipboardList, iconBg:T.orange50, iconColor:T.orange500, title:`발주 승인 대기 ${pendingOrders.length}건`, sub:`${itemName} · ${first.requested_by} 요청`, action:"검토", actionBg:T.red500, onClick:()=>setTab("admin")});
    }
    if (!canApprove && alertItems.length > 0) {
      list.push({id:"alerts", Icon:AlertTriangle, iconBg:T.red50, iconColor:T.red500, title:`재고 부족 품목 ${alertItems.length}건`, sub:`${alertItems[0]?.name} · 발주 요청 필요`, action:"발주", actionBg:T.red500, onClick:()=>setTab("order")});
    }
    if (waitingOrders.length > 0) {
      list.push({id:"waiting", Icon:PackageCheck, iconBg:T.blue50, iconColor:T.blue500, title:`배송 도착 ${waitingOrders.length}건`, sub:"재고에 등록해주세요", action:"확인", actionBg:T.blue500, onClick:()=>setTab("inventory")});
    }
    return list;
  }, [canApprove, pendingOrders, alertItems, waitingOrders, items, setTab]);

  if (tasks.length === 0) return null;

  return (
    <div style={{padding:"16px 16px 0"}}>
      <Card style={{overflow:"hidden", padding:0}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px 10px"}}>
          <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey700}}>오늘 해야 할 일</p>
          <span style={{fontSize:12, fontWeight:700, color:T.blue500}}>{tasks.length}건</span>
        </div>
        {tasks.map((task, i) => {
          const Icon = task.Icon;
          return (
            <div key={task.id}>
              {i > 0 && <Divider/>}
              <button onClick={task.onClick} style={{width:"100%", display:"flex", alignItems:"center", gap:12, padding:"16px 16px", background:"none", border:"none", cursor:"pointer", fontFamily:font}}>
                <div style={{width:48, height:48, borderRadius:10, background:task.iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                  <Icon size={20} color={task.iconColor}/>
                </div>
                <div style={{flex:1, textAlign:"left", minWidth:0}}>
                  <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900}}>{task.title}</p>
                  {task.sub && <p style={{margin:"2px 0 0", fontSize:11, color:T.grey500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{task.sub}</p>}
                </div>
                <span style={{flexShrink:0, padding:"16px 16px", borderRadius:9999, background:task.actionBg, color:T.white, fontSize:12, fontWeight:700}}>{task.action}</span>
              </button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
