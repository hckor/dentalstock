import { Layers3, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { T, font } from "../../../constants/colors";

const GROUP_OPTIONS = [
  { id: "all", label: "전체", Icon: SlidersHorizontal },
  { id: "category", label: "카테고리", Icon: Layers3 },
  { id: "location", label: "위치", Icon: MapPin },
];

export function StocktakeControls({ query, setQuery, groupBy, setGroupBy, priorityFirst, setPriorityFirst }) {
  return (
    <>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={18} color={T.grey400} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="품목명, 위치, 카테고리 검색"
          style={{ width: "100%", height: 46, border: `1px solid ${T.inputBorder}`, borderRadius: 12, background: T.inputBg, padding: "0 14px 0 42px", boxSizing: "border-box", color: T.textStrong, fontFamily: font, fontSize: 16, outlineColor: T.primary }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {GROUP_OPTIONS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setGroupBy(id)}
            style={{ flex: 1, minHeight: 40, border: "none", borderRadius: 9999, background: groupBy === id ? T.grey900 : T.grey100, color: groupBy === id ? T.white : T.grey700, fontFamily: font, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPriorityFirst(value => !value)}
        style={{ width: "100%", marginBottom: 12, minHeight: 40, border: `1px solid ${priorityFirst ? T.blue500 + "55" : T.grey200}`, borderRadius: 9999, background: priorityFirst ? T.blue50 : T.white, color: priorityFirst ? T.blue500 : T.grey600, fontFamily: font, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      >
        {priorityFirst ? "차이 큰 품목과 미확인 품목 우선" : "품목명 순서로 보기"}
      </button>
    </>
  );
}
