import { useState, useEffect } from "react";
import { font } from "./constants/colors";
import { WifiOff } from "lucide-react";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { getApiConfig } from "./config/apiMode";
import { seedIfEmpty, resetToInitial } from "./api/seed";
import { usersApi } from "./api/usersApi";
import { itemsApi } from "./api/itemsApi";
import { txsApi } from "./api/txsApi";
import { ordersApi } from "./api/ordersApi";
import { surgeriesApi } from "./api/surgeriesApi";
import { notifsApi } from "./api/notifsApi";
import { authApi } from "./api/authApi";
import { supabaseAuthApi } from "./api/supabaseAuthApi";
import { usePersistedState } from "./hooks/usePersistedState";
import { useSupabaseClinicSync } from "./hooks/useSupabaseClinicSync";
import { LoginSelect } from "./components/auth/LoginSelect";
import { LoginPin } from "./components/auth/LoginPin";
import { LoginSupabase } from "./components/auth/LoginSupabase";
import { MainApp } from "./components/MainApp";
import { appRepository } from "./repositories/appRepository";
import {
  INITIAL_USERS,
  INIT_ITEMS,
  INIT_TXS,
  INIT_ORDERS,
  INIT_SURGERIES,
  INIT_NOTIFS,
} from "./data/initialData";

// 로컬 데모 모드에서만 초기 데이터를 저장한다. Supabase 모드는 브라우저 저장을 최소화한다.
if (!getApiConfig().isSupabaseMode) seedIfEmpty();

// PWA standalone 모드 감지 (홈 화면에서 실행 중인지)
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

function DentalStockInner() {
  const { tokens: dynamicT } = useTheme();
  const apiConfig = getApiConfig();
  const isSupabaseMode = apiConfig.isSupabaseMode;
  const [demoMode, setDemoMode] = useState(false);
  const useSupabaseBackend = isSupabaseMode && !demoMode;
  const [appState,    setAppState]    = useState(() => {
    if (isSupabaseMode) return "supabase_loading";
    return authApi.getCurrentUser() ? "app" : "login_select";
  });
  const [currentUser, setCurrentUser] = useState(() => isSupabaseMode ? null : authApi.getCurrentUser());
  const [pinTarget,   setPinTarget]   = useState(null);
  const [isOnline,    setIsOnline]    = useState(navigator.onLine);
  const [syncStatus,  setSyncStatus]  = useState("");

  const persistedOptions = { enabled: !useSupabaseBackend };
  const [users,     setUsers]     = usePersistedState(() => isSupabaseMode ? [] : usersApi.list(),     usersApi.save,     persistedOptions);
  const [items,     setItems]     = usePersistedState(() => isSupabaseMode ? [] : itemsApi.list(),     itemsApi.save,     persistedOptions);
  const [txs,       setTxs]       = usePersistedState(() => isSupabaseMode ? [] : txsApi.list(),       txsApi.save,       persistedOptions);
  const [orders,    setOrders]    = usePersistedState(() => isSupabaseMode ? [] : ordersApi.list(),    ordersApi.save,    persistedOptions);
  const [surgeries, setSurgeries] = usePersistedState(() => isSupabaseMode ? [] : surgeriesApi.list(), surgeriesApi.save, persistedOptions);
  const [notifs,    setNotifs]    = usePersistedState(() => isSupabaseMode ? [] : notifsApi.list(),    notifsApi.save,    persistedOptions);

  const { setSyncedNotifs } = useSupabaseClinicSync({
    useSupabaseBackend,
    currentUser,
    setCurrentUser,
    setAppState,
    setUsers,
    setItems,
    setOrders,
    setTxs,
    setNotifs,
    setSurgeries,
    setSyncStatus,
  });

  const unread        = notifs.filter(n=>!n.is_read).length;
  const pendingOrders = orders.filter(o=>o.status==="pending").length;

  // 개발/데모용: 콘솔에서 window.__dentalStockReset() 호출 시 초기화
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__dentalStockReset = () => { resetToInitial(); window.location.reload(); };
    }
  }, []);

  // 온라인/오프라인 감지
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const handleLogin = (user) => {
    if (!useSupabaseBackend) authApi.setSession(user);
    setCurrentUser(user);
    setAppState("app");
  };

  const enterDemoMode = () => {
    setDemoMode(true);
    setCurrentUser(null);
    setPinTarget(null);
    setSyncStatus("");
    authApi.clearSession();
    setUsers(INITIAL_USERS);
    setItems(INIT_ITEMS);
    setTxs(INIT_TXS);
    setOrders(INIT_ORDERS);
    setSurgeries(INIT_SURGERIES);
    setNotifs(INIT_NOTIFS);
    setAppState("login_select");
  };

  const handleLogout = async () => {
    if (useSupabaseBackend) {
      await supabaseAuthApi.signOut();
      appRepository.clearLocalData();
    } else {
      authApi.clearSession();
    }
    setCurrentUser(null);
    setPinTarget(null);
    setAppState(useSupabaseBackend ? "supabase_login" : "login_select");
  };

  const appContent = (
    <>
      {/* 오프라인 배너 */}
      {!isOnline && (
        <div style={{position:"absolute", top:0, left:0, right:0, zIndex:9999, background:dynamicT.grey900, color:dynamicT.white, padding:"10px 16px", display:"flex", alignItems:"center", gap:8, fontSize: 12, fontWeight:600, fontFamily:font}}>
          <WifiOff size={15}/> 오프라인 · 저장된 데이터로 동작 중
        </div>
      )}
      {syncStatus && appState==="app" && (
        <div style={{position:"absolute", top:0, left:0, right:0, zIndex:9998, background:dynamicT.grey900, color:dynamicT.white, padding:"10px 16px", textAlign:"center", fontSize:12, fontWeight:700, fontFamily:font}}>
          {syncStatus}
        </div>
      )}
      {appState==="supabase_loading" && (
        <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:dynamicT.grey500, fontSize:16, fontWeight:600}}>
          로그인 상태 확인 중...
        </div>
      )}
      {appState==="supabase_login" && <LoginSupabase onSuccess={handleLogin} onDemoSelect={enterDemoMode}/>}
      {appState==="login_select" && <LoginSelect users={users} onSelect={u=>{setPinTarget(u);setAppState("login_pin");}}/>}
      {appState==="login_pin"    && pinTarget && <LoginPin user={pinTarget} onSuccess={(u)=>handleLogin(u || pinTarget)} onBack={()=>{setPinTarget(null);setAppState("login_select");}}/>}
      {appState==="app"          && currentUser && (
        <MainApp
          currentUser={currentUser} users={users} setUsers={setUsers}
          items={items} setItems={setItems}
          txs={txs} setTxs={setTxs}
          orders={orders} setOrders={setOrders}
          surgeries={surgeries} setSurgeries={setSurgeries}
          notifs={notifs} setNotifs={setSyncedNotifs}
          unread={unread} pendingOrders={pendingOrders}
          onLogout={handleLogout}
        />
      )}
    </>
  );

  return (
    <>
      {isStandalone ? (
        /* ── PWA 설치 후: 완전 전체화면 ── */
        <div style={{width:"100vw", height:"100dvh", background:dynamicT.grey50, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative", fontFamily:font}}>
          {appContent}
        </div>
      ) : (
        /* ── 브라우저: 폰 프레임 미리보기 ── */
        <div style={{display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", background:dynamicT.grey100, fontFamily:font, padding:20}}>
          <div style={{width:"min(100%, 390px)", height:"min(844px, calc(100vh - 40px))", background:dynamicT.grey50, borderRadius:24, boxShadow:dynamicT.shadowFloating, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative"}}>
            {appContent}
          </div>
        </div>
      )}
      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        *::-webkit-scrollbar{display:none}
        html,body{overflow:hidden;overscroll-behavior:none}
      `}</style>
    </>
  );
}

export default function DentalStock() {
  return (
    <ThemeProvider>
      <DentalStockInner />
    </ThemeProvider>
  );
}
