import { useEffect, useMemo, useState } from "react";
import { Save, Check, RefreshCcw, ShoppingCart } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Chip } from "../../shared/Chip";
import { Inp } from "../../shared/Inp";
import { settingsApi } from "../../../api/settingsApi";
import { supabaseSettingsApi } from "../../../api/supabaseSettingsApi";
import { vendorCredentialsApi } from "../../../api/vendorCredentialsApi";
import { resolveOrderVendorForQty } from "../../../utils/vendorSelection";

const MIN_ORDER_AMOUNT = 1000;

const sectionTitleStyle = {
  margin: "0 0 12px",
  fontSize: 16,
  fontWeight: 600,
  color: T.grey600,
};

const helperTextStyle = {
  margin: "8px 0 0",
  fontSize: 14,
  color: T.grey500,
  lineHeight: 1.45,
};

function TogglePill({ active, label, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        minWidth: 84,
        padding: "10px 14px",
        borderRadius: 9999,
        border: `1px solid ${active ? T.blue500 : T.grey200}`,
        background: active ? T.blue50 : T.white,
        color: active ? T.blue500 : T.grey700,
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: font,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );
}

export function VendorSettingsTab({ currentUser, items = [], onRunPriceMonitor, showToast }) {
  const [initial, setInitial] = useState(() => settingsApi.load());
  const [vendors, setVendors] = useState(initial.vendors);
  const [credentials, setCredentials] = useState({});
  const [credentialStatuses, setCredentialStatuses] = useState(() => (
    vendorCredentialsApi.statusMapFor(initial.vendors, "계정 상태를 확인하는 중입니다.")
  ));
  const [credentialStatusLoading, setCredentialStatusLoading] = useState(true);
  const [preferredVendor, setPreferredVendor] = useState(initial.preferredVendor);
  const [maxOrderAmount, setMaxOrderAmount] = useState(initial.maxOrderAmount);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monitorRunning, setMonitorRunning] = useState(false);
  const hasDraftCredentials = useMemo(() => (
    Object.values(credentials).some(credential => credential?.username || credential?.password)
  ), [credentials]);
  const monitorSummary = useMemo(() => {
    const settings = { vendors, preferredVendor, maxOrderAmount };
    const monitoredItems = items.filter(item => Array.isArray(item.vendor_options) && item.vendor_options.length > 0);
    const lowStockRecommendations = monitoredItems
      .filter(item => item.current_qty < item.min_qty)
      .map(item => ({
        item,
        qty: Math.max(1, item.min_qty - item.current_qty),
        vendor: resolveOrderVendorForQty(item, settings, Math.max(1, item.min_qty - item.current_qty)),
      }))
      .filter(row => row.vendor.vendor_selection !== "unassigned")
      .slice(0, 5);

    return {
      monitoredCount: monitoredItems.length,
      candidateCount: monitoredItems.reduce((sum, item) => sum + item.vendor_options.length, 0),
      lowStockRecommendations,
    };
  }, [items, vendors, preferredVendor, maxOrderAmount]);

  const isDirty =
    JSON.stringify(vendors) !== JSON.stringify(initial.vendors) ||
    hasDraftCredentials ||
    preferredVendor !== initial.preferredVendor ||
    maxOrderAmount !== initial.maxOrderAmount;

  const maxOrderAmountNumber = Number(maxOrderAmount);
  const maxOrderAmountError =
    !maxOrderAmount
      ? "최대 주문금액을 입력해 주세요"
      : maxOrderAmountNumber < MIN_ORDER_AMOUNT
        ? "최대 주문금액은 1,000원 이상으로 입력해 주세요"
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

    const next = { vendors, preferredVendor, maxOrderAmount };
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

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: 80 }}>
      {/* 도매 사이트 연결 섹션 */}
      <p style={sectionTitleStyle}>거래처 연결</p>
      <Card style={{ marginBottom: 20, padding: "16px" }}>
        {vendors.map((vendor, idx) => (
          <div key={vendor.id}>
            {(() => {
              const status = credentialStatuses[String(vendor.id)] || vendorCredentialsApi.disabledStatus(vendor.id);
              const connected = Boolean(status.connected);
              const statusLabel = credentialStatusLoading ? "확인 중" : connected ? "연결됨" : "미연결";
              const statusMessage = connected
                ? "서버에 저장된 계정으로 자동발주를 사용할 수 있습니다"
                : status.message || "도매몰 계정은 서버 저장소가 준비되면 연결할 수 있습니다";
              return (
                <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 0 12px",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.grey900 }}>
                  {vendor.name}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: T.grey500 }}>
                  자동발주 {vendor.automaticOrdering ? "사용" : "끄기"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Chip
                  label={statusLabel}
                  color={connected ? T.blue500 : T.grey600}
                  bg={connected ? T.blue50 : T.grey100}
                />
                <TogglePill
                  active={credentialStatusLoading}
                  label="상태확인"
                  icon={RefreshCcw}
                  onClick={refreshCredentialStatuses}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 0 12px" }}>
              <Inp
                value={credentials[String(vendor.id)]?.username || ""}
                onChange={e => updateCredentialField(vendor.id, "username", e.target.value)}
                placeholder={`${vendor.name} ID`}
                style={{ fontSize: 16 }}
              />
              <Inp
                type="password"
                value={credentials[String(vendor.id)]?.password || ""}
                onChange={e => updateCredentialField(vendor.id, "password", e.target.value)}
                placeholder="비밀번호"
                style={{ fontSize: 16 }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 0 16px" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.grey800 }}>
                  이 거래처 자동발주
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: T.grey500 }}>
                  {statusMessage}
                </p>
              </div>
              <TogglePill
                active={!!vendor.automaticOrdering}
                label={vendor.automaticOrdering ? "켜짐" : "꺼짐"}
                icon={ShoppingCart}
                onClick={() => updateVendorField(vendor.id, "automaticOrdering", !vendor.automaticOrdering)}
              />
            </div>
            {!connected && vendor.automaticOrdering && (
              <div style={{ margin: "0 0 16px", padding: "12px 14px", borderRadius: 12, background: T.grey50 }}>
                <p style={{ margin: 0, fontSize: 14, color: T.grey600, lineHeight: 1.45 }}>
                  자동발주를 켜 두어도 서버 연결 전에는 주문 후보에 포함되지 않습니다.
                </p>
              </div>
            )}
                </>
              );
            })()}
            {idx < vendors.length - 1 && <Divider />}
          </div>
        ))}
      </Card>

      <p style={sectionTitleStyle}>최저가 감시</p>
      <Card style={{ marginBottom: 20, padding: "18px 16px" }}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14}}>
          <div style={{padding:"12px 14px", borderRadius:12, background:T.blue50}}>
            <p style={{margin:0, fontSize:13, fontWeight:700, color:T.blue500}}>감시 품목</p>
            <p style={{margin:"4px 0 0", fontSize:22, fontWeight:700, color:T.grey900}}>{monitorSummary.monitoredCount}개</p>
          </div>
          <div style={{padding:"12px 14px", borderRadius:12, background:T.grey100}}>
            <p style={{margin:0, fontSize:13, fontWeight:700, color:T.grey600}}>구매 후보</p>
            <p style={{margin:"4px 0 0", fontSize:22, fontWeight:700, color:T.grey900}}>{monitorSummary.candidateCount}개</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRunPriceMonitor}
          disabled={monitorRunning || monitorSummary.candidateCount === 0}
          style={{width:"100%", minHeight:46, marginBottom:14, border:"none", borderRadius:9999, background:monitorRunning || monitorSummary.candidateCount === 0 ? T.grey200 : T.blue500, color:monitorRunning || monitorSummary.candidateCount === 0 ? T.grey500 : T.white, fontSize:15, fontWeight:700, fontFamily:font, cursor:monitorRunning || monitorSummary.candidateCount === 0 ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7}}
        >
          <RefreshCcw size={16}/>
          {monitorRunning ? "가격 확인 중..." : "가격 지금 확인"}
        </button>
        {monitorSummary.lowStockRecommendations.length > 0 ? (
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {monitorSummary.lowStockRecommendations.map(({item, qty, vendor}) => (
              <div key={item.id} style={{padding:"12px 0", borderTop:`1px solid ${T.grey100}`}}>
                <p style={{margin:0, fontSize:15, fontWeight:700, color:T.grey900}}>{item.name}</p>
                <p style={{margin:"4px 0 0", fontSize:13, color:T.grey500}}>
                  추천 {vendor.vendor_name} · {qty}{item.unit} · 실효가 {Number(vendor.vendor_price || 0).toLocaleString()}원
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{margin:0, fontSize:14, color:T.grey500, lineHeight:1.5}}>
            품목 수정 화면에서 구매 후보 URL과 가격을 등록하면 부족 품목 발주 시 최저가 거래처가 자동 추천됩니다.
          </p>
        )}
      </Card>

      {/* 자동발주 설정 섹션 */}
      <p style={sectionTitleStyle}>자동발주 설정</p>
      <Card style={{ padding: "20px" }}>
        {/* 선호 거래처 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 16, fontWeight: 600, color: T.grey700 }}>
            선호 거래처
          </label>
          <select
            value={preferredVendor}
            onChange={(e) => setPreferredVendor(e.target.value)}
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: 12,
              border: `1px solid rgba(2,32,71,0.05)`,
              backgroundColor: "rgba(0,23,51,0.02)",
              fontSize: 16,
              fontWeight: 500,
              color: T.grey800,
              fontFamily: font,
              outline: "none",
              cursor: "pointer",
              boxSizing: "border-box",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23666' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px center",
              paddingRight: 44,
            }}
          >
            <option value="lowest">최저가 자동 선택</option>
            {vendors.map(vendor => (
              <option key={vendor.id} value={String(vendor.id)}>
                {vendor.name}
              </option>
            ))}
          </select>
          <p style={helperTextStyle}>
            여러 거래처가 가능할 때 최저가 또는 선호 거래처 기준으로 발주처를 나눕니다.
          </p>
        </div>

        {/* 최대 주문금액 */}
        <div>
          <label style={{ display: "block", marginBottom: 8, fontSize: 16, fontWeight: 600, color: T.grey700 }}>
            최대 주문금액
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Inp
              type="text"
              value={maxOrderAmount}
              onChange={(e) => setMaxOrderAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="예: 50000"
              style={{
                flex: 1,
                borderColor: saveAttempted && maxOrderAmountError ? T.red500 : "rgba(2,32,71,0.05)",
                background: saveAttempted && maxOrderAmountError ? T.red50 : "rgba(0,23,51,0.02)",
              }}
            />
            <span style={{ fontSize: 16, fontWeight: 600, color: T.grey600, flexShrink: 0 }}>원</span>
          </div>
          <p style={{ ...helperTextStyle, color: saveAttempted && maxOrderAmountError ? T.red500 : T.grey500 }}>
            {saveAttempted && maxOrderAmountError ? maxOrderAmountError : "자동발주 시 이 금액을 초과하지 않습니다"}
          </p>
        </div>
      </Card>

      {/* 안내 텍스트 */}
      <div style={{ marginTop: 24, padding: "16px", background: T.blue50, borderRadius: 12 }}>
        <p style={{ margin: 0, fontSize: 15, color: T.grey700, lineHeight: 1.5 }}>
          도매몰 ID와 비밀번호는 브라우저에 저장하지 않습니다. 서버 저장소가 준비되면 저장 후 입력값은 비워지고 연결 상태만 표시됩니다.
        </p>
      </div>

      {isDirty && (
        <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 12, background: T.grey100 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.grey700 }}>
            저장하지 않은 변경 사항이 있습니다.
          </p>
        </div>
      )}

      {/* 저장 버튼 */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || saving}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "18px 0",
          borderRadius: 9999,
          border: "none",
          background: isDirty && !saving ? T.blue500 : T.grey200,
          color: isDirty && !saving ? T.white : T.grey500,
          fontSize: 16,
          fontWeight: 600,
          cursor: isDirty && !saving ? "pointer" : "default",
          fontFamily: font,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 150ms",
        }}
      >
        {saving ? "저장 중..." : isDirty ? <><Save size={18} /> 설정 저장</> : <><Check size={18} /> 저장됨</>}
      </button>
    </div>
  );
}
