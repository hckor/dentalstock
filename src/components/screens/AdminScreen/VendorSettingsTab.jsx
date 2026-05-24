import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Clock3, Link2, RefreshCcw, Save, ShoppingCart, Truck, WalletCards, Wifi } from "lucide-react";
import { T, font } from "../../../constants/colors";
import { Card } from "../../shared/Card";
import { Divider } from "../../shared/Divider";
import { Chip } from "../../shared/Chip";
import { Inp } from "../../shared/Inp";
import { settingsApi } from "../../../api/settingsApi";
import { supabaseSettingsApi } from "../../../api/supabaseSettingsApi";
import { vendorCredentialsApi } from "../../../api/vendorCredentialsApi";
import { formatMoney, toNumber } from "../../../utils/money";
import { getEffectiveVendorPrice, resolveOrderVendorForQty } from "../../../utils/vendorSelection";

const MIN_ORDER_AMOUNT = 1000;
const DEFAULT_MONTHLY_ORDER_LIMIT = "300000";
const PRICE_STALE_DAYS = 14;

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

const panelGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
  gap: 8,
};

const inputLabelStyle = {
  display: "block",
  marginBottom: 8,
  fontSize: 16,
  fontWeight: 600,
  color: T.grey700,
};

const currencySuffixStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: T.grey600,
  flexShrink: 0,
};

function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function moneyInput(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function formatCurrency(value) {
  const number = toNumber(value);
  if (number <= 0) return "미설정";
  return formatMoney(number);
}

function formatDateTime(value) {
  if (!value) return "확인 전";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "확인 전";
  return parsed.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveMonthlyOrderLimit(settings) {
  return String(settings?.monthlyOrderLimit ?? settings?.monthlyBudgetAmount ?? settings?.monthlyLimit ?? DEFAULT_MONTHLY_ORDER_LIMIT);
}

function MetricTile({ label, value, detail, icon: Icon, tone = "blue" }) {
  const toneStyle = {
    blue: { bg: T.blue50, color: T.blue500 },
    grey: { bg: T.grey100, color: T.grey600 },
    red: { bg: T.red50, color: T.red500 },
    green: { bg: T.green50, color: T.green500 },
  }[tone] || { bg: T.grey100, color: T.grey600 };

  return (
    <div style={{ padding: "13px 14px", borderRadius: 14, background: toneStyle.bg, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
        {Icon && <Icon size={15} color={toneStyle.color} />}
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: toneStyle.color }}>{label}</p>
      </div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.grey900, lineHeight: 1.15 }}>{value}</p>
      {detail && <p style={{ margin: "4px 0 0", fontSize: 12, color: T.grey500, lineHeight: 1.35 }}>{detail}</p>}
    </div>
  );
}

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
  const [monthlyOrderLimit, setMonthlyOrderLimit] = useState(() => resolveMonthlyOrderLimit(initial));
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monitorRunning, setMonitorRunning] = useState(false);
  const [priceReferenceTime] = useState(() => Date.now());
  const hasDraftCredentials = useMemo(() => (
    Object.values(credentials).some(credential => credential?.username || credential?.password)
  ), [credentials]);
  const monitorSummary = useMemo(() => {
    const settings = { vendors, preferredVendor, maxOrderAmount, monthlyOrderLimit };
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
  }, [items, vendors, preferredVendor, maxOrderAmount, monthlyOrderLimit]);

  const policySummary = useMemo(() => {
    const staleThreshold = PRICE_STALE_DAYS * 24 * 60 * 60 * 1000;
    const vendorStats = new Map(vendors.map(vendor => [String(vendor.id), {
      id: String(vendor.id),
      name: vendor.name,
      optionCount: 0,
      urlCount: 0,
      inStockCount: 0,
      pricedCount: 0,
      uncheckedCount: 0,
      staleCount: 0,
      lowestWins: 0,
      shippingTotal: 0,
      shippingCount: 0,
      maxMinOrderQty: 1,
      latestCheckedAt: null,
    }]));
    let latestCheckedAt = null;
    let uncheckedCount = 0;
    let staleCount = 0;

    items.forEach(item => {
      const options = Array.isArray(item.vendor_options) ? item.vendor_options : [];
      const purchasableQty = Math.max(1, Number(item.min_qty || 1) - Number(item.current_qty || 0));
      const lowestOption = options
        .filter(option => option.in_stock !== false && getEffectiveVendorPrice(option, purchasableQty))
        .sort((a, b) => getEffectiveVendorPrice(a, purchasableQty) - getEffectiveVendorPrice(b, purchasableQty))[0];

      options.forEach(option => {
        const vendorId = String(option.vendor_id || "");
        const stat = vendorStats.get(vendorId) || {
          id: vendorId,
          name: option.vendor_name || `거래처 ${vendorId}`,
          optionCount: 0,
          urlCount: 0,
          inStockCount: 0,
          pricedCount: 0,
          uncheckedCount: 0,
          staleCount: 0,
          lowestWins: 0,
          shippingTotal: 0,
          shippingCount: 0,
          maxMinOrderQty: 1,
          latestCheckedAt: null,
        };
        const checkedAt = option.last_checked_at ? new Date(option.last_checked_at) : null;
        const checkedTime = checkedAt && !Number.isNaN(checkedAt.getTime()) ? checkedAt.getTime() : null;
        const shippingFee = toPositiveNumber(option.shipping_fee);
        const minOrderQty = Math.max(1, Number(option.min_order_qty) || 1);

        stat.optionCount += 1;
        stat.urlCount += option.url ? 1 : 0;
        stat.inStockCount += option.in_stock === false ? 0 : 1;
        stat.pricedCount += toPositiveNumber(option.price) ? 1 : 0;
        stat.maxMinOrderQty = Math.max(stat.maxMinOrderQty, minOrderQty);
        if (shippingFee) {
          stat.shippingTotal += shippingFee;
          stat.shippingCount += 1;
        }
        if (checkedTime) {
          stat.latestCheckedAt = !stat.latestCheckedAt || checkedTime > new Date(stat.latestCheckedAt).getTime()
            ? option.last_checked_at
            : stat.latestCheckedAt;
          latestCheckedAt = !latestCheckedAt || checkedTime > new Date(latestCheckedAt).getTime()
            ? option.last_checked_at
            : latestCheckedAt;
          if (priceReferenceTime - checkedTime > staleThreshold) {
            stat.staleCount += 1;
            staleCount += 1;
          }
        } else {
          stat.uncheckedCount += 1;
          uncheckedCount += 1;
        }
        if (lowestOption && String(lowestOption.vendor_id) === vendorId) stat.lowestWins += 1;
        vendorStats.set(vendorId, stat);
      });
    });

    const connectedCount = vendors.filter(vendor => credentialStatuses[String(vendor.id)]?.connected).length;
    const automaticCount = vendors.filter(vendor => vendor.automaticOrdering !== false).length;
    const preferredVendorName = preferredVendor === "lowest"
      ? "최저가 자동 선택"
      : vendors.find(vendor => String(vendor.id) === String(preferredVendor))?.name || "거래처 미정";

    return {
      connectedCount,
      automaticCount,
      preferredVendorName,
      latestCheckedAt,
      uncheckedCount,
      staleCount,
      vendorStats: Array.from(vendorStats.values()),
    };
  }, [credentialStatuses, items, preferredVendor, priceReferenceTime, vendors]);

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

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: 80 }}>
      <p style={sectionTitleStyle}>주문 정책 요약</p>
      <Card style={{ marginBottom: 20, padding: "16px" }}>
        <div style={panelGridStyle}>
          <MetricTile
            label="연결 거래처"
            value={`${policySummary.connectedCount}/${vendors.length}`}
            detail={credentialStatusLoading ? "상태 확인 중" : "계정 저장 기준"}
            icon={Wifi}
            tone={policySummary.connectedCount > 0 ? "blue" : "grey"}
          />
          <MetricTile
            label="자동발주"
            value={`${policySummary.automaticCount}곳`}
            detail={`정책: ${policySummary.preferredVendorName}`}
            icon={ShoppingCart}
            tone={policySummary.automaticCount > 0 ? "green" : "grey"}
          />
          <MetricTile
            label="월 한도"
            value={formatCurrency(monthlyOrderLimit)}
            detail={`1회 ${formatCurrency(maxOrderAmount)}`}
            icon={WalletCards}
            tone="blue"
          />
          <MetricTile
            label="최근 가격확인"
            value={formatDateTime(policySummary.latestCheckedAt)}
            detail={`${policySummary.uncheckedCount}개 미확인 · ${policySummary.staleCount}개 오래됨`}
            icon={Clock3}
            tone={policySummary.uncheckedCount + policySummary.staleCount > 0 ? "red" : "green"}
          />
        </div>
      </Card>

      <p style={sectionTitleStyle}>주문 한도와 선택 정책</p>
      <Card style={{ marginBottom: 20, padding: "20px" }}>
        <div style={{ marginBottom: 22 }}>
          <label style={inputLabelStyle}>
            선호 거래처
          </label>
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
          <div>
            <label style={inputLabelStyle}>
              1회 최대 주문금액
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Inp
                type="text"
                value={maxOrderAmount}
                onChange={(e) => setMaxOrderAmount(moneyInput(e.target.value))}
                placeholder="예: 50000"
                style={{
                  flex: 1,
                  borderColor: saveAttempted && maxOrderAmountError ? T.danger : T.inputBorder,
                  background: saveAttempted && maxOrderAmountError ? T.dangerBg : T.inputBg,
                }}
              />
              <span style={currencySuffixStyle}>원</span>
            </div>
            <p style={{ ...helperTextStyle, color: saveAttempted && maxOrderAmountError ? T.red500 : T.grey500 }}>
              {saveAttempted && maxOrderAmountError ? maxOrderAmountError : "자동발주가 한 번에 넘지 않아야 하는 금액입니다"}
            </p>
          </div>

          <div>
            <label style={inputLabelStyle}>
              월 주문 한도
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Inp
                type="text"
                value={monthlyOrderLimit}
                onChange={(e) => setMonthlyOrderLimit(moneyInput(e.target.value))}
                placeholder="예: 300000"
                style={{
                  flex: 1,
                  borderColor: saveAttempted && monthlyOrderLimitError ? T.danger : T.inputBorder,
                  background: saveAttempted && monthlyOrderLimitError ? T.dangerBg : T.inputBg,
                }}
              />
              <span style={currencySuffixStyle}>원</span>
            </div>
            <p style={{ ...helperTextStyle, color: saveAttempted && monthlyOrderLimitError ? T.red500 : T.grey500 }}>
              {saveAttempted && monthlyOrderLimitError ? monthlyOrderLimitError : "월 예산을 넘기는 자동발주를 사전에 막는 기준입니다"}
            </p>
          </div>
        </div>
      </Card>

      {/* 도매 사이트 연결 섹션 */}
      <p style={sectionTitleStyle}>거래처 연결과 정책 단서</p>
      <Card style={{ marginBottom: 20, padding: "16px" }}>
        {vendors.map((vendor, idx) => (
          <div key={vendor.id}>
            {(() => {
              const status = credentialStatuses[String(vendor.id)] || vendorCredentialsApi.disabledStatus(vendor.id);
              const stat = policySummary.vendorStats.find(row => row.id === String(vendor.id)) || {};
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 8, margin: "0 0 12px" }}>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: T.grey50 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.grey500 }}>구매 후보</p>
                <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 800, color: T.grey900 }}>{stat.optionCount || 0}개</p>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: T.grey50 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.grey500 }}>배송비 힌트</p>
                <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 800, color: T.grey900 }}>{averageShippingFee ? formatCurrency(averageShippingFee) : "미등록"}</p>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: T.grey50 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.grey500 }}>최소 주문</p>
                <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 800, color: T.grey900 }}>{stat.maxMinOrderQty > 1 ? `${stat.maxMinOrderQty}개까지` : "1개 단위"}</p>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: T.grey50 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.grey500 }}>가격 확인</p>
                <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 800, color: T.grey900 }}>{formatDateTime(stat.latestCheckedAt)}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              <Chip
                label={policyCue}
                color={String(preferredVendor) === String(vendor.id) || preferredVendor === "lowest" ? T.blue500 : T.grey600}
                bg={String(preferredVendor) === String(vendor.id) || preferredVendor === "lowest" ? T.blue50 : T.grey100}
              />
              <Chip
                label={`${stat.urlCount || 0}개 URL`}
                color={(stat.urlCount || 0) > 0 ? T.blue500 : T.grey600}
                bg={(stat.urlCount || 0) > 0 ? T.blue50 : T.grey100}
              />
              {(stat.staleCount || stat.uncheckedCount) > 0 && (
                <Chip
                  label={`확인 필요 ${Number(stat.staleCount || 0) + Number(stat.uncheckedCount || 0)}개`}
                  color={T.red500}
                  bg={T.red50}
                />
              )}
            </div>
                </>
              );
            })()}
            {idx < vendors.length - 1 && <Divider />}
          </div>
        ))}
      </Card>

      <p style={sectionTitleStyle}>최저가 감시</p>
      <Card style={{ marginBottom: 20, padding: "18px 16px" }}>
        <div style={{ ...panelGridStyle, marginBottom: 14 }}>
          <MetricTile
            label="감시 품목"
            value={`${monitorSummary.monitoredCount}개`}
            detail="구매 후보 등록 품목"
            icon={Link2}
            tone="blue"
          />
          <MetricTile
            label="구매 후보"
            value={`${monitorSummary.candidateCount}개`}
            detail="거래처별 가격 옵션"
            icon={Truck}
            tone="grey"
          />
          <MetricTile
            label="오래된 가격"
            value={`${policySummary.staleCount}개`}
            detail={`${PRICE_STALE_DAYS}일 이상 미갱신`}
            icon={AlertTriangle}
            tone={policySummary.staleCount > 0 ? "red" : "green"}
          />
          <MetricTile
            label="미확인 가격"
            value={`${policySummary.uncheckedCount}개`}
            detail={formatDateTime(policySummary.latestCheckedAt)}
            icon={Clock3}
            tone={policySummary.uncheckedCount > 0 ? "red" : "green"}
          />
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
