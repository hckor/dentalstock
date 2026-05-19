import { T } from "../../constants/colors";

export function BottomSheet({ onClose, children }) {
  return (
    <div
      style={{position:"absolute", inset:0, background:"rgba(2,9,19,0.5)", zIndex:99, display:"flex", justifyContent:"center", alignItems:"flex-end"}}
      onClick={onClose}
    >
      <div
        style={{background:T.white, borderRadius:"16px 16px 0 0", width:"100%", maxHeight:"85vh", overflowY:"auto", paddingBottom:32, boxShadow:"0px -4px 12px rgba(0,0,0,0.08)"}}
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
