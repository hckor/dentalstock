import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, ClipboardCheck, Edit2, Minus, Plus } from "lucide-react";
import { T, font, CS } from "../../../constants/colors";
import { SURGERY_PRESETS } from "../../../constants/surgeryPresets";

const twoLineText = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "break-word",
  wordBreak: "keep-all",
};

export function TodaySurgeryCard({
  surgery,
  items,
  confirmSurgeryPrep,
  confirmSurgeryUsage,
  openItemsEditor,
  updateSurgeryItems,
  canManage = true,
  canConfirm = true,
  canEditItems = canManage,
}) {
  const [expanded, setExpanded] = useState(false);
  const [usageNote, setUsageNote] = useState("");
  const [showUsageNote, setShowUsageNote] = useState(false);
  const [usageExceptionIds, setUsageExceptionIds] = useState([]);
  const typeLabel = surgery.type && SURGERY_PRESETS[surgery.type]?.label;
  const requiredItems = Array.isArray(surgery.required_items) ? surgery.required_items : [];
  const reqItems = requiredItems.map(req => {
    const item = items.find(i => i.id === req.item_id);
    const ok = item && item.current_qty >= req.qty;
    return { req, item, ok };
  });
  const canEditUsage = canConfirm && !surgery.usage_confirmed;
  const allOk    = reqItems.every(r => r.ok);
  const shortage = reqItems.filter(r => !r.ok).length;
  const prepIssueRows = reqItems.filter(r => !r.ok);
  const summaryText = surgery.prep_confirmed
    ? surgery.usage_confirmed
      ? `완료 · ${surgery.actual_items?.filter(row => row.qty > 0).length || 0}개`
      : "사용량 확인 필요"
    : allOk
      ? `준비 가능 · 품목 ${reqItems.length}개`
      : `부족 ${shortage}종`;
  const [usageRows, setUsageRows] = useState(() => requiredItems.map(req => ({ item_id: req.item_id, qty: req.qty })));
  const actualRows = useMemo(
    () => (surgery.actual_items || usageRows).map(row => {
      const item = items.find(target => target.id === row.item_id);
      return { ...row, item };
    }),
    [items, surgery.actual_items, usageRows]
  );

  const updateUsageQty = (itemId, nextQty) => {
    setUsageRows(prev => prev.map(row => row.item_id === itemId
      ? { ...row, qty: Math.max(0, Number(nextQty) || 0) }
      : row
    ));
  };

  const toggleUsageException = (itemId) => {
    const active = usageExceptionIds.includes(itemId);
    if (active) {
      const expectedQty = requiredItems.find(req => req.item_id === itemId)?.qty || 0;
      updateUsageQty(itemId, expectedQty);
      setUsageExceptionIds(prev => prev.filter(id => id !== itemId));
      return;
    }
    setUsageExceptionIds(prev => [...prev, itemId]);
  };

  const resetUsageRows = () => {
    setUsageRows(requiredItems.map(req => ({ item_id: req.item_id, qty: req.qty })));
    setUsageExceptionIds([]);
  };

  const usageDisplayRows = surgery.usage_confirmed
    ? actualRows
    : usageRows.map(row => ({ ...row, item: items.find(target => target.id === row.item_id) }));

  const canEditSurgeryItems = Boolean(canEditItems && openItemsEditor && updateSurgeryItems && !surgery.usage_confirmed);
  const openEditor = () => openItemsEditor(
    requiredItems,
    (newItems) => updateSurgeryItems(surgery.id, newItems),
    `${surgery.scheduled_time} · ${surgery.title}`
  );
  const useEditAsPrepPrimary = !allOk && canEditSurgeryItems;
  const useConfirmAsPrepPrimary = canConfirm && !useEditAsPrepPrimary;
  const showPrepEditSecondary = useConfirmAsPrepPrimary && canEditSurgeryItems;
  const showPrepConfirmSecondary = useEditAsPrepPrimary && canConfirm;

  return (
    <div style={{background:T.white, borderRadius:12, boxShadow:CS, marginBottom:10, overflow:"hidden"}}>
      <div style={{padding:"16px 16px 12px"}}>
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          style={{width:"100%", display:"flex", alignItems:"flex-start", gap:12, margin:0, padding:0, border:"none", background:"none", textAlign:"left", cursor:"pointer", fontFamily:font}}
        >
	          <div style={{width:52, height:52, borderRadius:12, background:T.primaryBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
	            {surgery.usage_confirmed
	              ? <ClipboardCheck size={24} color={T.success}/>
	              : surgery.prep_confirmed
	              ? <ClipboardCheck size={24} color={T.success}/>
	              : <CalendarDays size={24} color={T.primary}/>
            }
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
              <p style={{margin:0, fontSize: 20, lineHeight:"26px", fontWeight:700, color:T.grey900, flex:"1 1 180px", minWidth:0, overflowWrap:"break-word", wordBreak:"keep-all"}}>{surgery.title}</p>
              {typeLabel && (
	                <span style={{fontSize: 13, lineHeight:"20px", fontWeight:700, color:T.primary, background:T.primaryBg, padding:"3px 7px", borderRadius:12, flexShrink:0}}>
                  {typeLabel}
                </span>
              )}
              {!surgery.prep_confirmed && (
                <span style={{fontSize: 13, lineHeight:"20px", fontWeight:700,
	                  color: allOk ? T.success : T.warning,
	                  background: allOk ? T.successBg : T.warningBg,
                  padding:"3px 7px", borderRadius:12, flexShrink:0}}>
                  {allOk ? "준비 완료" : `부족 ${shortage}종`}
                </span>
              )}
              {surgery.prep_confirmed && !surgery.usage_confirmed && (
	                <span style={{fontSize: 13, lineHeight:"20px", fontWeight:700, color:T.warning, background:T.warningBg, padding:"3px 7px", borderRadius:12, flexShrink:0}}>
                  사용량 확인
                </span>
              )}
              {surgery.usage_confirmed && (
	                <span style={{fontSize: 13, lineHeight:"20px", fontWeight:700, color:T.success, background:T.successBg, padding:"3px 7px", borderRadius:12, flexShrink:0}}>
                  완료
                </span>
              )}
            </div>
            <p style={{margin:"3px 0 0", fontSize: 16, lineHeight:"22px", color:T.grey500, overflowWrap:"break-word", wordBreak:"keep-all"}}>
              {surgery.scheduled_time} · 환자 {surgery.patient}
            </p>
	            <p style={{margin:"4px 0 0", fontSize: 15, lineHeight:"21px", fontWeight:600, color: shortage ? T.warning : T.success, overflowWrap:"break-word", wordBreak:"keep-all"}}>
              {summaryText}
            </p>
          </div>
          <ChevronRight size={20} color={T.grey400} style={{marginTop:4, flexShrink:0, transform:expanded ? "rotate(90deg)" : "rotate(0deg)", transition:"transform 150ms"}}/>
        </button>

        {expanded && (
          <>
            {!surgery.prep_confirmed && prepIssueRows.length > 0 && (
              <div style={{background:T.grey50, borderRadius:12, overflow:"hidden", marginTop:12}}>
                {prepIssueRows.map(({req, item}, i) => (
                  <div key={req.item_id}>
                    <div style={{display:"flex", alignItems:"flex-start", padding:"11px 14px", gap:10}}>
                      <div style={{flex:1, minWidth:0}}>
                        <p style={{margin:0, fontSize: 16, lineHeight:"22px", fontWeight:600, color:T.grey900, ...twoLineText}}>
                          {item?.name || "알 수 없는 품목"}
                        </p>
                        <p style={{margin:"2px 0 0", fontSize: 16, color:T.grey500}}>
                          필요 {req.qty}{item?.unit || "개"} · 현재 {item?.current_qty ?? 0}{item?.unit || "개"}
                        </p>
                      </div>
                      <span style={{flexShrink:0, minWidth:42, boxSizing:"border-box", textAlign:"center", fontSize: 13, lineHeight:"20px", fontWeight:700,
	                        color: T.danger,
	                        background: T.dangerBg,
                        padding:"3px 7px", borderRadius:12}}>
                        부족
                      </span>
                    </div>
                    {i < prepIssueRows.length - 1 && <div style={{height:1, background:T.grey100, marginLeft:14}}/>}
                  </div>
                ))}
              </div>
            )}

            {!surgery.prep_confirmed && surgery.note && (
              <p style={{margin:"10px 0 0", fontSize: 16, lineHeight:"22px", color:T.grey500, overflowWrap:"break-word", wordBreak:"keep-all"}}>
                메모: {surgery.note}
              </p>
            )}

            {surgery.prep_confirmed && (
              <div style={{background:T.grey50, borderRadius:12, overflow:"hidden", marginTop:12}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, padding:"12px 14px", borderBottom:`1px solid ${T.grey100}`}}>
                  <div>
                    <p style={{margin:0, fontSize: 15, fontWeight:700, color:T.grey800}}>
                      {surgery.usage_confirmed ? "실사용량" : "사용량"}
                    </p>
                  </div>
                  {canEditUsage && usageExceptionIds.length > 0 && (
	                    <button type="button" onClick={resetUsageRows} style={{border:"none", background:"none", color:T.primary, fontSize:13, fontWeight:700, fontFamily:font, cursor:"pointer"}}>
                      예상량 복원
                    </button>
                  )}
                </div>
                {usageDisplayRows.map((row, i, list) => (
                  <div key={row.item_id}>
                    <div style={{display:"flex", alignItems:"center", gap:10, padding:"11px 14px"}}>
                      <div style={{flex:1, minWidth:0}}>
                        <p style={{margin:0, fontSize:15, lineHeight:"21px", fontWeight:600, color:T.grey900, ...twoLineText}}>{row.item?.name || "알 수 없는 품목"}</p>
                        <p style={{margin:"2px 0 0", fontSize:13, color:T.grey500}}>예상 {requiredItems.find(req => req.item_id === row.item_id)?.qty || 0}{row.item?.unit || ""} · 현재 {row.item?.current_qty ?? 0}{row.item?.unit || ""}</p>
                      </div>
                      {surgery.usage_confirmed || !canEditUsage ? (
                        <span style={{flexShrink:0, fontSize:14, fontWeight:700, color:T.grey800}}>{row.qty}{row.item?.unit || ""}</span>
                      ) : !usageExceptionIds.includes(row.item_id) ? (
                        <button
                          type="button"
                          onClick={() => toggleUsageException(row.item_id)}
                          aria-label={`${row.item?.name || "품목"} 사용량 수정`}
                          style={{flexShrink:0, minWidth:70, minHeight:38, borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, color:T.grey900, padding:"8px 12px", fontSize:15, fontWeight:700, fontFamily:font, cursor:"pointer"}}
                        >
                          {row.qty}{row.item?.unit || ""}
                        </button>
                      ) : (
                        <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
                          <button type="button" onClick={() => updateUsageQty(row.item_id, row.qty - 1)} style={{width:34, height:34, borderRadius:9999, border:`1px solid ${T.grey200}`, background:T.white, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}>
                            <Minus size={16} color={T.grey700}/>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleUsageException(row.item_id)}
                            aria-label={`${row.item?.name || "품목"} 사용량 수정 완료`}
	                            style={{minWidth:58, height:34, borderRadius:9999, border:"none", background:T.primaryBg, color:T.primary, padding:"0 10px", fontSize:15, fontWeight:800, fontFamily:font, cursor:"pointer"}}
                          >
                            {row.qty}{row.item?.unit || ""}
                          </button>
	                          <button type="button" onClick={() => updateUsageQty(row.item_id, row.qty + 1)} style={{width:34, height:34, borderRadius:9999, border:"none", background:T.primary, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}>
                            <Plus size={16} color={T.white}/>
                          </button>
                        </div>
                      )}
                    </div>
                    {i < list.length - 1 && <div style={{height:1, background:T.grey100, marginLeft:14}}/>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {expanded && !surgery.prep_confirmed && (canEditSurgeryItems || canConfirm) ? (
        <div style={{borderTop:`1px solid ${T.grey100}`, padding:"10px 12px 12px", display:"flex", flexDirection:"column", gap:8}}>
          <button
            type="button"
            onClick={useConfirmAsPrepPrimary ? () => confirmSurgeryPrep(surgery.id) : openEditor}
            style={{width:"100%", padding:"16px 0", borderRadius:9999, border:"none", background:T.primary, color:T.white, fontSize: 16, fontWeight:700, cursor:"pointer", fontFamily:font}}
          >
            {useEditAsPrepPrimary ? "부족 품목 조정" : useConfirmAsPrepPrimary ? "준비 확인" : "품목 편집"}
          </button>
          {(showPrepEditSecondary || showPrepConfirmSecondary) && (
            <button
              type="button"
              onClick={showPrepEditSecondary ? openEditor : () => confirmSurgeryPrep(surgery.id)}
              style={{border:"none", background:"none", color:T.grey600, fontSize: 14, fontWeight:700, cursor:"pointer", fontFamily:font, padding:"4px 0"}}
            >
              {showPrepEditSecondary ? "품목 편집" : "그대로 준비 확인"}
            </button>
          )}
        </div>
      ) : expanded && !surgery.usage_confirmed && canConfirm ? (
        <div style={{borderTop:`1px solid ${T.grey100}`, padding:"10px 12px 12px", display:"flex", flexDirection:"column", gap:8}}>
          {showUsageNote ? (
            <input
              value={usageNote}
              onChange={event => setUsageNote(event.target.value)}
              placeholder="특이사항"
              style={{width:"100%", boxSizing:"border-box", border:`1px solid ${T.grey200}`, borderRadius:12, background:T.grey50, padding:"13px 14px", fontSize:15, fontFamily:font, color:T.grey800, outline:"none"}}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowUsageNote(true)}
              style={{alignSelf:"center", border:"none", background:"none", color:T.grey600, fontSize:14, fontWeight:700, fontFamily:font, cursor:"pointer", padding:"4px 0"}}
            >
              특이사항 추가
            </button>
          )}
          <button onClick={() => confirmSurgeryUsage(surgery.id, usageRows, usageNote)}
	            style={{width:"100%", padding:"16px 0", borderRadius:9999, border:"none", background:T.primary, color:T.white, fontSize: 16, fontWeight:700, cursor:"pointer", fontFamily:font}}>
            출고 확인
          </button>
        </div>
      ) : expanded && surgery.usage_confirmed && (
        <div style={{borderTop:`1px solid ${T.grey100}`, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10}}>
	          <p style={{margin:0, fontSize: 16, fontWeight:700, color:T.success}}>사용량 확인 완료</p>
          {canManage && <button onClick={openEditor}
            style={{border:"none", background:"none", color:T.grey600, fontSize: 14, fontWeight:700, cursor:"pointer", fontFamily:font, display:"flex", alignItems:"center", gap:5, padding:"4px 0"}}>
            <Edit2 size={15}/> 수정
          </button>}
        </div>
      )}
    </div>
  );
}
