import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { supabaseItemsApi } from "../../api/supabaseItemsApi";
import { T, font } from "../../constants/colors";
import { CATEGORIES } from "../../constants/categories";
import { findSimilarInventoryItem } from "../../utils/itemIdentity";
import { Inp } from "../shared/Inp";

export function AddItemModal({items = [], setItems, currentUser, onClose, showToast}) {
  const [name,setName]=useState("");
  const [catId,setCatId]=useState(1);
  const [unit,setUnit]=useState("개");
  const [currentQty,setCurrentQty]=useState(0);
  const [minQty,setMinQty]=useState(5);
  const [loc,setLoc]=useState("");
  const [saving,setSaving]=useState(false);
  const normalizedName = name.trim();
  const duplicateMatch = useMemo(
    () => findSimilarInventoryItem(items, normalizedName),
    [items, normalizedName]
  );
  const duplicated = duplicateMatch?.kind === "exact";
  const similarItem = duplicateMatch?.kind === "similar" ? duplicateMatch.item : null;

  const submit=async(isTemporary=false)=>{
    if(!normalizedName || saving) return;
    if(duplicated){showToast("이미 등록된 품목입니다");return;}

    const newItem = {
      id:`i${Date.now()}`,
      name:normalizedName,
      category_id:catId,
      unit:unit.trim() || "개",
      current_qty:Math.max(0, Number(currentQty) || 0),
      min_qty:Math.max(0, Number(minQty) || 0),
      location:loc.trim(),
      expiry:null,
      ...(isTemporary ? {
        is_temporary:true,
        temporary_status:"needs_review",
        temporary_reason:"카탈로그에 없는 품목",
        created_from:"add_item",
      } : {}),
    };

    setSaving(true);
    try {
      if (supabaseItemsApi.isEnabled()) {
        if (!currentUser?.clinicId) throw new Error("clinic_required");
        const savedItem = await supabaseItemsApi.createItem(currentUser.clinicId, newItem);
        setItems(p=>[...p,savedItem]);
      } else {
        setItems(p=>[...p,newItem]);
      }
      showToast(isTemporary ? `${normalizedName} 임시 품목 추가 완료` : `${normalizedName} 품목 추가 완료`);
      onClose();
    } catch (error) {
      console.error("Failed to add item", error);
      showToast("품목 추가 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{margin:0,fontSize: 24,fontWeight:700,color:T.grey900}}>품목 추가</h2><button aria-label="닫기" onClick={onClose} style={{border:"none",background:"none",cursor:"pointer"}}><X size={24} color={T.grey500}/></button></div>
      <div style={{background:T.blue50,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
        <p style={{margin:0,fontSize:14,lineHeight:"20px",color:T.blue500,fontWeight:700}}>DB에 없는 물건은 임시 품목으로 추가하고 나중에 정리할 수 있습니다.</p>
      </div>
      <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>품목명</p><Inp value={name} onChange={e=>setName(e.target.value)} placeholder="예: 라텍스 장갑 (L)" style={{marginBottom:12}}/>
      {duplicateMatch && (
        <div style={{margin:"-6px 0 12px",borderRadius:12,background:duplicated?T.red50:T.orange50,padding:"10px 12px"}}>
          <p style={{margin:0,fontSize:13,lineHeight:"19px",color:duplicated?T.red500:T.orange500,fontWeight:700}}>
            {duplicated
              ? `이미 같은 품목이 있어요: ${duplicateMatch.item.name}`
              : `비슷한 품목이 있어요: ${similarItem.name}`}
          </p>
          <p style={{margin:"2px 0 0",fontSize:12,lineHeight:"18px",color:T.grey600}}>
            {duplicated ? "기존 품목에서 입고 등록이나 수량보정을 사용해주세요." : "규격이 다른 물건이면 그대로 추가해도 됩니다."}
          </p>
        </div>
      )}
      <p style={{margin:"0 0 8px",fontSize: 16,fontWeight:600,color:T.grey700}}>카테고리</p>
      <div style={{display:"flex",gap:8,marginBottom:12}}>{CATEGORIES.map(c=><button key={c.id} onClick={()=>setCatId(c.id)} style={{flex:1,padding:"14px 0",borderRadius:9999,border:"none",cursor:"pointer",fontFamily:font,fontSize: 16,fontWeight:600,background:catId===c.id?T.blue500:T.grey100,color:catId===c.id?T.white:T.grey700}}>{c.name}</button>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>단위</p><Inp value={unit} onChange={e=>setUnit(e.target.value)} placeholder="개/박스"/></div>
        <div><p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>현재수량</p><Inp value={currentQty} onChange={e=>setCurrentQty(e.target.value)} type="number" inputMode="numeric"/></div>
      </div>
      <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>최소수량</p><Inp value={minQty} onChange={e=>setMinQty(e.target.value)} type="number" inputMode="numeric" style={{marginBottom:12}}/>
      <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>보관 위치</p><Inp value={loc} onChange={e=>setLoc(e.target.value)} placeholder="예: 창고 A-1" style={{marginBottom:16}}/>
      <button disabled={!normalizedName || duplicated || saving} onClick={()=>submit(false)} style={{width:"100%",padding:"16px 0",borderRadius:9999,border:"none",background:!normalizedName || duplicated || saving?T.grey200:T.blue500,color:!normalizedName || duplicated || saving?T.grey500:T.white,fontSize: 16,fontWeight:600,cursor:!normalizedName || duplicated || saving?"default":"pointer",fontFamily:font,marginBottom:8}}>{saving ? "저장 중..." : "정식 품목 추가"}</button>
      <button disabled={!normalizedName || duplicated || saving} onClick={()=>submit(true)} style={{width:"100%",padding:"16px 0",borderRadius:9999,border:`1.5px solid ${!normalizedName || duplicated || saving ? T.grey200 : T.orange500+"33"}`,background:!normalizedName || duplicated || saving?T.grey100:T.orange50,color:!normalizedName || duplicated || saving?T.grey500:T.orange500,fontSize: 16,fontWeight:700,cursor:!normalizedName || duplicated || saving?"default":"pointer",fontFamily:font}}>임시 품목으로 추가</button>
    </div>
  );
}
