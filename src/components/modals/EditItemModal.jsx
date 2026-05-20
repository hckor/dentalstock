import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { T, font } from "../../constants/colors";
import { CATEGORIES } from "../../constants/categories";
import { settingsApi } from "../../api/settingsApi";
import { supabaseItemsApi } from "../../api/supabaseItemsApi";
import { Inp } from "../shared/Inp";

export function EditItemModal({item, setItems, onClose, showToast}) {
  const [name,setName]=useState(item.name); const [catId,setCatId]=useState(item.category_id); const [unit,setUnit]=useState(item.unit); const [minQty,setMinQty]=useState(item.min_qty); const [loc,setLoc]=useState(item.location||"");
  const [vendorOptions, setVendorOptions] = useState(() => Array.isArray(item.vendor_options) ? item.vendor_options : []);
  const [saving, setSaving] = useState(false);
  const vendors = settingsApi.load().vendors;
  const updateVendorOption = (index, field, value) => setVendorOptions(prev => prev.map((option, i) => i === index ? {...option, [field]: value} : option));
  const addVendorOption = () => {
    const vendor = vendors[0] || {};
    setVendorOptions(prev => [...prev, {vendor_id: vendor.id || "", vendor_name: vendor.name || "", price: "", shipping_fee: "", min_order_qty: 1, sku: "", url: "", in_stock: true, last_checked_at: new Date().toISOString()}]);
  };
  const removeVendorOption = (index) => setVendorOptions(prev => prev.filter((_, i) => i !== index));
  const normalizeVendorOptions = () => vendorOptions
    .map(option => {
      const vendor = vendors.find(v => String(v.id) === String(option.vendor_id));
      return {
        vendor_id: option.vendor_id,
        vendor_name: option.vendor_name || vendor?.name || "",
        price: Number(option.price) || null,
        shipping_fee: Number(option.shipping_fee) || 0,
        min_order_qty: Math.max(1, Number(option.min_order_qty) || 1),
        sku: option.sku || "",
        url: option.url || "",
        in_stock: option.in_stock !== false,
        last_checked_at: option.last_checked_at || new Date().toISOString(),
      };
    })
    .filter(option => option.vendor_id && option.price);
  const submit=async()=>{
    if (saving) return;
    const nextItem = {...item,name,category_id:catId,unit,min_qty:minQty,location:loc,vendor_options:normalizeVendorOptions()};
    setSaving(true);
    try {
      if (supabaseItemsApi.isEnabled() && item.supabase_id) {
        const savedItem = await supabaseItemsApi.updateItemDetails(nextItem);
        setItems(p=>p.map(i=>i.id===item.id?{...i,...savedItem}:i));
      } else {
        setItems(p=>p.map(i=>i.id===item.id?nextItem:i));
      }
      showToast(`${name} 수정 완료`);
      onClose();
    } catch {
      showToast("품목 수정 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div style={{padding:"16px 20px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{margin:0,fontSize: 24,fontWeight:700,color:T.grey900}}>품목 수정</h2><button onClick={onClose} style={{border:"none",background:"none",cursor:"pointer"}}><X size={24} color={T.grey500}/></button></div>
      <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>품목명</p><Inp value={name} onChange={e=>setName(e.target.value)} style={{marginBottom:12}}/>
      <p style={{margin:"0 0 8px",fontSize: 16,fontWeight:600,color:T.grey700}}>카테고리</p>
      <div style={{display:"flex",gap:8,marginBottom:12}}>{CATEGORIES.map(c=><button key={c.id} onClick={()=>setCatId(c.id)} style={{flex:1,padding:"14px 0",borderRadius:9999,border:"none",cursor:"pointer",fontFamily:font,fontSize: 16,fontWeight:600,background:catId===c.id?T.blue500:T.grey100,color:catId===c.id?T.white:T.grey700}}>{c.name}</button>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>단위</p><Inp value={unit} onChange={e=>setUnit(e.target.value)}/></div>
        <div><p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>최소수량</p><Inp value={minQty} onChange={e=>setMinQty(parseInt(e.target.value)||1)} type="number"/></div>
      </div>
      <p style={{margin:"0 0 6px",fontSize: 16,fontWeight:600,color:T.grey700}}>보관 위치</p><Inp value={loc} onChange={e=>setLoc(e.target.value)} style={{marginBottom:16}}/>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:10}}>
        <p style={{margin:0,fontSize: 16,fontWeight:600,color:T.grey700}}>구매 후보</p>
        <button type="button" onClick={addVendorOption} style={{border:"none",borderRadius:9999,background:T.blue50,color:T.blue500,padding:"8px 12px",fontSize:13,fontWeight:700,fontFamily:font,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Plus size={15}/>후보 추가</button>
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:16}}>
        {vendorOptions.length === 0 && (
          <div style={{padding:"14px 16px", borderRadius:12, background:T.grey50, color:T.grey500, fontSize:14, lineHeight:1.45}}>
            사이트별 상품 URL과 가격을 등록하면 발주 시 최저가 거래처가 자동 선택됩니다.
          </div>
        )}
        {vendorOptions.map((option, index) => (
          <div key={index} style={{border:`1px solid ${T.grey200}`, borderRadius:12, padding:12, background:T.white}}>
            <div style={{display:"grid", gridTemplateColumns:"1fr 44px", gap:8, marginBottom:8}}>
              <select value={option.vendor_id} onChange={e=>{
                const vendor = vendors.find(v => String(v.id) === String(e.target.value));
                updateVendorOption(index, "vendor_id", e.target.value);
                updateVendorOption(index, "vendor_name", vendor?.name || "");
              }} style={{height:44,border:`1px solid ${T.grey200}`,borderRadius:12,background:T.grey50,padding:"0 12px",fontSize:15,fontWeight:700,color:T.grey800,fontFamily:font}}>
                <option value="">거래처 선택</option>
                {vendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
              </select>
              <button type="button" onClick={()=>removeVendorOption(index)} style={{border:"none",borderRadius:12,background:T.red50,color:T.red500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={17}/></button>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8}}>
              <Inp value={option.price ?? ""} onChange={e=>updateVendorOption(index, "price", e.target.value.replace(/[^0-9]/g, ""))} placeholder="상품가" inputMode="numeric"/>
              <Inp value={option.shipping_fee ?? ""} onChange={e=>updateVendorOption(index, "shipping_fee", e.target.value.replace(/[^0-9]/g, ""))} placeholder="배송비" inputMode="numeric"/>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8}}>
              <Inp value={option.min_order_qty ?? 1} onChange={e=>updateVendorOption(index, "min_order_qty", e.target.value.replace(/[^0-9]/g, ""))} placeholder="최소수량" inputMode="numeric"/>
              <Inp value={option.sku || ""} onChange={e=>updateVendorOption(index, "sku", e.target.value)} placeholder="상품코드"/>
            </div>
            <Inp value={option.url || ""} onChange={e=>updateVendorOption(index, "url", e.target.value)} placeholder="상품 URL" style={{marginBottom:8}}/>
            <button type="button" onClick={()=>updateVendorOption(index, "in_stock", option.in_stock === false)} style={{width:"100%",height:40,border:"none",borderRadius:9999,background:option.in_stock === false ? T.grey100 : T.green50,color:option.in_stock === false ? T.grey600 : T.green500,fontSize:14,fontWeight:700,fontFamily:font,cursor:"pointer"}}>
              {option.in_stock === false ? "품절로 표시됨" : "재고 있음"}
            </button>
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={saving} style={{width:"100%",padding:"16px 0",borderRadius:9999,border:"none",background:saving?T.grey200:T.blue500,color:T.white,fontSize: 16,fontWeight:600,cursor:saving?"default":"pointer",fontFamily:font}}>{saving ? "저장 중..." : "수정 완료"}</button>
    </div>
  );
}
