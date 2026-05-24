import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, Store } from "lucide-react";
import { T, monoFont } from "../../../constants/colors";
import { compactMoney as formatMoney } from "../../../utils/money";
import { fmtFull } from "../../../utils/helpers";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { formatCheckedAt } from "./itemDetailUtils";

export function StatusTimeline({ rows }) {
  return (
    <Card style={{ marginBottom: 12, overflow: "hidden" }}>
      {rows.map((row, index) => {
        const Icon = row.Icon;
        return (
          <div key={row.label}>
            <div style={{ display: "flex", gap: 12, padding: "15px 16px", alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9999, background: row.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color={row.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: "21px", fontWeight: 800, color: T.grey900 }}>{row.label}</p>
                  <span style={{ flexShrink: 0, borderRadius: 9999, padding: "3px 7px", background: row.bg, color: row.color, fontSize: 12, lineHeight: "17px", fontWeight: 800 }}>
                    {row.badge}
                  </span>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 13, lineHeight: "19px", color: T.grey600, wordBreak: "keep-all" }}>{row.detail}</p>
              </div>
            </div>
            {index < rows.length - 1 && <Divider />}
          </div>
        );
      })}
    </Card>
  );
}

export function InsightRows({ rows, emptyText }) {
  if (!rows.length) {
    return (
      <Card style={{ marginBottom: 12, padding: "18px 16px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: "20px", color: T.grey500 }}>{emptyText}</p>
      </Card>
    );
  }
  return (
    <Card style={{ marginBottom: 12, overflow: "hidden" }}>
      {rows.map((row, index) => {
        const Icon = row.Icon;
        return (
          <div key={row.label}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "14px 16px" }}>
              <div style={{ width: 34, height: 34, borderRadius: 12, background: row.bg, color: row.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color="currentColor" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15, lineHeight: "21px", fontWeight: 800, color: T.grey900 }}>{row.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "19px", color: T.grey600, wordBreak: "keep-all" }}>{row.detail}</p>
              </div>
            </div>
            {index < rows.length - 1 && <Divider />}
          </div>
        );
      })}
    </Card>
  );
}

export function PriceHistoryCard({ priceOptions, priceHistoryRows, lowestPrice, highestPrice, latestCheckedAt }) {
  if (!priceOptions.length) {
    return (
      <Card style={{marginBottom:12, padding:"18px 16px", textAlign:"center"}}>
        <p style={{margin:0, fontSize:14, lineHeight:"20px", color:T.grey500}}>등록된 거래처 가격 후보가 없어요.</p>
      </Card>
    );
  }

  return (
    <Card style={{marginBottom:12, overflow:"hidden"}}>
      <div style={{padding:"14px 16px", background:T.blue50}}>
        <p style={{margin:0, fontSize:15, lineHeight:"21px", fontWeight:800, color:T.grey900}}>
          최저 {formatMoney(lowestPrice)} · 최고 {formatMoney(highestPrice)}
        </p>
        <p style={{margin:"2px 0 0", fontSize:13, lineHeight:"19px", color:T.grey600}}>
          최근 확인 {latestCheckedAt ? formatCheckedAt(latestCheckedAt) : "확인 전"} · 가격차 {formatMoney(Math.max(0, highestPrice - lowestPrice))}
        </p>
      </div>
      {priceHistoryRows.length > 0 && (
        <div style={{padding:"12px 16px", borderBottom:`1px solid ${T.grey100}`}}>
          <p style={{margin:"0 0 8px", fontSize:13, lineHeight:"18px", fontWeight:800, color:T.grey700}}>변화 기록</p>
          <div style={{display:"flex", flexDirection:"column", gap:7}}>
            {priceHistoryRows.map(row => (
              <div key={row.id} style={{display:"flex", alignItems:"center", gap:9, minWidth:0}}>
                <span style={{borderRadius:9999, padding:"3px 7px", background:row.bg, color:row.color, fontSize:11, lineHeight:"16px", fontWeight:800, whiteSpace:"nowrap"}}>{row.badge}</span>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{margin:0, fontSize:13, lineHeight:"18px", fontWeight:800, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{row.title} · {row.amount}</p>
                  <p style={{margin:"1px 0 0", fontSize:12, lineHeight:"17px", color:T.grey500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{formatCheckedAt(row.date)} · {row.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {priceOptions.map((option, index) => (
        <div key={`${option.vendor_id || option.vendor_name}-${index}`}>
          <div style={{display:"flex", alignItems:"center", gap:12, padding:"14px 16px"}}>
            <div style={{width:34, height:34, borderRadius:12, background:index === 0 ? T.green50 : T.grey100, color:index === 0 ? T.green500 : T.grey600, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Store size={17} color="currentColor"/>
            </div>
            <div style={{flex:1, minWidth:0}}>
              <p style={{margin:0, fontSize:15, lineHeight:"21px", fontWeight:800, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{option.vendor_name || "거래처"}</p>
              <p style={{margin:"2px 0 0", fontSize:12, lineHeight:"17px", color:T.grey500}}>
                {option.in_stock === false ? "품절" : "구매 가능"} · {formatCheckedAt(option.last_checked_at)}
              </p>
            </div>
            <div style={{textAlign:"right", flexShrink:0}}>
              <p style={{margin:0, fontSize:15, lineHeight:"20px", fontWeight:800, color:index === 0 ? T.green500 : T.grey900, fontFamily:monoFont}}>{formatMoney(option.price)}</p>
              {option.shipping_fee > 0 && <p style={{margin:"1px 0 0", fontSize:12, color:T.grey500}}>배송 {formatMoney(option.shipping_fee)}</p>}
            </div>
          </div>
          {index < priceOptions.length - 1 && <Divider/>}
        </div>
      ))}
    </Card>
  );
}

export function TransactionHistory({ itemTxs }) {
  return (
    <div style={{marginBottom:80}}>
      <p style={{margin:"0 0 10px", fontSize: 16, fontWeight:700, color:T.grey900}}>입출고 이력</p>
      {itemTxs.length === 0 ? (
        <Card style={{padding:"20px", textAlign:"center"}}>
          <p style={{margin:0, fontSize: 16, color:T.grey400}}>이력이 없어요</p>
        </Card>
      ) : (
        <Card>
          {itemTxs.slice(0,10).map((tx, i) => (
            <div key={tx.id}>
              <div style={{display:"flex", alignItems:"center", gap:12, padding:"18px 20px"}}>
                <div style={{width:44, height:44, borderRadius:9999, background:tx.type==="in"?T.blue50:tx.type==="out"?T.red50:T.grey100, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                  {tx.type==="in"
                    ? <ArrowDownToLine size={18} color={T.blue500}/>
                    : tx.type==="out"
                      ? <ArrowUpFromLine size={18} color={T.red500}/>
                      : <SlidersHorizontal size={18} color={T.grey600}/>}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{margin:0, fontSize: 16, fontWeight:600, color:T.grey900}}>{tx.note || (tx.type==="in"?"입고":tx.type==="out"?"출고":"재고 보정")}</p>
                  <p style={{margin:"1px 0 0", fontSize: 16, color:T.grey500}}>{tx.user} · {fmtFull(tx.created_at)}</p>
                </div>
                <span style={{fontSize: 16, fontWeight:700, color:tx.type==="in"?T.blue500:tx.type==="out"?T.red500:T.grey700, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>
                  {tx.type==="adjust" && tx.before_qty !== undefined && tx.after_qty !== undefined
                    ? `${tx.before_qty}→${tx.after_qty}`
                    : tx.type==="adjust"
                      ? `보정 ${tx.qty}`
                      : `${tx.type==="in"?"+":"-"}${tx.qty}`}
                </span>
              </div>
              {i < Math.min(itemTxs.length,10)-1 && <Divider/>}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
