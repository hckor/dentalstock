import { RefreshCcw, ShoppingCart } from "lucide-react";
import { T } from "../../../constants/colors";
import { vendorCredentialsApi } from "../../../api/vendorCredentialsApi";
import { Card } from "../../shared/Card";
import { Chip } from "../../shared/Chip";
import { Divider } from "../../shared/Divider";
import { Inp } from "../../shared/Inp";
import { TogglePill } from "./VendorSettingsTab.components";
import { formatCurrency, formatDateTime, sectionTitleStyle } from "./VendorSettingsTab.utils";

export function VendorConnectionsCard({
  vendors,
  credentials,
  credentialStatuses,
  credentialStatusLoading,
  policySummary,
  preferredVendor,
  updateCredentialField,
  updateVendorField,
  refreshCredentialStatuses,
}) {
  return (
    <>
      <p style={sectionTitleStyle}>거래처 연결과 정책 단서</p>
      <Card style={{ marginBottom: 20, padding: "16px" }}>
        {vendors.map((vendor, idx) => (
          <div key={vendor.id}>
            <VendorConnectionRow
              vendor={vendor}
              credentials={credentials}
              status={credentialStatuses[String(vendor.id)] || vendorCredentialsApi.disabledStatus(vendor.id)}
              stat={policySummary.vendorStats.find(row => row.id === String(vendor.id)) || {}}
              preferredVendor={preferredVendor}
              credentialStatusLoading={credentialStatusLoading}
              updateCredentialField={updateCredentialField}
              updateVendorField={updateVendorField}
              refreshCredentialStatuses={refreshCredentialStatuses}
            />
            {idx < vendors.length - 1 && <Divider />}
          </div>
        ))}
      </Card>
    </>
  );
}

function VendorConnectionRow({
  vendor,
  credentials,
  status,
  stat,
  preferredVendor,
  credentialStatusLoading,
  updateCredentialField,
  updateVendorField,
  refreshCredentialStatuses,
}) {
  const connected = Boolean(status.connected);
  const statusLabel = credentialStatusLoading ? "확인 중" : connected ? "연결됨" : "미연결";
  const statusMessage = connected
    ? "서버에 저장된 계정으로 자동발주를 사용할 수 있습니다"
    : status.message || "도매몰 계정은 서버 저장소가 준비되면 연결할 수 있습니다";
  const averageShippingFee = stat.shippingCount
    ? Math.round(stat.shippingTotal / stat.shippingCount)
    : 0;
  const policyCue = preferredVendor === "lowest"
    ? `${stat.lowestWins || 0}개 품목에서 최저가 후보`
    : String(preferredVendor) === String(vendor.id)
      ? "선호 거래처로 우선 검토"
      : "선호 거래처가 아니면 최저가일 때 선택";

  return (
    <>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"14px 0 12px"}}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.grey900 }}>{vendor.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: T.grey500 }}>자동발주 {vendor.automaticOrdering ? "사용" : "끄기"}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Chip label={statusLabel} color={connected ? T.blue500 : T.grey600} bg={connected ? T.blue50 : T.grey100}/>
          <TogglePill active={credentialStatusLoading} label="상태확인" icon={RefreshCcw} onClick={refreshCredentialStatuses}/>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 0 12px" }}>
        <Inp value={credentials[String(vendor.id)]?.username || ""} onChange={e => updateCredentialField(vendor.id, "username", e.target.value)} placeholder={`${vendor.name} ID`} style={{ fontSize: 16 }}/>
        <Inp type="password" value={credentials[String(vendor.id)]?.password || ""} onChange={e => updateCredentialField(vendor.id, "password", e.target.value)} placeholder="비밀번호" style={{ fontSize: 16 }}/>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 0 16px" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.grey800 }}>이 거래처 자동발주</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: T.grey500 }}>{statusMessage}</p>
        </div>
        <TogglePill active={!!vendor.automaticOrdering} label={vendor.automaticOrdering ? "켜짐" : "꺼짐"} icon={ShoppingCart} onClick={() => updateVendorField(vendor.id, "automaticOrdering", !vendor.automaticOrdering)}/>
      </div>
      {!connected && vendor.automaticOrdering && (
        <div style={{ margin: "0 0 16px", padding: "12px 14px", borderRadius: 12, background: T.grey50 }}>
          <p style={{ margin: 0, fontSize: 14, color: T.grey600, lineHeight: 1.45 }}>자동발주를 켜 두어도 서버 연결 전에는 주문 후보에 포함되지 않습니다.</p>
        </div>
      )}
      <VendorStatsGrid stat={stat} averageShippingFee={averageShippingFee}/>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        <Chip label={policyCue} color={String(preferredVendor) === String(vendor.id) || preferredVendor === "lowest" ? T.blue500 : T.grey600} bg={String(preferredVendor) === String(vendor.id) || preferredVendor === "lowest" ? T.blue50 : T.grey100}/>
        <Chip label={`${stat.urlCount || 0}개 URL`} color={(stat.urlCount || 0) > 0 ? T.blue500 : T.grey600} bg={(stat.urlCount || 0) > 0 ? T.blue50 : T.grey100}/>
        {(stat.staleCount || stat.uncheckedCount) > 0 && <Chip label={`확인 필요 ${Number(stat.staleCount || 0) + Number(stat.uncheckedCount || 0)}개`} color={T.red500} bg={T.red50}/>}
      </div>
    </>
  );
}

function VendorStatsGrid({ stat, averageShippingFee }) {
  const rows = [
    ["구매 후보", `${stat.optionCount || 0}개`],
    ["배송비 힌트", averageShippingFee ? formatCurrency(averageShippingFee) : "미등록"],
    ["최소 주문", stat.maxMinOrderQty > 1 ? `${stat.maxMinOrderQty}개까지` : "1개 단위"],
    ["가격 확인", formatDateTime(stat.latestCheckedAt)],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 8, margin: "0 0 12px" }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ padding: "10px 12px", borderRadius: 12, background: T.grey50 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.grey500 }}>{label}</p>
          <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 800, color: T.grey900 }}>{value}</p>
        </div>
      ))}
    </div>
  );
}
