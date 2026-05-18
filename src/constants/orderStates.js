import { T } from "./colors";

// ─── 발주 상태 ────────────────────────────────────────
// pending  → 요청됨 (아직 검토 전)
// ordered  → 승인 완료 + 발주 접수 (배송 대기)
// received → 입고 확인 완료 (재고 반영됨)
// rejected → 거절됨
export const ORDER_ST = {
  pending:  { bg:T.orange50,  text:T.orange500, border:"#ffd580", label:"발주요청됨", short:"요청됨"  },
  ordered:  { bg:T.teal50,    text:T.teal500,   border:"#99dede", label:"입고대기",   short:"입고대기" },
  received: { bg:T.green50,   text:T.green500,  border:"#b7eed6", label:"입고완료",   short:"입고완료" },
  rejected: { bg:T.red50,     text:T.red500,    border:"#f9c0c5", label:"거절됨",     short:"거절됨"  },
};
