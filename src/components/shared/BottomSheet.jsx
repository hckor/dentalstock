import { T } from "../../constants/colors";

export function BottomSheet({ onClose, children }) {
  return (
    <div
      style={{position:"absolute", inset:0, background:T.overlay, zIndex:300, display:"flex", justifyContent:"center", alignItems:"flex-end"}}
      onClick={onClose}
    >
      <div
        style={{background:T.surface, borderRadius:"16px 16px 0 0", width:"100%", maxHeight:"85vh", overflowY:"auto", paddingBottom:32, boxShadow:T.shadowSheet}}
        onClick={e=>e.stopPropagation()}
      >
        <div style={{display:"flex", justifyContent:"center", padding:"12px 0 0"}}>
          <div style={{width:36, height:4, borderRadius:9999, background:T.grey200}}/>
        </div>
        {children}
      </div>
    </div>
  );
}
