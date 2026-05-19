import { useState, useEffect } from "react";
import { font } from "./constants/colors";
import { WifiOff } from "lucide-react";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { seedIfEmpty, resetToInitial } from "./api/seed";
import { usersApi } from "./api/usersApi";
import { itemsApi } from "./api/itemsApi";
import { txsApi } from "./api/txsApi";
import { ordersApi } from "./api/ordersApi";
import { surgeriesApi } from "./api/surgeriesApi";
import { notifsApi } from "./api/notifsApi";
import { authApi } from "./api/authApi";
import { cartApi } from "./api/cartApi";
import { usePersistedState } from "./hooks/usePersistedState";
import { LoginSelect } from "./components/auth/LoginSelect";
import { LoginPin } from "./components/auth/LoginPin";
import { MainApp } from "./components/MainApp";

// 모듈 로드 시점에 1회 시드 (테스트에서도 안전하게 호출됨)
seedIfEmpty();

// PWA standalone 모드 감지 (홈 화면에서 실행 중인지)
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

function DentalStockInner() {
  const { tokens: dynamicT } = useTheme();
  const [appState,    setAppState]    = useState(() => authApi.getCurrentUser() ? "app" : "login_select");
  const [currentUser, setCurrentUser] = useState(() => authApi.getCurrentUser());
  const [pinTarget,   setPinTarget]   = useState(null);
  const [isOnline,    setIsOnline]    = useState(navigator.onLine);

  const [users,     setUsers]     = usePersistedState(() => usersApi.list(),     usersApi.save);
  const [items,     setItems]     = usePersistedState(() => itemsApi.list(),     itemsApi.save);
  const [txs,       setTxs]       = usePersistedState(() => txsApi.list(),       txsApi.save);
  const [orders,    setOrders]    = usePersistedState(() => ordersApi.list(),    ordersApi.save);
  const [surgeries, setSurgeries] = usePersistedState(() => surgeriesApi.list(), surgeriesApi.save);
  const [notifs,    setNotifs]    = usePersistedState(() => notifsApi.list(),    notifsApi.save);
  const [cart,      setCart]      = useState(() => currentUser ? cartApi.list(currentUser.id) : []);

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

  // cart 사용자별 동기화
  useEffect(() => {
    if (currentUser) {
      cartApi.save(currentUser.id, cart);
    }
  }, [cart, currentUser]);

  const handleLogin = (user) => {
    authApi.setSession(user);
    setCurrentUser(user);
    setCart(cartApi.list(user.id));
    setAppState("app");
  };

  const handleLogout = () => {
    authApi.clearSession();
    setCurrentUser(null);
    setPinTarget(null);
    setCart([]);
    setAppState("login_select");
  };

  const appContent = (
    <>
      {/* 오프라인 배너 */}
      {!isOnline && (
        <div style={{position:"absolute", top:0, left:0, right:0, zIndex:9999, background:"#1e293b", color:"#fff", padding:"16px 16px", display:"flex", alignItems:"center", gap:8, fontSize:14, fontWeight:600, fontFamily:font}}>
          <WifiOff size={18}/> 오프라인 · 저장된 데이터로 동작 중
        </div>
      )}
      {appState==="login_select" && <LoginSelect users={users} onSelect={u=>{setPinTarget(u);setAppState("login_pin");}}/>}
      {appState==="login_pin"    && pinTarget && <LoginPin user={pinTarget} onSuccess={(u)=>handleLogin(u || pinTarget)} onBack={()=>{setPinTarget(null);setAppState("login_select");}}/>}
      {appState==="app"          && currentUser && (
        <MainApp
          currentUser={currentUser} users={users} setUsers={setUsers}
          items={items} setItems={setItems}
          txs={txs} setTxs={setTxs}
          orders={orders} setOrders={setOrders}
          surgeries={surgeries} setSurgeries={setSurgeries}
          notifs={notifs} setNotifs={setNotifs}
          cart={cart} setCart={setCart}
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
          <div style={{width:"min(100%, 390px)", height:"min(844px, calc(100vh - 40px))", background:dynamicT.grey50, borderRadius:24, boxShadow:"0px 8px 24px rgba(0,0,0,0.16)", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative"}}>
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
