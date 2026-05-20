import { useMemo } from "react";
import { todayKey } from "../../utils/helpers";
import { SecTitle } from "../shared/SecTitle";
import { TasksCard } from "./home/TasksCard";
import { TodaySurgeryCard } from "./home/TodaySurgeryCard";
import { StatsBar } from "./home/StatsBar";
import { RecentTxList } from "./home/RecentTxList";

export function HomeScreen({items, txs, orders, surgeries, setTab, canApprove, confirmSurgeryPrep, confirmSurgeryUsage, openItemsEditor, updateSurgeryItems}) {
  const approvalOrders = useMemo(() => orders.filter(o => o.status === "pending"),  [orders]);
  const shippingOrders = useMemo(() => orders.filter(o => o.status === "ordered"),  [orders]);
  const todaySurgeries = useMemo(
    () => surgeries
      .filter(s => s.scheduled_date === todayKey())
      .sort((a,b) => (a.scheduled_time||"").localeCompare(b.scheduled_time||"")),
    [surgeries]
  );

  return (
    <div style={{paddingBottom:24}}>
      <TasksCard
        canApprove={canApprove}
        approvalOrders={approvalOrders}
        shippingOrders={shippingOrders}
        surgeries={surgeries}
        items={items}
        setTab={setTab}
      />

      {todaySurgeries.length > 0 && (
        <div style={{padding:"16px 16px 0"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
            <SecTitle>오늘 수술 준비</SecTitle>
          </div>
          {todaySurgeries.map(surgery => (
            <TodaySurgeryCard
              key={surgery.id}
              surgery={surgery}
              items={items}
              confirmSurgeryPrep={confirmSurgeryPrep}
              confirmSurgeryUsage={confirmSurgeryUsage}
              openItemsEditor={openItemsEditor}
              updateSurgeryItems={updateSurgeryItems}
            />
          ))}
        </div>
      )}

      <StatsBar items={items} setTab={setTab}/>
      <RecentTxList txs={txs} items={items} setTab={setTab}/>
    </div>
  );
}
