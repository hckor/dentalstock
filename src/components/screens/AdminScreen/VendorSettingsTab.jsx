import { Check, Save } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { useVendorSettings } from "./useVendorSettings";
import { VendorConnectionsCard } from "./VendorConnectionsCard";
import { VendorOrderPolicyCard } from "./VendorOrderPolicyCard";
import { VendorPolicySummary } from "./VendorPolicySummary";
import { VendorPriceMonitorCard } from "./VendorPriceMonitorCard";

export function VendorSettingsTab({ currentUser, items = [], onRunPriceMonitor, showToast }) {
  const settings = useVendorSettings({ currentUser, items, onRunPriceMonitor, showToast });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: 80 }}>
      <VendorPolicySummary
        policySummary={settings.policySummary}
        vendors={settings.vendors}
        credentialStatusLoading={settings.credentialStatusLoading}
        monthlyOrderLimit={settings.monthlyOrderLimit}
        maxOrderAmount={settings.maxOrderAmount}
      />

      <VendorOrderPolicyCard
        vendors={settings.vendors}
        preferredVendor={settings.preferredVendor}
        setPreferredVendor={settings.setPreferredVendor}
        maxOrderAmount={settings.maxOrderAmount}
        setMaxOrderAmount={settings.setMaxOrderAmount}
        monthlyOrderLimit={settings.monthlyOrderLimit}
        setMonthlyOrderLimit={settings.setMonthlyOrderLimit}
        saveAttempted={settings.saveAttempted}
        maxOrderAmountError={settings.maxOrderAmountError}
        monthlyOrderLimitError={settings.monthlyOrderLimitError}
      />

      <VendorConnectionsCard
        vendors={settings.vendors}
        credentials={settings.credentials}
        credentialStatuses={settings.credentialStatuses}
        credentialStatusLoading={settings.credentialStatusLoading}
        policySummary={settings.policySummary}
        preferredVendor={settings.preferredVendor}
        updateCredentialField={settings.updateCredentialField}
        updateVendorField={settings.updateVendorField}
        refreshCredentialStatuses={settings.refreshCredentialStatuses}
      />

      <VendorPriceMonitorCard
        monitorSummary={settings.monitorSummary}
        policySummary={settings.policySummary}
        monitorRunning={settings.monitorRunning}
        onRunPriceMonitor={settings.handleRunPriceMonitor}
      />

      <div style={{ marginTop: 24, padding: "16px", background: T.blue50, borderRadius: 12 }}>
        <p style={{ margin: 0, fontSize: 15, color: T.grey700, lineHeight: 1.5 }}>
          도매몰 ID와 비밀번호는 브라우저에 저장하지 않습니다. 서버 저장소가 준비되면 저장 후 입력값은 비워지고 연결 상태만 표시됩니다.
        </p>
      </div>

      {settings.isDirty && (
        <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 12, background: T.grey100 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.grey700 }}>
            저장하지 않은 변경 사항이 있습니다.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={settings.handleSave}
        disabled={!settings.isDirty || settings.saving}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "18px 0",
          borderRadius: 9999,
          border: "none",
          background: settings.isDirty && !settings.saving ? T.blue500 : T.grey200,
          color: settings.isDirty && !settings.saving ? T.white : T.grey500,
          fontSize: 16,
          fontWeight: 600,
          cursor: settings.isDirty && !settings.saving ? "pointer" : "default",
          fontFamily: font,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 150ms",
        }}
      >
        {settings.saving ? "저장 중..." : settings.isDirty ? <><Save size={18} /> 설정 저장</> : <><Check size={18} /> 저장됨</>}
      </button>
    </div>
  );
}
