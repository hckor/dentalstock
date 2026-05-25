import { useMemo } from "react";
import { can } from "../constants/permissions";
import { useSurgeryPrepActions } from "./useSurgeryPrepActions";
import { useSurgeryReminderEffects } from "./useSurgeryReminderEffects";
import { useSurgeryScheduleActions } from "./useSurgeryScheduleActions";
import { useSurgeryUsageActions } from "./useSurgeryUsageActions";

export function useSurgeryActions(deps) {
  const { currentUser, surgeries, setNotifs, firePush, firedRemindersRef } = deps;
  const canManageSurgery = can(currentUser?.role, "surgery_manage");
  const canConfirmSurgery = can(currentUser?.role, "surgery_confirm");

  const scheduleActions = useSurgeryScheduleActions({
    ...deps,
    canManageSurgery,
  });
  const prepActions = useSurgeryPrepActions({
    ...deps,
    canConfirmSurgery,
  });
  const usageActions = useSurgeryUsageActions({
    ...deps,
    canConfirmSurgery,
  });

  useSurgeryReminderEffects({
    surgeries,
    setNotifs,
    firePush,
    firedRemindersRef,
  });

  return useMemo(() => ({
    ...scheduleActions,
    ...prepActions,
    ...usageActions,
  }), [prepActions, scheduleActions, usageActions]);
}
