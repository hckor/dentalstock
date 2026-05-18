import { useMemo } from "react";
import { ShoppingCart, Minus, Plus, Trash2, Truck, PackageCheck, XCircle, ClipboardList } from "lucide-react";
import { T, font, CS } from "../../constants/colors";
import { ORDER_ST } from "../../constants/orderStates";
import { fmtFull, catColor } from "../../utils/helpers";
import { Card } from "../shared/Card";
import { Divider } from "../shared/Divider";
import { Chip } from "../shared/Chip";
import { SecTitle } from "../shared/SecTitle";

export function OrderScreen({cart, allItems, orders, currentUser, updateCartQty, removeFromCart, submitCart, clearCart}) {
  const myOrders = useMemo(() => orders.filter(o => o.requested_by === currentUser.name), [orders, currentUser.name]);
  const totalQty = useMemo(() => cart.reduce((sum, c) => sum + c.qty, 0), [cart]);

  return (
    <div style={{padding:"16px"}}>
      {/* ─── 장바구니 섹션 ─── */}
      <SecTitle>
        <span style={{display:"inline-flex", alignItems:"center", gap:6}}>
          <ShoppingCart size={14} color={T.blue500}/>
          발주 장바구니 {cart.length > 0 && <span style={{color:T.blue500, fontWeight:700}}>({cart.length})</span>}
        </span>
      </SecTitle>

      {cart.length === 0 ? (
        <Card style={{padding:"32px 20px", marginBottom:24, textAlign:"center"}}>
          <div style={{width:48, height:48, borderRadius:9999, background:T.grey100, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px"}}>
            <ShoppingCart size={22} color={T.grey400}/>
          </div>
          <p style={{margin:"0 0 4px", fontSize:14, fontWeight:600, color:T.grey800}}>장바구니가 비어있어요</p>
          <p style={{margin:0, fontSize:12, color:T.grey500}}>재고 목록에서 [발주] 버튼을 눌러 담을 수 있어요</p>
        </Card>
      ) : (
        <>
          <Card style={{marginBottom:12, overflow:"hidden"}}>
            {cart.map((row, i) => {
              const item = allItems.find(it => it.id === row.item_id);
              if (!item) return null;
              return (
                <div key={row.item_id}>
                  <div style={{padding:"14px 16px"}}>
                    <div style={{display:"flex", alignItems:"flex-start", gap:10, marginBottom:10}}>
                      <div style={{width:6, height:6, borderRadius:9999, background:catColor(item.category_id), marginTop:7, flexShrink:0}}/>
                      <div style={{flex:1, minWidth:0}}>
                        <p style={{margin:0, fontSize:14, fontWeight:700, color:T.grey900}}>{item.name}</p>
                        <p style={{margin:"2px 0 0", fontSize:12, color:T.grey500}}>현재 {item.current_qty}{item.unit} · 최소 {item.min_qty}{item.unit}</p>
                        {row.note && <p style={{margin:"4px 0 0", fontSize:12, color:T.grey600, fontStyle:"italic"}}>"{row.note}"</p>}
                      </div>
                      <button onClick={()=>removeFromCart(row.item_id)} aria-label="삭제"
                        style={{border:"none", background:"none", cursor:"pointer", padding:4, color:T.red500}}>
                        <Trash2 size={16}/>
                      </button>
                    </div>
                    <div style={{display:"flex", alignItems:"center", gap:10}}>
                      <button onClick={()=>updateCartQty(row.item_id, Math.max(1, row.qty - 1))}
                        style={{width:32, height:32, borderRadius:9999, border:`1.5px solid ${T.grey200}`, background:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <Minus size={14} color={T.grey700}/>
                      </button>
                      <p style={{margin:0, fontSize:18, fontWeight:700, color:T.grey900, minWidth:36, textAlign:"center", fontVariantNumeric:"tabular-nums"}}>
                        {row.qty}<span style={{fontSize:12, fontWeight:400, color:T.grey500}}>{item.unit}</span>
                      </p>
                      <button onClick={()=>updateCartQty(row.item_id, row.qty + 1)}
                        style={{width:32, height:32, borderRadius:9999, border:"none", background:T.blue500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <Plus size={14} color={T.white}/>
                      </button>
                    </div>
                  </div>
                  {i < cart.length - 1 && <Divider/>}
                </div>
              );
            })}
          </Card>

          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 4px", marginBottom:12}}>
            <p style={{margin:0, fontSize:12, color:T.grey500}}>총 <span style={{fontWeight:700, color:T.grey800}}>{cart.length}개 품목</span> · <span style={{fontWeight:700, color:T.grey800}}>{totalQty}개 수량</span></p>
            <button onClick={clearCart} style={{border:"none", background:"none", cursor:"pointer", fontSize:12, color:T.grey500, fontFamily:font, textDecoration:"underline"}}>전체 비우기</button>
          </div>

          <button onClick={submitCart}
            style={{width:"100%", padding:"16px 0", borderRadius:9999, border:"none", cursor:"pointer", fontFamily:font, fontSize:15, fontWeight:700, color:T.white, background:T.blue500, boxShadow:CS, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:24}}>
            <Truck size={17}/> {cart.length}건 일괄 발주 요청
          </button>
        </>
      )}

      {/* ─── 내 발주 현황 ─── */}
      <SecTitle>
        <span style={{display:"inline-flex", alignItems:"center", gap:6}}>
          <ClipboardList size={14} color={T.grey700}/>
          내 발주 현황 {myOrders.length > 0 && <span style={{color:T.grey500}}>({myOrders.length})</span>}
        </span>
      </SecTitle>

      {myOrders.length === 0 ? (
        <Card style={{padding:"24px 20px", textAlign:"center"}}>
          <p style={{margin:0, fontSize:13, color:T.grey500}}>아직 요청한 발주가 없어요</p>
        </Card>
      ) : (
        <Card>
          {myOrders.map((o, i) => {
            const item = allItems.find(it => it.id === o.item_id);
            const os = ORDER_ST[o.status];
            return (
              <div key={o.id}>
                <div style={{display:"flex", alignItems:"center", gap:12, padding:"12px 16px"}}>
                  <div style={{width:32, height:32, borderRadius:8, background:os.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    {o.status === "ordered"   ? <Truck       size={14} color={os.text}/> :
                     o.status === "received"  ? <PackageCheck size={14} color={os.text}/> :
                     o.status === "rejected"  ? <XCircle      size={14} color={os.text}/> :
                                                <ShoppingCart size={14} color={os.text}/>}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{margin:0, fontSize:13, fontWeight:600, color:T.grey900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item?.name}</p>
                    <p style={{margin:"1px 0 0", fontSize:11, color:T.grey500}}>{fmtFull(o.requested_at)}{o.reviewed_by && ` · ${o.reviewed_by} ${o.status === "rejected" ? "거절" : "처리"}`}</p>
                  </div>
                  <div style={{textAlign:"right", flexShrink:0}}>
                    <Chip label={os.label} color={os.text} bg={os.bg}/>
                    <p style={{margin:"4px 0 0", fontSize:11, color:T.grey400}}>{o.qty}{item?.unit}</p>
                  </div>
                </div>
                {i < myOrders.length - 1 && <Divider/>}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
