import { useCallback, useState, useEffect } from "react";
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
import { settingsApi } from "./api/settingsApi";
import { auditLogsApi } from "./api/auditLogsApi";
import { supabaseAuthApi } from "./api/supabaseAuthApi";
import { supabaseActivityApi } from "./api/supabaseActivityApi";
import { supabaseItemsApi } from "./api/supabaseItemsApi";
import { supabaseOrdersApi } from "./api/supabaseOrdersApi";
import { supabaseSettingsApi } from "./api/supabaseSettingsApi";
import { supabaseSurgeriesApi } from "./api/supabaseSurgeriesApi";
import { usePersistedState } from "./hooks/usePersistedState";
import { LoginSelect } from "./components/auth/LoginSelect";
import { LoginPin } from "./components/auth/LoginPin";
import { LoginSupabase } from "./components/auth/LoginSupabase";
import { MainApp } from "./components/MainApp";

// 모듈 로드 시점에 1회 시드 (테스트에서도 안전하게 호출됨)
seedIfEmpty();

// PWA standalone 모드 감지 (홈 화면에서 실행 중인지)
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

function DentalStockInner() {
  const { tokens: dynamicT } = useTheme();
  const apiConfig = getApiConfig();
  const isSupabaseMode = apiConfig.isSupabaseMode;
  const [appState,    setAppState]    = useState(() => {
    if (isSupabaseMode) return "supabase_loading";
    return authApi.getCurrentUser() ? "app" : "login_select";
  });
  const [currentUser, setCurrentUser] = useState(() => isSupabaseMode ? null : authApi.getCurrentUser());
  const [pinTarget,   setPinTarget]   = useState(null);
  const [isOnline,    setIsOnline]    = useState(navigator.onLine);
  const [syncStatus,  setSyncStatus]  = useState("");

  const [users,     setUsers]     = usePersistedState(() => usersApi.list(),     usersApi.save);
  const [items,     setItems]     = usePersistedState(() => itemsApi.list(),     itemsApi.save);
  const [txs,       setTxs]       = usePersistedState(() => txsApi.list(),       txsApi.save);
  const [orders,    setOrders]    = usePersistedState(() => ordersApi.list(),    ordersApi.save);
  const [surgeries, setSurgeries] = usePersistedState(() => surgeriesApi.list(), surgeriesApi.save);
  const [notifs,    setNotifs]    = usePersistedState(() => notifsApi.list(),    notifsApi.save);

  const setSyncedNotifs = useCallback((updater) => {
    setNotifs(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (isSupabaseMode && currentUser?.clinicId) {
        void supabaseActivityApi.saveNotifsForClinic(currentUser.clinicId, next).catch(() => {});
      }
      return next;
    });
  }, [currentUser, isSupabaseMode, setNotifs]);

  const unread        = notifs.filter(n=>!n.is_read).length;
  const pendingOrders = orders.filter(o=>o.status==="pending").length;

  useEffect(() => {
    if (!isSupabaseMode) return;
    let ignore = false;
    supabaseAuthApi.getCurrentUser()
      .then(user => {
        if (ignore) return;
        if (user) {
          setCurrentUser(user);
          setAppState("app");
        } else {
          setAppState("supabase_login");
        }
      })
      .catch(() => {
        if (!ignore) setAppState("supabase_login");
      });
    return () => {
      ignore = true;
    };
  }, [isSupabaseMode]);

  useEffect(() => {
    if (!isSupabaseMode || !currentUser?.clinicId) return;
    let ignore = false;
    supabaseItemsApi.listByClinic(currentUser.clinicId)
      .then(remoteItems => {
        if (ignore) return;
        if (remoteItems.length > 0) setItems(remoteItems);
        setSyncStatus(remoteItems.length > 0 ? "" : "Supabase 재고 데이터가 아직 없습니다");
      })
      .catch(() => {
        if (!ignore) setSyncStatus("Supabase 재고를 불러오지 못했습니다");
      });
    return () => {
      ignore = true;
    };
  }, [currentUser?.clinicId, isSupabaseMode, setItems]);

  useEffect(() => {
    if (!isSupabaseMode || !currentUser?.clinicId) return;
    let ignore = false;
    supabaseOrdersApi.listByClinic(currentUser.clinicId)
      .then(remoteOrders => {
        if (ignore) return;
        if (remoteOrders.length > 0) setOrders(remoteOrders);
      })
      .catch(() => {
        if (!ignore) setSyncStatus("Supabase 발주 데이터를 불러오지 못했습니다");
      });
    return () => {
      ignore = true;
    };
  }, [currentUser?.clinicId, isSupabaseMode, setOrders]);

  useEffect(() => {
    if (!isSupabaseMode || !currentUser?.clinicId) return;
    let ignore = false;
    supabaseActivityApi.listTxsByClinic(currentUser.clinicId)
      .then(remoteTxs => {
        if (ignore) return;
        if (remoteTxs.length > 0) setTxs(remoteTxs);
      })
      .catch(() => {
        if (!ignore) setSyncStatus("Supabase 입출고 내역을 불러오지 못했습니다");
      });
    return () => {
      ignore = true;
    };
  }, [currentUser?.clinicId, isSupabaseMode, setTxs]);

  useEffect(() => {
    if (!isSupabaseMode || !currentUser?.clinicId) return;
    let ignore = false;
    supabaseActivityApi.listNotifsByClinic(currentUser.clinicId)
      .then(remoteNotifs => {
        if (ignore) return;
        if (remoteNotifs.length > 0) setNotifs(remoteNotifs);
      })
      .catch(() => {
        if (!ignore) setSyncStatus("Supabase 알림을 불러오지 못했습니다");
      });
    return () => {
      ignore = true;
    };
  }, [currentUser?.clinicId, isSupabaseMode, setNotifs]);

  useEffect(() => {
    if (!isSupabaseMode || !currentUser?.clinicId) return;
    let ignore = false;
    supabaseActivityApi.listAuditLogsByClinic(currentUser.clinicId)
      .then(remoteLogs => {
        if (ignore) return;
        if (remoteLogs.length > 0) auditLogsApi.save(remoteLogs);
      })
      .catch(() => {
        if (!ignore) setSyncStatus("Supabase 활동 로그를 불러오지 못했습니다");
      });
    return () => {
      ignore = true;
    };
  }, [currentUser?.clinicId, isSupabaseMode]);

  useEffect(() => {
    if (!isSupabaseMode || !currentUser?.clinicId) return;
    let ignore = false;
    supabaseSurgeriesApi.listByClinic(currentUser.clinicId)
      .then(remoteSurgeries => {
        if (ignore) return;
        if (remoteSurgeries.length > 0) setSurgeries(remoteSurgeries);
      })
      .catch(() => {
        if (!ignore) setSyncStatus("Supabase 수술 데이터를 불러오지 못했습니다");
      });
    return () => {
      ignore = true;
    };
  }, [currentUser?.clinicId, isSupabaseMode, setSurgeries]);

  useEffect(() => {
    if (!isSupabaseMode || !currentUser?.clinicId) return;
    let ignore = false;
    supabaseSettingsApi.getForClinic(currentUser.clinicId)
      .then(remoteSettings => {
        if (ignore || !remoteSettings) return;
        settingsApi.set(remoteSettings);
      })
      .catch(() => {
        if (!ignore) setSyncStatus("Supabase 설정을 불러오지 못했습니다");
      });
    return () => {
      ignore = true;
    };
  }, [currentUser?.clinicId, isSupabaseMode]);

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
    if (!isSupabaseMode) authApi.setSession(user);
    setCurrentUser(user);
    setAppState("app");
  };

  const handleLogout = async () => {
    if (isSupabaseMode) {
      await supabaseAuthApi.signOut();
    } else {
      authApi.clearSession();
    }
    setCurrentUser(null);
    setPinTarget(null);
    setAppState(isSupabaseMode ? "supabase_login" : "login_select");
  };

  const appContent = (
    <>
      {/* 오프라인 배너 */}
      {!isOnline && (
        <div style={{position:"absolute", top:0, left:0, right:0, zIndex:9999, background:"#1e293b", color:"#fff", padding:"10px 16px", display:"flex", alignItems:"center", gap:8, fontSize: 12, fontWeight:600, fontFamily:font}}>
          <WifiOff size={15}/> 오프라인 · 저장된 데이터로 동작 중
        </div>
      )}
      {syncStatus && appState==="app" && (
        <div style={{position:"absolute", top:0, left:0, right:0, zIndex:9998, background:dynamicT.grey900, color:"#fff", padding:"10px 16px", textAlign:"center", fontSize:12, fontWeight:700, fontFamily:font}}>
          {syncStatus}
        </div>
      )}
      {appState==="supabase_loading" && (
        <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:dynamicT.grey500, fontSize:16, fontWeight:600}}>
          로그인 상태 확인 중...
        </div>
      )}
      {appState==="supabase_login" && <LoginSupabase onSuccess={handleLogin}/>}
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
