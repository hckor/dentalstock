import { useState } from "react";
import { Save, Check } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Chip } from "../../shared/Chip";
import { Inp } from "../../shared/Inp";
import { settingsApi } from "../../../api/settingsApi";

export function VendorSettingsTab({ showToast }) {
  const [initial, setInitial] = useState(() => settingsApi.load());
  const [vendors, setVendors] = useState(initial.vendors);
  const [preferredVendor, setPreferredVendor] = useState(initial.preferredVendor);
  const [maxOrderAmount, setMaxOrderAmount] = useState(initial.maxOrderAmount);

  const isDirty =
    JSON.stringify(vendors) !== JSON.stringify(initial.vendors) ||
    preferredVendor !== initial.preferredVendor ||
    maxOrderAmount !== initial.maxOrderAmount;

  const toggleConnect = (id) => {
    setVendors(p => p.map(v => v.id === id ? { ...v, connected: !v.connected } : v));
  };

  const updateVendorField = (id, field, value) => {
    setVendors(p => p.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleSave = () => {
    const next = { vendors, preferredVendor, maxOrderAmount };
    settingsApi.save(next);
    setInitial(next);
    showToast?.("자동발주 설정이 저장되었습니다");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: 80 }}>
      {/* 도매 사이트 연결 섹션 */}
      <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: T.grey600 }}>
        도매 사이트 연결
      </p>
      <Card style={{ marginBottom: 20, padding: "16px" }}>
        {vendors.map((vendor, idx) => (
          <div key={vendor.id}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 0",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.grey900 }}>
                  {vendor.name}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Chip
                  label={vendor.connected ? "로그인됨" : "미연결"}
                  color={vendor.connected ? T.teal500 : T.grey600}
                  bg={vendor.connected ? T.teal50 : T.grey100}
                />
                <button
                  onClick={() => toggleConnect(vendor.id)}
                  style={{
                    minWidth: 60,
                    padding: "10px 16px",
                    borderRadius: 9999,
                    border: `1.5px solid ${T.grey200}`,
                    background: T.white,
                    color: T.grey700,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: font,
                  }}
                >
                  {vendor.connected ? "해제" : "연결"}
                </button>
              </div>
            </div>
            {vendor.connected && (
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"0 0 18px"}}>
                <Inp
                  value={vendor.username || ""}
                  onChange={e=>updateVendorField(vendor.id, "username", e.target.value)}
                  placeholder={`${vendor.name} ID`}
                  style={{fontSize:16}}
                />
                <Inp
                  type="password"
                  value={vendor.password || ""}
                  onChange={e=>updateVendorField(vendor.id, "password", e.target.value)}
                  placeholder="비밀번호"
                  style={{fontSize:16}}
                />
              </div>
            )}
            {idx < vendors.length - 1 && <Divider />}
          </div>
        ))}
      </Card>

      {/* 자동발주 설정 섹션 */}
      <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: T.grey600 }}>
        자동발주 설정
      </p>
      <Card style={{ padding: "20px" }}>
        {/* 선호 사이트 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 16, fontWeight: 600, color: T.grey700 }}>
            선호 사이트
          </label>
          <select
            value={preferredVendor}
            onChange={(e) => setPreferredVendor(e.target.value)}
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: 12,
              border: `1px solid rgba(2,32,71,0.05)`,
              background: "rgba(0,23,51,0.02)",
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
            <option value="lowest">최저가</option>
            <option value="fastest">빠른배송</option>
            <option value="most_stock">재고풍부</option>
          </select>
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
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 16, fontWeight: 600, color: T.grey600, flexShrink: 0 }}>원</span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 16, color: T.grey500 }}>
            자동발주 시 이 금액을 초과하지 않습니다
          </p>
        </div>
      </Card>

      {/* 안내 텍스트 */}
      <div style={{ marginTop: 24, padding: "16px", background: T.blue50, borderRadius: 12 }}>
        <p style={{ margin: 0, fontSize: 16, color: T.grey700, lineHeight: 1.5 }}>
          계정 정보는 현재 기기 저장소에만 보관됩니다. 실제 자동주문 서버 연동 전에는 테스트용으로만 사용하세요.
        </p>
      </div>

      {/* 저장 버튼 */}
      <button
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
        {isDirty ? <><Save size={18}/> 설정 저장</> : <><Check size={18}/> 저장됨</>}
      </button>
    </div>
  );
}
