import { useMemo } from "react";
import { ShoppingCart, Minus, Plus, Trash2, Truck, PackageCheck, XCircle, ClipboardList } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { fmtFull, catColor } from "../../utils/helpers";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";
import { Chip } from "../shared/Chip";

export function OrderScreen({cart, allItems, orders, currentUser, updateCartQty, removeFromCart, submitCart, clearCart}) {
  const myOrders = useMemo(() => orders.filter(o => o.requested_by === currentUser.name), [orders, currentUser.name]);
  const totalQty = useMemo(() => cart.reduce((sum, c) => sum + c.qty, 0), [cart]);

  const statusIcon = (status) => {
    if (status === "ordered")  return <Truck size={18} color={ORDER_ST[status].text}/>;
    if (status === "received") return <PackageCheck size={18} color={ORDER_ST[status].text}/>;
    if (status === "rejected") return <XCircle size={18} color={ORDER_ST[status].text}/>;
    return <ShoppingCart size={18} color={ORDER_ST[status].text}/>;
  };

  return (
    <div style={{padding:"16px"}}>

      {/* ── 장바구니 ── */}
      <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:12}}>
        <ShoppingCart size={18} color={T.blue500}/>
        <p style={{margin:0, fontSize:22, fontWeight:700, color:T.grey900}}>발주 장바구니</p>
        {cart.length > 0 && <span style={{fontSize:19, fontWeight:700, color:T.blue500}}>({cart.length})</span>}
      </div>

      {cart.length === 0 ? (
        <button onClick={()=>{}} style={{width:"100%", padding:"20px 16px", borderRadius:14, border:`1.5px dashed ${T.grey200}`, background:"none", cursor:"default", fontFamily:font, display:"flex", alignItems:"center", gap:12, marginBottom:24}}>
          <div style={{width:48, height:48, borderRadius:9999, background:T.grey100, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
            <ShoppingCart size={22} color={T.grey400}/>
          </div>
          <div style={{textAlign:"left"}}>
            <p style={{margin:"0 0 2px", fontSize:20, fontWeight:600, color:T.grey700}}>장바구니가 비어있어요</p>
            <p style={{margin:0, fontSize:18, color:T.grey500}}>재고 목록 → [발주] 버튼으로 담을 수 있어요</p>
          </div>
        </button>
      ) : (
        <>
          <Card style={{marginBottom:10, overflow:"hidden"}}>
            {cart.map((row, i) => {
              const item = allItems.find(it => it.id === row.item_id);
              if (!item) return null;
              return (
                <div key={row.item_id}>
                  <div style={{padding:"18px 20px"}}>
                    <div style={{display:"flex", alignItems:"flex-start", gap:10, marginBottom:10}}>
                      <div style={{width:6, height:6, borderRadius:9999, background:catColor(item.category_id), marginTop:7, flexShrink:0}}/>
                      <div style={{flex:1, minWidth:0}}>
                        <p style={{margin:0, fontSize:20, fontWeight:700, color:T.grey900}}>{item.name}</p>
                        <p style={{margin:"2px 0 0", fontSize:18, color:T.grey500}}>현재 {item.current_qty}{item.unit} · 최소 {item.min_qty}{item.unit}</p>
                        {row.note && <p style={{margin:"3px 0 0", fontSize:18, color:T.grey600, fontStyle:"italic"}}>"{row.note}"</p>}
                      </div>
                      <button onClick={()=>removeFromCart(row.item_id)} style={{border:"none", background:"none", cursor:"pointer", padding:4, color:T.red500}}>
                        <Trash2 size={18}/>
                      </button>
                    </div>
                    <div style={{display:"flex", alignItems:"center", gap:10}}>
                      <button onClick={()=>updateCartQty(row.item_id, Math.max(1, row.qty-1))} style={{width:44, height:44, borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <Minus size={18} color={T.grey700}/>
                      </button>
                      <p style={{margin:0, fontSize:26, fontWeight:700, color:T.grey900, minWidth:40, textAlign:"center", fontVariantNumeric:"tabular-nums"}}>
                        {row.qty}<span style={{fontSize:18, fontWeight:400, color:T.grey500}}>{item.unit}</span>
                      </p>
                      <button onClick={()=>updateCartQty(row.item_id, row.qty+1)} style={{width:44, height:44, borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <Plus size={18} color={T.white}/>
                      </button>
                    </div>
                  </div>
                  {i < cart.length-1 && <Divider/>}
                </div>
              );
            })}
          </Card>

          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 4px 12px"}}>
            <p style={{margin:0, fontSize:18, color:T.grey500}}>총 <span style={{fontWeight:700, color:T.grey800}}>{cart.length}개 품목</span> · <span style={{fontWeight:700, color:T.grey800}}>{totalQty}개</span></p>
            <button onClick={clearCart} style={{border:"none", background:"none", cursor:"pointer", fontSize:18, color:T.grey400, fontFamily:font, textDecoration:"underline"}}>전체 비우기</button>
          </div>

          <button onClick={submitCart} style={{width:"100%", padding:"16px 0", borderRadius:9999, border:"none", cursor:"pointer", fontFamily:font, fontSize:22, fontWeight:700, color:T.white, background:T.blue500, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:24}}>
            <Truck size={20}/> {cart.length}건 일괄 발주 요청
          </button>
        </>
      )}

      {/* ── 내 발주 현황 ── */}
      <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:12}}>
        <ClipboardList size={18} color={T.grey600}/>
        <p style={{margin:0, fontSize:22, fontWeight:700, color:T.grey900}}>내 발주 현황</p>
        {myOrders.length > 0 && <span style={{fontSize:19, color:T.grey500}}>({myOrders.length})</span>}
      </div>

      {myOrders.length === 0 ? (
        <Card style={{padding:"24px 20px", textAlign:"center"}}>
          <p style={{margin:0, fontSize:19, color:T.grey500}}>아직 요청한 발주가 없어요</p>
        </Card>
      ) : (
        <Card>
          {myOrders.map((o, i) => {
            const item = allItems.find(it => it.id === o.item_id);
            const os = ORDER_ST[o.status];
            return (
              <div key={o.id}>
                <div style={{display:"flex", alignItems:"center", gap:12, padding:"18px 20px"}}>
                  <div style={{width:44, height:44, borderRadius:10, background:os.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    {statusIcon(o.status)}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{margin:0, fontSize:19, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name}</p>
                    <p style={{margin:"2px 0 0", fontSize:16, color:T.grey500}}>
                      {fmtFull(o.requested_at)}
                      {o.reviewed_by && ` · ${o.reviewed_by} ${o.status==="rejected"?"거절":"처리"}`}
                    </p>
                  </div>
                  <div style={{textAlign:"right", flexShrink:0}}>
                    <Chip label={os.label} color={os.text} bg={os.bg}/>
                    <p style={{margin:"4px 0 0", fontSize:16, color:T.grey400}}>{o.qty}{item?.unit}</p>
                  </div>
                </div>
                {i < myOrders.length-1 && <Divider/>}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
