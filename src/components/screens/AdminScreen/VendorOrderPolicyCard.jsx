import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { Inp } from "../../shared/Inp";
import {
  currencySuffixStyle,
  helperTextStyle,
  inputLabelStyle,
  sectionTitleStyle,
} from "./VendorSettingsTab.utils";

export function VendorOrderPolicyCard({
  vendors,
  preferredVendor,
  setPreferredVendor,
  maxOrderAmount,
  setMaxOrderAmount,
  monthlyOrderLimit,
  setMonthlyOrderLimit,
  saveAttempted,
  maxOrderAmountError,
  monthlyOrderLimitError,
}) {
  return (
    <>
      <p style={sectionTitleStyle}>주문 한도와 선택 정책</p>
      <Card style={{ marginBottom: 20, padding: "20px" }}>
        <div style={{ marginBottom: 22 }}>
          <label style={inputLabelStyle}>선호 거래처</label>
          <select
            value={preferredVendor}
            onChange={(e) => setPreferredVendor(e.target.value)}
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: 12,
              border: `1px solid ${T.inputBorder}`,
              backgroundColor: T.inputBg,
              fontSize: 16,
              fontWeight: 500,
              color: T.text,
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
            여러 거래처가 가능할 때 배송비와 최소수량을 포함한 실효가 기준으로 주문처를 고릅니다.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          <MoneyPolicyInput
            label="1회 최대 주문금액"
            value={maxOrderAmount}
            onChange={setMaxOrderAmount}
            saveAttempted={saveAttempted}
            error={maxOrderAmountError}
            helper="자동발주가 한 번에 넘지 않아야 하는 금액입니다"
          />
          <MoneyPolicyInput
            label="월 주문 한도"
            value={monthlyOrderLimit}
            onChange={setMonthlyOrderLimit}
            saveAttempted={saveAttempted}
            error={monthlyOrderLimitError}
            helper="월 예산을 넘기는 자동발주를 사전에 막는 기준입니다"
          />
        </div>
      </Card>
    </>
  );
}

function MoneyPolicyInput({ label, value, onChange, saveAttempted, error, helper }) {
  return (
    <div>
      <label style={inputLabelStyle}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Inp
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="예: 300000"
          style={{
            flex: 1,
            borderColor: saveAttempted && error ? T.danger : T.inputBorder,
            background: saveAttempted && error ? T.dangerBg : T.inputBg,
          }}
        />
        <span style={currencySuffixStyle}>원</span>
      </div>
      <p style={{ ...helperTextStyle, color: saveAttempted && error ? T.red500 : T.grey500 }}>
        {saveAttempted && error ? error : helper}
      </p>
    </div>
  );
}
