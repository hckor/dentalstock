export const DATA_CLASSIFICATION = {
  PUBLIC_DEMO: "public_demo",
  CLINIC_INTERNAL: "clinic_internal",
  PERSONAL: "personal",
  SECRET: "secret",
};

export const DATA_SECURITY_POLICY = {
  users: {
    classification: DATA_CLASSIFICATION.PERSONAL,
    notes: "사용자 이름, 역할, 활성 상태는 clinicId 범위 안에서만 읽고 쓴다. PIN은 해시만 저장한다.",
  },
  items: {
    classification: DATA_CLASSIFICATION.CLINIC_INTERNAL,
    notes: "재고 품목과 위치는 병원 내부 데이터다. clinicId 밖으로 노출하지 않는다.",
  },
  txs: {
    classification: DATA_CLASSIFICATION.CLINIC_INTERNAL,
    notes: "입출고 이력은 감사 로그 성격이 있으므로 삭제보다 정정 이벤트를 우선한다.",
  },
  orders: {
    classification: DATA_CLASSIFICATION.CLINIC_INTERNAL,
    notes: "발주 상태, 송장, 입고 이벤트는 권한별로 읽기/쓰기 범위를 분리한다.",
  },
  surgeries: {
    classification: DATA_CLASSIFICATION.PERSONAL,
    notes: "환자명과 수술 일정은 개인정보에 해당한다. 향후 서버 저장 시 가명화/최소 보관을 우선한다.",
  },
  notifs: {
    classification: DATA_CLASSIFICATION.CLINIC_INTERNAL,
    notes: "알림은 사용자별 읽음 상태 분리를 고려한다.",
  },
  vendorCredentials: {
    classification: DATA_CLASSIFICATION.SECRET,
    notes: "도매몰 ID/PW는 클라이언트 저장 금지. 서버에서 AES-256-GCM/KMS로 암호화해 별도 컬렉션에 둔다.",
  },
  session: {
    classification: DATA_CLASSIFICATION.SECRET,
    notes: "서버 전환 후 세션은 HttpOnly secure cookie 또는 Firebase Auth 토큰으로 대체한다.",
  },
};

export const SERVER_ONLY_FIELDS = [
  "vendors.password",
  "vendorCredentials.passwordCiphertext",
  "vendorCredentials.passwordNonce",
  "vendorCredentials.passwordTag",
  "session",
  "authAttempts",
];

export function assertNoServerOnlyField(path) {
  return !SERVER_ONLY_FIELDS.some(field => path === field || path.startsWith(`${field}.`));
}
