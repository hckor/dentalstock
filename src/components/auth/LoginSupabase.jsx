import { useState } from "react";
import { LockKeyhole, Stethoscope } from "lucide-react";
import { T, font } from "../../constants/colors";
import { supabaseAuthApi } from "../../api/supabaseAuthApi";

function formatAuthError(error) {
  if (error?.message?.toLowerCase().includes("invalid login credentials")) {
    return "이메일 또는 비밀번호를 다시 확인해주세요";
  }
  if (error?.message === "supabase_not_configured") {
    return "Supabase 환경변수가 아직 설정되지 않았습니다";
  }
  if (error?.message === "inactive_profile") {
    return "비활성화된 계정입니다. 원장 계정에서 활성화해주세요";
  }
  return "로그인에 실패했습니다. 잠시 후 다시 시도해주세요";
}

export function LoginSupabase({ onSuccess, onDemoSelect }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const canSubmit = email.trim() && password && !busy;

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setMessage("");
    try {
      const user = await supabaseAuthApi.signInWithPassword({
        email: email.trim(),
        password,
      });
      onSuccess(user);
    } catch (error) {
      setMessage(formatAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", background:T.white}}>
      <div style={{padding:"56px 24px 32px", textAlign:"center"}}>
        <div style={{width:64, height:64, borderRadius:20, background:T.blue50, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px"}}>
          <Stethoscope size={34} color={T.blue500} strokeWidth={2.2}/>
        </div>
        <h1 style={{margin:"0 0 6px", fontSize:24, fontWeight:700, color:T.grey900}}>DentalStock</h1>
        <p style={{margin:0, fontSize:16, color:T.grey500}}>Supabase 계정으로 로그인하세요</p>
      </div>

      <form onSubmit={submit} style={{display:"flex", flexDirection:"column", gap:12, padding:"0 24px"}}>
        <label style={{display:"flex", flexDirection:"column", gap:8, fontFamily:font}}>
          <span style={{fontSize:13, fontWeight:700, color:T.grey600}}>이메일</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
            style={{height:52, border:`1px solid ${T.grey200}`, borderRadius:12, padding:"0 16px", fontSize:16, color:T.grey900, fontFamily:font, outlineColor:T.blue500, background:T.grey50}}
          />
        </label>

        <label style={{display:"flex", flexDirection:"column", gap:8, fontFamily:font}}>
          <span style={{fontSize:13, fontWeight:700, color:T.grey600}}>비밀번호</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            style={{height:52, border:`1px solid ${T.grey200}`, borderRadius:12, padding:"0 16px", fontSize:16, color:T.grey900, fontFamily:font, outlineColor:T.blue500, background:T.grey50}}
          />
        </label>

        {message && (
          <p style={{margin:"2px 0 0", color:T.red500, fontSize:13, fontWeight:600, lineHeight:1.5}}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{height:56, marginTop:8, border:0, borderRadius:12, background:canSubmit ? T.blue500 : T.grey200, color:T.white, fontSize:16, fontWeight:700, fontFamily:font, cursor:canSubmit ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}
        >
          <LockKeyhole size={18}/>
          {busy ? "확인 중..." : "로그인"}
        </button>

        {onDemoSelect && (
          <button
            type="button"
            onClick={onDemoSelect}
            style={{height:52, border:`1px solid ${T.grey200}`, borderRadius:12, background:T.white, color:T.grey800, fontSize:16, fontWeight:700, fontFamily:font, cursor:"pointer"}}
          >
            데모 프로필로 보기
          </button>
        )}
      </form>

      <p style={{margin:"auto 28px 28px", textAlign:"center", fontSize:13, lineHeight:1.5, color:T.grey500}}>
        실제 데이터는 Supabase 보안 정책으로 병원별 분리되고, 데모 프로필은 브라우저 안에서만 동작합니다.
      </p>
    </div>
  );
}
