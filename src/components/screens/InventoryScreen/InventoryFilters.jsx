import { CalendarClock, Search } from "lucide-react";
import { T, font, monoFont } from "../../../constants/colors";
import { ALL_CATS } from "./inventoryScreenUtils";

export function InventoryFilters({ search, setSearch, cat, setCat, risk, setRisk, riskOptions, onExpiryClick }) {
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }}>
            <Search size={18} color={T.grey400} />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="품목명 검색"
            style={{ width: "100%", height: 44, padding: "10px 16px 10px 40px", borderRadius: 12, border: `1px solid ${T.inputBorder}`, background: T.inputBg, fontSize: 16, color: T.text, fontFamily: font, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <button
          onClick={onExpiryClick}
          style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, height: 44, padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.grey200}`, background: T.white, color: T.grey700, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" }}
        >
          <CalendarClock size={18} color={T.grey600} /> 유통기한
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 10 }}>
        {ALL_CATS.map(c => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              style={{
                flexShrink: 0,
                padding: "7px 14px",
                borderRadius: 12,
                border: active ? "none" : `1px solid ${T.grey200}`,
                background: active ? T.primary : T.white,
                color: active ? T.white : T.grey600,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: font,
                transition: "all 120ms",
              }}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 10 }}>
        {riskOptions.map(option => {
          const active = risk === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setRisk(option.id)}
              style={{
                flexShrink: 0,
                minHeight: 36,
                padding: "8px 12px",
                borderRadius: 9999,
                border: active ? `1px solid ${option.color}` : `1px solid ${T.grey200}`,
                background: active ? `${option.color}14` : T.white,
                color: active ? option.color : T.grey600,
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: font,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{option.label}</span>
              <span style={{ fontFamily: monoFont, fontVariantNumeric: "tabular-nums" }}>{option.count}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
