import { T, font } from "../../../constants/colors";
import { ORDER_ST } from "../../../constants/orderStates";

export function ShippingTrackingTabs({ primaryTabs, holdTab, rejectedTab, activeTab, onChange }) {
  const holdTone = ORDER_ST.hold;
  const rejectedTone = ORDER_ST.rejected;

  return (
    <>
      <div style={{ background: T.grey100, borderRadius: 12, padding: 4, marginBottom: 8, display: "flex", gap: 2 }}>
        {primaryTabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "12px 8px",
                border: "none",
                borderRadius: 9999,
                cursor: "pointer",
                fontFamily: font,
                fontSize: 14,
                fontWeight: 600,
                lineHeight: "20px",
                background: active ? T.white : "transparent",
                boxShadow: active ? T.shadowSelected : "none",
                color: active ? T.grey900 : T.grey500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                whiteSpace: "nowrap",
                wordBreak: "keep-all",
                transition: "all 150ms",
              }}
            >
              {tab.label}
              <span style={{ minWidth: 20, padding: "1px 6px", borderRadius: 9999, boxSizing: "border-box", background: active ? T.primaryBg : T.white, color: tab.count > 0 ? (active ? T.primary : T.grey700) : T.grey400, fontSize: 12, fontWeight: 700, lineHeight: "18px" }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {(holdTab || rejectedTab) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 16 }}>
          {holdTab && (
            <button
              onClick={() => onChange(holdTab.id)}
              style={{ minWidth: 0, padding: "7px 8px", borderRadius: 9999, border: `1px solid ${activeTab === holdTab.id ? holdTone.border : T.grey200}`, background: activeTab === holdTab.id ? holdTone.bg : T.white, color: activeTab === holdTab.id ? holdTone.text : T.grey500, fontFamily: font, fontSize: 13, fontWeight: 700, lineHeight: "18px", cursor: "pointer", whiteSpace: "nowrap", wordBreak: "keep-all" }}
            >
              {holdTab.label} {holdTab.count}건
            </button>
          )}
          {rejectedTab && (
            <button
              onClick={() => onChange(rejectedTab.id)}
              style={{ minWidth: 0, padding: "7px 8px", borderRadius: 9999, border: `1px solid ${activeTab === rejectedTab.id ? rejectedTone.border : T.grey200}`, background: activeTab === rejectedTab.id ? rejectedTone.bg : T.white, color: activeTab === rejectedTab.id ? rejectedTone.text : T.grey500, fontFamily: font, fontSize: 13, fontWeight: 700, lineHeight: "18px", cursor: "pointer", whiteSpace: "nowrap", wordBreak: "keep-all" }}
            >
              {rejectedTab.label} {rejectedTab.count}건
            </button>
          )}
        </div>
      )}
    </>
  );
}
