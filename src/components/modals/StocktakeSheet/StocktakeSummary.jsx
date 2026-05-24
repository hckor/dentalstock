import { T, monoFont } from "../../../constants/colors";

export function StocktakeSummary({ summary, totalCount }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div style={{ background: T.blue50, borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: T.blue500, fontWeight: 700 }}>완료율</p>
          <p style={{ margin: "2px 0 0", fontSize: 24, lineHeight: "30px", color: T.blue500, fontWeight: 700, fontFamily: monoFont }}>{summary.completion}%</p>
          <p style={{ margin: "1px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey600 }}>{summary.checkedCount}/{totalCount} 확인</p>
        </div>
        <div style={{ background: summary.largeDiffCount > 0 ? T.red50 : T.grey100, borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: summary.largeDiffCount > 0 ? T.red500 : T.grey600, fontWeight: 700 }}>차이 큰 품목</p>
          <p style={{ margin: "2px 0 0", fontSize: 24, lineHeight: "30px", color: summary.largeDiffCount > 0 ? T.red500 : T.grey900, fontWeight: 700, fontFamily: monoFont }}>{summary.largeDiffCount}</p>
          <p style={{ margin: "1px 0 0", fontSize: 12, lineHeight: "17px", color: T.grey600 }}>우선 재확인 권장</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "보정 품목", value: summary.changeCount, color: T.grey900, bg: T.grey100 },
          { label: "증가 합계", value: `+${summary.plusQty}`, color: T.blue500, bg: T.blue50 },
          { label: "감소 합계", value: `-${summary.minusQty}`, color: T.red500, bg: T.red50 },
        ].map(card => (
          <div key={card.label} style={{ background: card.bg, borderRadius: 12, padding: "10px 10px" }}>
            <p style={{ margin: 0, fontSize: 11, lineHeight: "16px", color: T.grey600, fontWeight: 700 }}>{card.label}</p>
            <p style={{ margin: "2px 0 0", fontSize: 19, lineHeight: "25px", color: card.color, fontWeight: 700, fontFamily: monoFont }}>{card.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
