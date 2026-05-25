import { useEffect, useMemo, useState } from "react";
import { settingsApi } from "../../../api/settingsApi";
import { supabaseSettingsApi } from "../../../api/supabaseSettingsApi";
import { vendorCredentialsApi } from "../../../api/vendorCredentialsApi";
import {
  MIN_ORDER_AMOUNT,
  buildMonitorSummary,
  buildPolicySummary,
  moneyInput,
  resolveMonthlyOrderLimit,
} from "./VendorSettingsTab.utils";

export function useVendorSettings({ currentUser, items = [], onRunPriceMonitor, showToast }) {
  const [initial, setInitial] = useState(() => settingsApi.load());
  const [vendors, setVendors] = useState(initial.vendors);
  const [credentials, setCredentials] = useState({});
  const [credentialStatuses, setCredentialStatuses] = useState(() => (
    vendorCredentialsApi.statusMapFor(initial.vendors, "계정 상태를 확인하는 중입니다.")
  ));
  const [credentialStatusLoading, setCredentialStatusLoading] = useState(true);
  const [preferredVendor, setPreferredVendor] = useState(initial.preferredVendor);
  const [maxOrderAmount, setMaxOrderAmount] = useState(initial.maxOrderAmount);
  const [monthlyOrderLimit, setMonthlyOrderLimit] = useState(() => resolveMonthlyOrderLimit(initial));
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monitorRunning, setMonitorRunning] = useState(false);
  const [priceReferenceTime] = useState(() => Date.now());
  const hasDraftCredentials = useMemo(() => (
    Object.values(credentials).some(credential => credential?.username || credential?.password)
  ), [credentials]);
  const monitorSummary = useMemo(() => buildMonitorSummary({
    items,
    vendors,
    preferredVendor,
    maxOrderAmount,
    monthlyOrderLimit,
  }), [items, vendors, preferredVendor, maxOrderAmount, monthlyOrderLimit]);
  const policySummary = useMemo(() => buildPolicySummary({
    vendors,
    items,
    credentialStatuses,
    preferredVendor,
    priceReferenceTime,
  }), [credentialStatuses, items, preferredVendor, priceReferenceTime, vendors]);

  const isDirty =
    JSON.stringify(vendors) !== JSON.stringify(initial.vendors) ||
    hasDraftCredentials ||
    preferredVendor !== initial.preferredVendor ||
    maxOrderAmount !== initial.maxOrderAmount ||
    monthlyOrderLimit !== resolveMonthlyOrderLimit(initial);

  const maxOrderAmountNumber = Number(maxOrderAmount);
  const maxOrderAmountError =
    !maxOrderAmount
      ? "최대 주문금액을 입력해 주세요"
      : maxOrderAmountNumber < MIN_ORDER_AMOUNT
        ? "최대 주문금액은 1,000원 이상으로 입력해 주세요"
        : "";
  const monthlyOrderLimitNumber = Number(monthlyOrderLimit);
  const monthlyOrderLimitError =
    !monthlyOrderLimit
      ? "월 주문 한도를 입력해 주세요"
      : monthlyOrderLimitNumber < maxOrderAmountNumber
        ? "월 주문 한도는 1회 최대 주문금액 이상으로 입력해 주세요"
        : "";

  const updateVendorField = (id, field, value) => {
    setVendors(p => p.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const updateCredentialField = (id, field, value) => {
    setCredentials(p => {
      const key = String(id);
      return {
        ...p,
        [key]: {
          ...(p[key] || {}),
          [field]: value,
        },
      };
    });
  };

  const refreshCredentialStatuses = async () => {
    setCredentialStatusLoading(true);
    const statuses = await vendorCredentialsApi.loadAll(vendors);
    setCredentialStatuses(statuses);
    setCredentialStatusLoading(false);
    return statuses;
  };

  useEffect(() => {
    let mounted = true;
    vendorCredentialsApi.loadAll(vendors)
      .then(statuses => {
        if (mounted) setCredentialStatuses(statuses);
      })
      .finally(() => {
        if (mounted) setCredentialStatusLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [vendors]);

  const handleSave = async () => {
    setSaveAttempted(true);
    if (saving) return;
    if (maxOrderAmountError) {
      showToast?.(maxOrderAmountError);
      return;
    }
    if (monthlyOrderLimitError) {
      showToast?.(monthlyOrderLimitError);
      return;
    }

    const next = { vendors, preferredVendor, maxOrderAmount, monthlyOrderLimit };
    setSaving(true);
    try {
      const savedSettings = supabaseSettingsApi.isEnabled() && currentUser?.clinicId
        ? await supabaseSettingsApi.saveForClinic(currentUser.clinicId, next)
        : settingsApi.save(next);
      settingsApi.set(savedSettings);
      const savedCredentialStatuses = hasDraftCredentials
        ? await vendorCredentialsApi.saveAll(credentials)
        : {};
      const nextCredentialStatuses = {
        ...credentialStatuses,
        ...savedCredentialStatuses,
      };
      setInitial(savedSettings);
      setVendors(savedSettings.vendors);
      setPreferredVendor(savedSettings.preferredVendor);
      setMaxOrderAmount(savedSettings.maxOrderAmount);
      setMonthlyOrderLimit(resolveMonthlyOrderLimit(savedSettings));
      setCredentials({});
      setCredentialStatuses(nextCredentialStatuses);
      setSaveAttempted(false);
      const failedCredential = Object.values(savedCredentialStatuses).find(status => !status.connected && !status.stored);
      showToast?.(failedCredential?.message || "자동발주 설정이 저장되었습니다");
    } catch {
      showToast?.("자동발주 설정 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleRunPriceMonitor = async () => {
    if (monitorRunning) return;
    setMonitorRunning(true);
    await onRunPriceMonitor?.();
    setMonitorRunning(false);
  };

  return {
    vendors,
    credentials,
    credentialStatuses,
    credentialStatusLoading,
    preferredVendor,
    setPreferredVendor,
    maxOrderAmount,
    setMaxOrderAmount: (value) => setMaxOrderAmount(moneyInput(value)),
    monthlyOrderLimit,
    setMonthlyOrderLimit: (value) => setMonthlyOrderLimit(moneyInput(value)),
    saveAttempted,
    saving,
    monitorRunning,
    monitorSummary,
    policySummary,
    isDirty,
    maxOrderAmountError,
    monthlyOrderLimitError,
    updateVendorField,
    updateCredentialField,
    refreshCredentialStatuses,
    handleSave,
    handleRunPriceMonitor,
  };
}
