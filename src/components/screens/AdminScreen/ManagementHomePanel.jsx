import { ChevronRight, ClipboardList, LogOut, Settings2 } from "lucide-react";
import { T, font, monoFont } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { compactCount } from "./adminUtils";

export function ManagementHomePanel({
  activeStaffCount,
  inactiveStaffCount,
  baselineReadyCount,
  pendingOrderPolicyCount,
  items,
  managementSections,
  openManagementSection,
  setShowInitialInventory,
  onLogout,
}) {
  return (
    <>
      <Card style={{padding:16, marginBottom:12}}>
        <div style={{display:"flex", alignItems:"flex-start", gap:12}}>
          <div style={{width:40, height:40, borderRadius:12, background:T.primaryBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
            <Settings2 size={21} color={T.primary}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <p style={{margin:0, fontSize:18, lineHeight:"24px", fontWeight:900, color:T.grey900}}>관리 메인</p>
            <p style={{margin:"4px 0 0", fontSize:14, lineHeight:"20px", color:T.grey600, wordBreak:"keep-all"}}>
              배송 현황, 직원, 품목, 도매 설정, 활동 로그를 각각 독립된 화면에서 관리합니다.
            </p>
          </div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, minmax(0, 1fr))", gap:8, marginTop:14}}>
          {[
            {label:"활성 직원", value:activeStaffCount, detail:inactiveStaffCount ? `비활성 ${inactiveStaffCount}` : "전체 활성", color:T.primary},
            {label:"기준값 완료", value:baselineReadyCount, detail:`전체 ${items.length}`, color:T.success},
            {label:"승인 대기", value:pendingOrderPolicyCount, detail:"발주 정책 확인", color:T.warning},
          ].map(summary => (
            <div key={summary.label} style={{minWidth:0, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.white, padding:"10px 11px"}}>
              <p style={{margin:"0 0 4px", fontSize:12, lineHeight:"16px", fontWeight:700, color:T.grey500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{summary.label}</p>
              <p style={{margin:0, fontSize:21, lineHeight:"25px", fontWeight:800, color:summary.color, fontFamily:monoFont, fontVariantNumeric:"tabular-nums"}}>{compactCount(summary.value)}</p>
              <p style={{margin:"2px 0 0", fontSize:11, lineHeight:"15px", color:T.grey500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{summary.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <div style={{marginBottom:10}}>
        <p style={{margin:"0 0 8px", fontSize:15, lineHeight:"21px", fontWeight:900, color:T.grey700}}>관리 메뉴</p>
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
        {managementSections.map(({id, label, detail, description, Icon, color, onClick}) => (
          <button
            key={label}
            type="button"
            onClick={()=>onClick ? onClick() : openManagementSection(id)}
            style={{minWidth:0, minHeight:76, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.white, padding:"13px 14px", textAlign:"left", cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:12}}
          >
            <div style={{width:38, height:38, borderRadius:12, background:T.grey50, color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <Icon size={18} color={color}/>
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:"flex", alignItems:"center", gap:7, minWidth:0}}>
                <p style={{margin:0, fontSize:15, lineHeight:"20px", fontWeight:900, color:T.grey900, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{label}</p>
                <span style={{flexShrink:0, borderRadius:9999, background:T.grey50, color:T.grey600, padding:"3px 7px", fontSize:11, lineHeight:"15px", fontWeight:800}}>{detail}</span>
              </div>
              <p style={{margin:"3px 0 0", fontSize:13, lineHeight:"18px", color:T.grey500, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", wordBreak:"keep-all"}}>{description}</p>
            </div>
            <ChevronRight size={16} color={T.grey400} style={{flexShrink:0}}/>
          </button>
        ))}
        </div>
      </div>

      <button
        type="button"
        onClick={()=>setShowInitialInventory(true)}
        style={{width:"100%", minHeight:58, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.white, padding:"12px 14px", textAlign:"left", cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:12, marginBottom:16}}
      >
        <div style={{width:38, height:38, borderRadius:12, background:T.grey50, color:T.grey700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
          <ClipboardList size={18} color="currentColor"/>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <p style={{margin:0, fontSize:15, lineHeight:"20px", fontWeight:900, color:T.grey900}}>초기 재고 일괄 입력</p>
          <p style={{margin:"3px 0 0", fontSize:13, lineHeight:"18px", color:T.grey500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>카탈로그와 현재 수량을 한 번에 맞춥니다.</p>
        </div>
        <ChevronRight size={16} color={T.grey400} style={{flexShrink:0}}/>
      </button>

      <button onClick={onLogout}
        style={{width:"100%", padding:"18px 0", borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, color:T.grey700, fontSize: 16, fontWeight:600, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
        <LogOut size={20} color={T.grey600}/> 로그아웃
      </button>
    </>
  );
}
