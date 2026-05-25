import { useCallback, useEffect } from "react";
import { auditLogsApi } from "../api/auditLogsApi";
import { settingsApi } from "../api/settingsApi";
import { supabaseActivityApi } from "../api/supabaseActivityApi";
import { supabaseAuthApi } from "../api/supabaseAuthApi";
import { supabaseItemsApi } from "../api/supabaseItemsApi";
import { supabaseOrdersApi } from "../api/supabaseOrdersApi";
import { supabaseSettingsApi } from "../api/supabaseSettingsApi";
import { supabaseStaffApi } from "../api/supabaseStaffApi";
import { supabaseSurgeriesApi } from "../api/supabaseSurgeriesApi";
import { appRepository } from "../repositories/appRepository";
import { handleAppError } from "../utils/errorHandling";

const applyIfNotEmpty = (setter) => (rows) => {
  if (rows.length > 0) setter(rows);
};

export function useSupabaseClinicSync({
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
}) {
  const clinicId = currentUser?.clinicId;

  const setSyncedNotifs = useCallback((updater) => {
    setNotifs(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (useSupabaseBackend && clinicId) {
        void supabaseActivityApi.saveNotifsForClinic(clinicId, next)
          .catch(error => handleAppError(error, { context: "supabase.notifs.save" }));
      }
      return next;
    });
  }, [clinicId, setNotifs, useSupabaseBackend]);

  useEffect(() => {
    if (!useSupabaseBackend) return;

    appRepository.clearLocalData();
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
      .catch(error => {
        handleAppError(error, { context: "supabase.auth.currentUser" });
        if (!ignore) setAppState("supabase_login");
      });

    return () => {
      ignore = true;
    };
  }, [setAppState, setCurrentUser, useSupabaseBackend]);

  useEffect(() => {
    if (!useSupabaseBackend || !clinicId) return;

    let ignore = false;
    const syncTasks = [
      {
        load: () => supabaseStaffApi.listByClinic(clinicId),
        apply: applyIfNotEmpty(setUsers),
        context: "supabase.staff.list",
        error: "Supabase 직원 정보를 불러오지 못했습니다",
      },
      {
        load: () => supabaseItemsApi.listByClinic(clinicId),
        apply: (rows) => {
          if (rows.length > 0) setItems(rows);
          setSyncStatus(rows.length > 0 ? "" : "Supabase 재고 데이터가 아직 없습니다");
        },
        context: "supabase.items.list",
        error: "Supabase 재고를 불러오지 못했습니다",
      },
      {
        load: () => supabaseOrdersApi.listByClinic(clinicId),
        apply: applyIfNotEmpty(setOrders),
        context: "supabase.orders.list",
        error: "Supabase 발주 데이터를 불러오지 못했습니다",
      },
      {
        load: () => supabaseActivityApi.listTxsByClinic(clinicId),
        apply: applyIfNotEmpty(setTxs),
        context: "supabase.txs.list",
        error: "Supabase 입출고 내역을 불러오지 못했습니다",
      },
      {
        load: () => supabaseActivityApi.listNotifsByClinic(clinicId),
        apply: applyIfNotEmpty(setNotifs),
        context: "supabase.notifs.list",
        error: "Supabase 알림을 불러오지 못했습니다",
      },
      {
        load: () => supabaseActivityApi.listAuditLogsByClinic(clinicId),
        apply: applyIfNotEmpty(rows => auditLogsApi.save(rows)),
        context: "supabase.auditLogs.list",
        error: "Supabase 활동 로그를 불러오지 못했습니다",
      },
      {
        load: () => supabaseSurgeriesApi.listByClinic(clinicId),
        apply: applyIfNotEmpty(setSurgeries),
        context: "supabase.surgeries.list",
        error: "Supabase 수술 데이터를 불러오지 못했습니다",
      },
      {
        load: () => supabaseSettingsApi.getForClinic(clinicId),
        apply: (settings) => {
          if (settings) settingsApi.set(settings);
        },
        context: "supabase.settings.get",
        error: "Supabase 설정을 불러오지 못했습니다",
      },
    ];

    syncTasks.forEach(task => {
      task.load()
        .then(result => {
          if (!ignore) task.apply(result);
        })
        .catch(error => {
          handleAppError(error, { context: task.context });
          if (!ignore) setSyncStatus(task.error);
        });
    });

    return () => {
      ignore = true;
    };
  }, [
    clinicId,
    setItems,
    setNotifs,
    setOrders,
    setSurgeries,
    setSyncStatus,
    setTxs,
    setUsers,
    useSupabaseBackend,
  ]);

  return { setSyncedNotifs };
}
