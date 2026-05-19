import { useState } from "react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Chip } from "../../shared/Chip";
import { Inp } from "../../shared/Inp";

export function VendorSettingsTab() {
  // 더미 데이터: 향후 API 연동으로 교체
  const [vendors] = useState([
    { id: 1, name: "덴올", connected: true },
    { id: 2, name: "오스템몰", connected: true },
    { id: 3, name: "이덴트", connected: false },
  ]);

  const [preferredVendor, setPreferredVendor] = useState("lowest");
  const [maxOrderAmount, setMaxOrderAmount] = useState("50000");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* 도매 사이트 연결 섹션 */}
      <p style={{ margin: "0 0 12px", fontSize: 19, fontWeight: 600, color: T.grey600 }}>
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
                <p style={{ margin: 0, fontSize: 19, fontWeight: 600, color: T.grey900 }}>
                  {vendor.name}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Chip
                  label={vendor.connected ? "로그인됨" : "미연결"}
                  color={vendor.connected ? T.teal500 : T.grey600}
                  bg={vendor.connected ? T.teal50 : T.grey100}
                />
                {!vendor.connected && (
                  <button
                    onClick={() => {}}
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
                    연결
                  </button>
                )}
              </div>
            </div>
            {idx < vendors.length - 1 && <Divider />}
          </div>
        ))}
      </Card>

      {/* 자동발주 설정 섹션 */}
      <p style={{ margin: "0 0 12px", fontSize: 19, fontWeight: 600, color: T.grey600 }}>
        자동발주 설정
      </p>
      <Card style={{ padding: "20px" }}>
        {/* 선호 사이트 */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 18,
              fontWeight: 600,
              color: T.grey700,
            }}
          >
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
              fontSize: 18,
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
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontSize: 18,
              fontWeight: 600,
              color: T.grey700,
            }}
          >
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
            <span style={{ fontSize: 18, fontWeight: 600, color: T.grey600, flexShrink: 0 }}>
              원
            </span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 16, color: T.grey500 }}>
            자동발주 시 이 금액을 초과하지 않습니다
          </p>
        </div>
      </Card>

      {/* 안내 텍스트 */}
      <div style={{ marginTop: 24, padding: "16px", background: T.blue50, borderRadius: 12 }}>
        <p style={{ margin: 0, fontSize: 16, color: T.grey700, lineHeight: 1.5 }}>
          도매 사이트와 연결되면 자동으로 가장 저렴한 가격의 상품을 선택하여 발주합니다.
          나중에 설정을 변경할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
