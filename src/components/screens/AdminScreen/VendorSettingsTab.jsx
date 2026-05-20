import { useState } from "react";
import { Save, Check, Power, ShoppingCart } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Chip } from "../../shared/Chip";
import { Inp } from "../../shared/Inp";
import { settingsApi } from "../../../api/settingsApi";
import { vendorCredentialsApi } from "../../../api/vendorCredentialsApi";

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

export function VendorSettingsTab({ showToast }) {
  const [initial, setInitial] = useState(() => settingsApi.load());
  const [initialCredentials, setInitialCredentials] = useState(() => vendorCredentialsApi.loadAll());
  const [vendors, setVendors] = useState(initial.vendors);
  const [credentials, setCredentials] = useState(initialCredentials);
  const [preferredVendor, setPreferredVendor] = useState(initial.preferredVendor);
  const [maxOrderAmount, setMaxOrderAmount] = useState(initial.maxOrderAmount);
  const [saveAttempted, setSaveAttempted] = useState(false);

  const isDirty =
    JSON.stringify(vendors) !== JSON.stringify(initial.vendors) ||
    JSON.stringify(credentials) !== JSON.stringify(initialCredentials) ||
    preferredVendor !== initial.preferredVendor ||
    maxOrderAmount !== initial.maxOrderAmount;

  const maxOrderAmountNumber = Number(maxOrderAmount);
  const maxOrderAmountError =
    !maxOrderAmount
      ? "최대 주문금액을 입력해 주세요"
      : maxOrderAmountNumber < MIN_ORDER_AMOUNT
        ? "최대 주문금액은 1,000원 이상으로 입력해 주세요"
        : "";

  const toggleConnect = (id) => {
    setVendors(p => p.map(v => v.id === id ? { ...v, connected: !v.connected } : v));
  };

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

  const handleSave = () => {
    setSaveAttempted(true);
    if (maxOrderAmountError) {
      showToast?.(maxOrderAmountError);
      return;
    }

    const next = { vendors, preferredVendor, maxOrderAmount };
    const savedSettings = settingsApi.save(next);
    const savedCredentials = vendorCredentialsApi.saveAll(credentials);
    setInitial(savedSettings);
    setInitialCredentials(savedCredentials);
    setSaveAttempted(false);
    showToast?.("자동발주 설정이 저장되었습니다");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: 80 }}>
      {/* 도매 사이트 연결 섹션 */}
      <p style={sectionTitleStyle}>거래처 연결</p>
      <Card style={{ marginBottom: 20, padding: "16px" }}>
        {vendors.map((vendor, idx) => (
          <div key={vendor.id}>
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
                  label={vendor.connected ? "로그인됨" : "미연결"}
                  color={vendor.connected ? T.blue500 : T.grey600}
                  bg={vendor.connected ? T.blue50 : T.grey100}
                />
                <TogglePill
                  active={vendor.connected}
                  label={vendor.connected ? "해제" : "연결"}
                  icon={Power}
                  onClick={() => toggleConnect(vendor.id)}
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
                  연결된 거래처에서만 실제 주문 후보로 사용됩니다
                </p>
              </div>
              <TogglePill
                active={!!vendor.automaticOrdering}
                label={vendor.automaticOrdering ? "켜짐" : "꺼짐"}
                icon={ShoppingCart}
                onClick={() => updateVendorField(vendor.id, "automaticOrdering", !vendor.automaticOrdering)}
              />
            </div>
            {!vendor.connected && vendor.automaticOrdering && (
              <div style={{ margin: "0 0 16px", padding: "12px 14px", borderRadius: 12, background: T.grey50 }}>
                <p style={{ margin: 0, fontSize: 14, color: T.grey600, lineHeight: 1.45 }}>
                  자동발주를 켜 두어도 연결 전에는 주문 후보에 포함되지 않습니다.
                </p>
              </div>
            )}
            {idx < vendors.length - 1 && <Divider />}
          </div>
        ))}
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
            {vendors.map(vendor => (
              <option key={vendor.id} value={String(vendor.id)}>
                {vendor.name}
              </option>
            ))}
          </select>
          <p style={helperTextStyle}>
            여러 거래처가 가능할 때 먼저 확인할 거래처입니다.
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
          지금 입력한 계정 정보는 데모용으로 이 기기와 브라우저에만 저장됩니다. 실제 서버 연동 전까지는 화면 확인과 테스트에 사용해 주세요.
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
        disabled={!isDirty}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "18px 0",
          borderRadius: 9999,
          border: "none",
          background: isDirty ? T.blue500 : T.grey200,
          color: isDirty ? T.white : T.grey500,
          fontSize: 16,
          fontWeight: 600,
          cursor: isDirty ? "pointer" : "default",
          fontFamily: font,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 150ms",
        }}
      >
        {isDirty ? <><Save size={18} /> 설정 저장</> : <><Check size={18} /> 저장됨</>}
      </button>
    </div>
  );
}
