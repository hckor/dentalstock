import { CheckCircle2, ShoppingCart } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { SecTitle } from "../../shared/SecTitle";

export function SurgeryBulkOrderCard({ surgeryInsights, openModal, onOpenBulkOrder }) {
  return (
    <>
      <SecTitle>수술 준비 묶음</SecTitle>
      <Card style={{padding:16, marginBottom:16}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14}}>
          <div style={{width:38,height:38,borderRadius:12,background:surgeryInsights.bulkShortageRows.length ? T.orange50 : T.green50,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {surgeryInsights.bulkShortageRows.length ? <ShoppingCart size={20} color={T.orange500}/> : <CheckCircle2 size={21} color={T.green500}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{margin:0,fontSize:16,lineHeight:"22px",fontWeight:800,color:T.grey900}}>이번 주 수술 부족 품목</p>
            <p style={{margin:"3px 0 0",fontSize:13,lineHeight:"18px",color:T.grey500}}>
              {surgeryInsights.weeklyPrepCount ? `준비 전 수술 ${surgeryInsights.weeklyPrepCount}건 기준` : "이번 주 준비 전 수술이 없어요"}
            </p>
          </div>
          <span style={{borderRadius:9999,padding:"5px 10px",background:surgeryInsights.bulkShortageRows.length ? T.orange50 : T.green50,color:surgeryInsights.bulkShortageRows.length ? T.orange500 : T.green500,fontSize:13,lineHeight:"18px",fontWeight:800,whiteSpace:"nowrap"}}>
            {surgeryInsights.bulkShortageRows.length ? `${surgeryInsights.bulkShortageRows.length}종 부족` : "준비 안정"}
          </span>
        </div>

        {surgeryInsights.bulkShortageRows.length === 0 ? (
          <div style={{borderRadius:12,background:T.green50,padding:"13px 14px"}}>
            <p style={{margin:0,fontSize:14,lineHeight:"20px",fontWeight:800,color:T.green500}}>부족 품목 없이 준비 가능</p>
            <p style={{margin:"3px 0 0",fontSize:13,lineHeight:"18px",color:T.grey600}}>이번 주 수술 준비 목록 기준으로 현재 재고가 충분해요.</p>
          </div>
        ) : (
          <>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {surgeryInsights.bulkShortageRows.slice(0, 4).map(row => (
                <div key={row.id} style={{border:`1px solid ${T.orange500}33`,background:T.orange50,borderRadius:12,padding:"12px 13px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:4}}>
                    <p style={{margin:0,fontSize:15,lineHeight:"21px",fontWeight:800,color:T.grey900,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.item?.name || "삭제된 품목"}</p>
                    <span style={{fontSize:14,lineHeight:"20px",fontWeight:800,color:T.orange500,whiteSpace:"nowrap"}}>{row.shortageQty}{row.unit} 부족</span>
                  </div>
                  <p style={{margin:0,fontSize:13,lineHeight:"18px",color:T.grey600}}>
                    필요 {row.requiredQty}{row.unit} · 현재 {row.currentQty}{row.unit} · {row.surgeryTitles.slice(0, 2).join(", ")}{row.surgeryTitles.length > 2 ? ` 외 ${row.surgeryTitles.length - 2}건` : ""}
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onOpenBulkOrder}
              disabled={!openModal}
              style={{width:"100%",minHeight:50,borderRadius:9999,border:"none",background:openModal ? T.blue500 : T.grey200,color:openModal ? T.white : T.grey500,fontFamily:font,fontSize:16,fontWeight:800,cursor:openModal ? "pointer" : "default",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}
            >
              <ShoppingCart size={18}/>
              수술 부족 품목 일괄 발주
            </button>
            <p style={{margin:"8px 0 0",fontSize:12,lineHeight:"17px",color:T.grey500}}>발주 모달에서 필요한 품목만 남기고 수량을 조정하세요.</p>
          </>
        )}
      </Card>
    </>
  );
}
