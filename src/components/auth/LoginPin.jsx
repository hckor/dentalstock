import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { T, font } from "../../constants/colors";
import { ROLE_META } from "../../constants/permissions";
import { Avatar } from "../shared/Avatar";
import { PinPad } from "../shared/PinPad";
import { PinDots } from "../shared/PinDots";
import { authApi, getLockState } from "../../api/authApi";

const LEN = 4;

function formatRemaining(ms) {
  const sec = Math.ceil(ms / 1000);
  return `${sec}초`;
}

export function LoginPin({user, onSuccess, onBack}) {
  const [pin,    setPin]    = useState("");
  const [error,  setError]  = useState(false);
  const [shake,  setShake]  = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [msg,    setMsg]    = useState("");
  const [lockMs, setLockMs] = useState(getLockState(user.id).remainingMs);

  // 잠금 카운트다운
  useEffect(() => {
    if (lockMs <= 0) return;
    const id = setInterval(() => {
      const next = getLockState(user.id);
      setLockMs(next.remainingMs);
      if (!next.locked) setMsg("");
    }, 500);
    return () => clearInterval(id);
  }, [lockMs, user.id]);

  const locked = lockMs > 0;

  const onKey = async (k) => {
    if (busy || locked || pin.length >= LEN) return;
    const next = pin + k;
    setPin(next);
    if (next.length < LEN) return;

    setBusy(true);
    const result = await authApi.verifyPin(user.id, next);
    setBusy(false);

    if (result.ok) {
      onSuccess(result.user);
      return;
    }

    setError(true);
    setShake(true);
    if (result.reason === "locked") {
      setMsg(`5회 실패 — ${formatRemaining(result.remainingMs)} 후 다시 시도하세요`);
      setLockMs(result.remainingMs);
    } else if (result.reason === "invalid" && result.attemptsLeft != null) {
      setMsg(`PIN이 올바르지 않습니다 (남은 시도 ${result.attemptsLeft}회)`);
    } else {
      setMsg("PIN이 올바르지 않습니다");
    }
    setTimeout(() => { setPin(""); setError(false); setShake(false); }, 600);
  };

  const m = ROLE_META[user.role];
  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", background:T.white}}>
      <button onClick={onBack} style={{alignSelf:"flex-start", margin:"16px 16px 0", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:T.grey600, fontFamily:font, fontSize:14}}>
        <ChevronRight size={16} style={{transform:"rotate(180deg)"}}/> 다른 계정
      </button>
      <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 32px"}}>
        <Avatar name={user.name} role={user.role} size={72}/>
        <p style={{margin:"16px 0 4px", fontSize:20, fontWeight:700, color:T.grey900}}>{user.name}</p>
        <span style={{fontSize:13, fontWeight:600, color:m.color, background:m.bg, padding:"3px 12px", borderRadius:9999, marginBottom:8}}>{m.label}</span>
        <p style={{margin:0, fontSize:14, color:T.grey500}}>
          {locked ? `잠금 해제까지 ${formatRemaining(lockMs)}` : "PIN 4자리를 입력하세요"}
        </p>
        <div style={{animation:shake?"shake 400ms":"none"}}><PinDots length={LEN} filled={pin.length} error={error}/></div>
        {msg && <p style={{margin:"0 0 12px", fontSize:13, color:T.red500, fontWeight:600, textAlign:"center"}}>{msg}</p>}
      </div>
      <div style={{padding:"0 24px 40px", opacity:locked?0.4:1, pointerEvents:locked?"none":"auto"}}>
        <PinPad onChange={onKey} onDelete={()=>{setPin(p=>p.slice(0,-1)); setError(false); setMsg("");}}/>
      </div>
    </div>
  );
}
