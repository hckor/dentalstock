import { T } from "./colors";

// ─── 발주 상태 ────────────────────────────────────────
// pending  → 요청됨 (아직 검토 전)
// ordered  → 승인 완료 + 발주 접수 (배송 대기)
// received → 입고 확인 완료 (재고 반영됨)
// rejected → 거절됨
// hold     → 추가 확인 필요 (처리 보류)
export const ORDER_STATUS = Object.freeze({
  pending: "pending",
  hold: "hold",
  ordered: "ordered",
  received: "received",
  rejected: "rejected",
});

export const ORDER_ST = {
  [ORDER_STATUS.pending]:  { bg:T.warningBg, text:T.warning, border:T.warningLine, label:"발주요청됨", short:"요청됨"  },
  [ORDER_STATUS.hold]:     { bg:T.holdBg,    text:T.hold,    border:T.holdLine,    label:"보류됨",     short:"보류"    },
  [ORDER_STATUS.ordered]:  { bg:T.infoBg,    text:T.info,    border:T.infoLine,    label:"입고대기",   short:"입고대기" },
  [ORDER_STATUS.received]: { bg:T.successBg, text:T.success, border:T.successLine, label:"입고완료",   short:"입고완료" },
  [ORDER_STATUS.rejected]: { bg:T.dangerBg,  text:T.danger,  border:T.dangerLine,  label:"거절됨",     short:"거절됨"  },
};
