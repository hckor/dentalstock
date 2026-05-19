import { useMemo } from "react";
import { ChevronLeft, ArrowUpFromLine } from "lucide-react";
import { T, font } from "../../constants/colors";
import { catName, daysUntil } from "../../utils/helpers";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";

function ExpirySection({title, items, dotColor, textColor, onOut}) {
  if (items.length === 0) return null;
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:8}}>
        <div style={{width:7, height:7, borderRadius:9999, background:dotColor}}/>
        <p style={{margin:0, fontSize:13, fontWeight:700, color:T.grey700}}>{title}</p>
      </div>
      <Card>
        {items.map((item, i) => {
          const days = daysUntil(item.expiry);
          return (
            <div key={item.id}>
              <div style={{display:"flex", alignItems:"center", gap:12, padding:"13px 16px"}}>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{margin:0, fontSize:14, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.name}</p>
                  <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>
                    {catName(item.category_id)} · {item.current_qty}{item.unit} · {item.expiry}
                  </p>
                </div>
                <div style={{flexShrink:0, textAlign:"right", marginRight:8}}>
                  {days !== null && days <= 0 ? (
                    <span style={{fontSize:12, fontWeight:700, color:T.red500}}>만료됨</span>
                  ) : (
                    <span style={{fontSize:13, fontWeight:700, color:textColor}}>D-{days}</span>
                  )}
                </div>
                <button onClick={()=>onOut(item)} style={{flexShrink:0, padding:"7px 12px", borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, color:T.grey600, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:4}}>
                  <ArrowUpFromLine size={12}/> 출고
                </button>
              </div>
              {i < items.length-1 && <Divider/>}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

export function ExpiryManagementScreen({items, onClose, openModal}) {
  const expiryItems = useMemo(() => items.filter(i => i.expiry != null), [items]);

  const expired   = useMemo(() => expiryItems.filter(i => daysUntil(i.expiry) !== null && daysUntil(i.expiry) <= 0),  [expiryItems]);
  const within7   = useMemo(() => expiryItems.filter(i => { const d=daysUntil(i.expiry); return d!=null&&d>0&&d<=7;   }), [expiryItems]);
  const within30  = useMemo(() => expiryItems.filter(i => { const d=daysUntil(i.expiry); return d!=null&&d>7&&d<=30;  }), [expiryItems]);
  const within90  = useMemo(() => expiryItems.filter(i => { const d=daysUntil(i.expiry); return d!=null&&d>30&&d<=90; }), [expiryItems]);
  const safe      = useMemo(() => expiryItems.filter(i => { const d=daysUntil(i.expiry); return d!=null&&d>90;         }), [expiryItems]);

  const handleOut = (item) => openModal("out", item);

  const stats = [
    {label:"만료",    value:expired.length,           color:T.red500},
    {label:"30일 이내", value:within7.length+within30.length, color:T.orange500},
    {label:"90일 이내", value:within90.length,          color:T.yellow500},
  ];

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", background:T.grey50}}>
      {/* 헤더 */}
      <div style={{background:T.white, padding:"14px 16px 16px", borderBottom:`1px solid ${T.grey100}`}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
          <button onClick={onClose} style={{border:"none", background:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center", gap:4, color:T.grey600, fontFamily:font, fontSize:14}}>
            <ChevronLeft size={18} color={T.grey600}/> 뒤로
          </button>
        </div>
        <h1 style={{margin:"0 0 14px", fontSize:22, fontWeight:700, color:T.grey900}}>유통기한 관리</h1>

        {/* 요약 통계 */}
        <div style={{display:"flex", gap:8}}>
          {stats.map(s => (
            <div key={s.label} style={{flex:1, background:T.grey50, borderRadius:10, padding:"10px 12px", border:`1px solid ${T.grey200}`}}>
              <p style={{margin:"0 0 2px", fontSize:11, color:T.grey500}}>{s.label}</p>
              <p style={{margin:0, fontSize:20, fontWeight:700, color:s.color, fontVariantNumeric:"tabular-nums"}}>{s.value}<span style={{fontSize:12, fontWeight:400, color:T.grey500}}>건</span></p>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1, overflowY:"auto", padding:"16px"}}>
        {expiryItems.length === 0 ? (
          <div style={{textAlign:"center", padding:"60px 0"}}>
            <p style={{margin:0, fontSize:15, fontWeight:600, color:T.grey700}}>유통기한 정보가 없어요</p>
            <p style={{margin:"6px 0 0", fontSize:13, color:T.grey500}}>품목 편집에서 유통기한을 등록해보세요</p>
          </div>
        ) : (
          <>
            {expired.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:8}}>
                  <div style={{width:7, height:7, borderRadius:9999, background:T.red500}}/>
                  <p style={{margin:0, fontSize:13, fontWeight:700, color:T.grey700}}>이미 만료됨 · 사용 금지</p>
                </div>
                <Card style={{border:`1.5px solid ${T.red500}22`}}>
                  {expired.map((item, i) => (
                    <div key={item.id}>
                      <div style={{display:"flex", alignItems:"center", gap:12, padding:"13px 16px"}}>
                        <div style={{flex:1, minWidth:0}}>
                          <p style={{margin:0, fontSize:14, fontWeight:600, color:T.red500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.name}</p>
                          <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>
                            {catName(item.category_id)} · {item.current_qty}{item.unit} · {item.expiry}
                          </p>
                        </div>
                        <span style={{flexShrink:0, fontSize:12, fontWeight:700, color:T.red500, marginRight:8}}>만료됨</span>
                        <button onClick={()=>handleOut(item)} style={{flexShrink:0, padding:"7px 12px", borderRadius:9999, border:"none", background:T.red500, color:T.white, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:4}}>
                          <ArrowUpFromLine size={12}/> 폐기
                        </button>
                      </div>
                      {i < expired.length-1 && <Divider/>}
                    </div>
                  ))}
                </Card>
              </div>
            )}

            <ExpirySection title="7일 이내 만료" items={within7} dotColor={T.red500}   textColor={T.red500}    onOut={handleOut}/>
            <ExpirySection title="30일 이내 만료" items={within30} dotColor={T.orange500} textColor={T.orange500} onOut={handleOut}/>
            <ExpirySection title="90일 이내 만료" items={within90} dotColor={T.yellow500} textColor={T.yellow500} onOut={handleOut}/>
            <ExpirySection title="안전"          items={safe}    dotColor={T.green500}  textColor={T.green500}  onOut={handleOut}/>

            <p style={{margin:"8px 0 0", fontSize:12, color:T.grey400, lineHeight:1.6, textAlign:"center", paddingBottom:24}}>
              만료 적힌 품목은 자동으로 출고 시 우선 사용되며, 만료됐다면 사용 시 경고가 표시됩니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
