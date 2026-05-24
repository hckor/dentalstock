# DentalStock 서비스 하드닝 운영 런북

작성일: 2026-05-25  
대상: DentalStock React PWA, Supabase 전환, Node 자동화 서버/워커

## 목적

DentalStock을 실제 치과 운영에 넣기 전에 반드시 닫아야 할 13개 개발 우려사항을 운영자가 이해할 수 있고, 엔지니어가 바로 작업으로 쪼갤 수 있는 체크리스트로 정리한다.

이 문서는 소유자용 판단 기준과 엔지니어용 완료 조건을 함께 둔다. 기능이 "화면에서 된다"가 아니라 "서버, DB, 장애 상황에서도 안전하다"를 완료 기준으로 삼는다.

## 현재 기준

- 앱은 React/Vite PWA이며 `local`, `server`, `supabase` API 모드를 가진다.
- 역할은 `owner`, `manager`, `hygienist`, `staff`를 사용한다.
- 발주 상태는 앱 기준 `pending`, `hold`, `ordered`, `received`, `rejected`를 사용하고, Supabase는 기존 호환을 위해 `approved`, `shipping`, `cancelled`도 가질 수 있다.
- Supabase 주요 테이블은 `clinic_id` 기준 RLS가 켜져 있다.
- 재고 입출고는 `txs`, 발주는 `orders`, 자동화 작업은 `order_jobs`, 감사 기록은 `audit_logs`로 분리한다.
- 도매몰 계정과 자동주문 워커는 server-only 경계로 옮기는 중이며, 클라이언트 저장은 운영 금지다.

## 우선순위 한 장 요약

| 단계 | 목표 | 완료 판단 |
|---|---|---|
| P0 now | 운영 사고를 막는 최소 안전장치 | 병원 격리, 서버 권한 검증, 재고/발주 원자 처리, 감사 로그, 배포/롤백 기준이 닫힘 |
| P1 next | 장애와 현장 사용성을 견디는 장치 | 오프라인 재시도, 명확한 에러 처리, 백업 복구 리허설, 성능/카탈로그 분할, 테스트 확대 |
| P2 later | 자동화와 확장 운영 고도화 | 자동주문 idempotency, 관측성, UX 부하 감소, 대규모 카탈로그/다병원 운영 최적화 |

## P0 now: 운영 전 필수

### 1. RBAC와 서버 검증

소유자 관점: 화면에서 버튼을 숨기는 것만으로는 충분하지 않다. 권한 없는 사용자가 API를 직접 호출해도 실패해야 한다.

- [ ] 모든 쓰기 API에서 사용자 역할을 서버 또는 Supabase RPC 안에서 다시 확인한다.
- [ ] `owner`만 직원 역할 변경과 계정 비활성화를 할 수 있다.
- [ ] `owner`, `manager`만 품목 관리, 발주 승인/거절, 송장 등록, 입고 확인을 할 수 있다.
- [ ] `hygienist`, `staff`는 발주 요청과 본인 업무 입력만 허용한다.
- [ ] 클라이언트가 보낸 `clinicId`, `role`, `userId` 헤더나 payload를 운영 권한의 근거로 쓰지 않는다.
- [ ] 권한 실패는 `403`과 사람이 이해할 수 있는 메시지로 통일한다.

Definition of Done:
- [ ] 권한 없는 계정으로 주요 쓰기 작업을 직접 호출해도 실패한다.
- [ ] 권한 실패가 감사 로그 또는 보안 로그에 남는다.
- [ ] `permissions.test`, 서버 order action 테스트, Supabase 정책 테스트가 같은 역할표를 검증한다.

### 2. 병원 격리와 RLS

소유자 관점: A치과 직원이 B치과 재고, 환자명, 도매몰 연결 상태를 볼 수 없어야 한다.

- [ ] 모든 업무 테이블에 `clinic_id`가 있고, 조회/수정 정책이 `auth.uid()`의 profile clinic과 일치해야 한다.
- [ ] `vendor_credentials`, `order_jobs`는 브라우저 정책을 열지 않고 service role/server-only로만 접근한다.
- [ ] 리스트 API는 항상 clinic 범위를 먼저 걸고, 빈 clinic 값이면 빈 배열 또는 인증 오류를 반환한다.
- [ ] audit log, 알림, 수술 일정에도 환자명/도매몰 정보가 다른 clinic으로 섞이지 않는지 확인한다.
- [ ] 데모 clinic seed와 실제 clinic 데이터를 분리한다.

Definition of Done:
- [ ] 서로 다른 두 clinic 계정으로 items/orders/surgeries/audit_logs 교차 조회가 실패한다.
- [ ] Supabase SQL Editor에서 RLS 우회 없이 cross-clinic select/update가 실패한다.
- [ ] 운영 Vercel에는 publishable key만 있고 service role key는 없다.

### 3. 재고 원장과 수량 정합성

소유자 관점: 재고 숫자는 현재 수량 하나만 믿으면 안 된다. 언제, 누가, 왜 바꿨는지 원장이 있어야 한다.

- [ ] 재고 수량 변경은 `items.stock` 업데이트와 `txs` 추가를 한 트랜잭션/RPC로 묶는다.
- [ ] 출고 후 수량이 0 미만이 되지 않게 DB에서 막는다.
- [ ] 재고실사는 기존 이력 삭제가 아니라 `adjust` 거래로 남긴다.
- [ ] 발주 입고 확인은 `orders.received_at`, `items.stock`, `txs`, `audit_logs`를 한 번에 처리한다.
- [ ] 실패 시 일부만 반영된 상태가 남지 않도록 원자 처리한다.

Definition of Done:
- [ ] 동시 출고 요청에서도 재고가 음수가 되지 않는다.
- [ ] 특정 품목의 현재 수량을 `txs` 합산으로 재검산할 수 있다.
- [ ] `apply_stock_transaction`, `receive_order_stock` 경로가 성공/실패 테스트를 가진다.

### 4. 발주 상태 머신

소유자 관점: 발주는 "요청됨", "보류", "입고대기", "입고완료", "거절" 중 하나여야 하고, 거꾸로 움직이면 안 된다.

- [ ] 앱 상태 `pending -> hold -> ordered -> received`와 `pending/hold -> rejected`를 공식 흐름으로 둔다.
- [ ] 운영 DB 상태 `approved`, `shipping`은 화면에서 `ordered`로 매핑하되, 새 기능에서는 하나의 표준 상태로 정리한다.
- [ ] 승인 시 승인자, 승인시각, 거래처, 금액 한도를 저장한다.
- [ ] 입고 완료 후에는 수량 변경을 직접 수정하지 않고 정정 발주/재고 조정으로 처리한다.
- [ ] 보류 상태는 사유와 다음 담당자를 남긴다.

Definition of Done:
- [ ] 불가능한 상태 전이, 예: `received -> ordered`, `rejected -> received`, 가 서버에서 실패한다.
- [ ] 상태 전이마다 감사 로그가 남는다.
- [ ] 발주 목록과 배송 화면이 같은 상태 정의를 사용한다.

### 5. 동시성, 중복 요청, idempotency

소유자 관점: 버튼을 두 번 누르거나 네트워크가 끊겼다 돌아와도 발주가 두 번 나가면 안 된다.

- [ ] 발주 승인, 입고 확인, 송장 등록, 재고 입출고에는 `requestId` 또는 idempotency key를 받는다.
- [ ] 같은 사용자/같은 작업/같은 requestId는 한 번만 처리한다.
- [ ] 자동주문 `order_jobs`는 같은 `order_id`에 활성 job이 하나만 생기게 제한한다.
- [ ] 워커는 `queued -> running -> succeeded/failed` 전이를 잠금 또는 compare-and-set 방식으로 처리한다.
- [ ] 재시도 가능한 실패와 사람 확인이 필요한 실패를 구분한다.

Definition of Done:
- [ ] 같은 승인 요청을 2회 보내도 주문 job과 audit log가 중복 생성되지 않는다.
- [ ] 두 기기에서 동시에 입고 확인해도 재고 반영은 한 번만 된다.
- [ ] 실패한 워커 job은 attempts, error category, 다음 재시도 가능 여부를 가진다.

### 6. 감사 로그

소유자 관점: 문제가 생겼을 때 "누가 무엇을 했는지"는 남기되, 비밀번호나 카드정보는 절대 남기지 않는다.

- [ ] 입출고, 발주 요청/승인/거절/보류/송장등록/입고확인, 수술 생성/수정/삭제, 설정 변경을 기록한다.
- [ ] audit log는 append-only로 두고 update/delete 경로를 만들지 않는다.
- [ ] metadata에는 password, token, session, cookie, pin, card, credential 계열 값을 마스킹한다.
- [ ] 환자명과 도매몰 계정 원문은 audit log에 저장하지 않는다.
- [ ] `owner`, `manager`만 clinic audit log를 볼 수 있다.

Definition of Done:
- [ ] 운영 주요 작업 1건당 audit log 1건 이상이 남는다.
- [ ] 민감 키워드가 들어간 metadata가 `[redacted]`로 저장된다.
- [ ] 감사 로그 삭제 API, repository 메서드, RLS 정책이 없다.

### 7. 배포, Vercel, 롤백

소유자 관점: 배포가 잘못되면 바로 이전 정상 버전으로 돌아갈 수 있어야 한다.

- [ ] Vercel 환경변수는 `VITE_DENTALSTOCK_API_MODE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`만 브라우저용으로 둔다.
- [ ] service role key, 도매몰 credential, 배송 API key는 Vercel client 변수에 넣지 않는다.
- [ ] 배포 전 `npm run lint`, `npm run test`, `npm run build`, 필요 시 `npm run server:check`를 통과한다.
- [ ] DB migration은 되돌릴 방법 또는 수동 복구 SQL을 릴리스 노트에 포함한다.
- [ ] 배포 후 smoke test는 로그인, 재고 조회, 입출고 1건, 발주 요청/승인, 입고 확인, audit log 조회를 포함한다.
- [ ] 롤백 기준은 "로그인 불가", "재고/발주 쓰기 실패", "clinic 격리 의심", "민감정보 노출"로 둔다.

Definition of Done:
- [ ] 릴리스마다 배포 체크리스트와 롤백 대상 commit/Vercel deployment URL이 남는다.
- [ ] Supabase migration 적용 전 백업 또는 PITR 상태를 확인한다.
- [ ] 롤백 후에도 DB schema와 앱 코드가 호환되는지 확인한다.

## P1 next: 현장 안정화

### 8. 에러 처리

소유자 관점: 실패했을 때 직원에게는 다음 행동이 보여야 하고, 엔지니어에게는 원인이 남아야 한다.

- [ ] 사용자 메시지는 "다시 시도", "관리자에게 요청", "입력값 수정" 중 하나로 안내한다.
- [ ] 서버 에러 코드는 `order_action_forbidden`, `insufficient_stock`, `tracking_provider_failed`처럼 작업 단위로 표준화한다.
- [ ] 콘솔/로그에는 requestId, clinicId, action, entityId를 남기되 민감정보는 제외한다.
- [ ] 외부 배송/도매몰 API 원문 에러를 사용자 화면이나 audit log에 그대로 노출하지 않는다.

Definition of Done:
- [ ] 주요 실패 케이스별 사용자 문구와 엔지니어 로그가 정의되어 있다.
- [ ] ErrorBoundary와 toast가 같은 에러 분류를 사용한다.
- [ ] 민감정보 포함 에러 샘플이 로그 마스킹 테스트를 통과한다.

### 9. 오프라인 재시도

소유자 관점: 진료실 네트워크가 끊겨도 직원은 입력을 잃지 않아야 한다. 다만 중복 발주는 막아야 한다.

- [ ] 오프라인 중 생성한 작업은 local queue에 저장하고 온라인 복귀 시 순서대로 재전송한다.
- [ ] queue 항목에는 requestId, actor, clinicId, action, payload, createdAt, retryCount를 둔다.
- [ ] 재고 출고와 발주 승인처럼 위험한 작업은 재전송 전 최신 상태를 다시 확인한다.
- [ ] 사용자는 "대기 중", "전송됨", "확인 필요" 상태를 볼 수 있다.

Definition of Done:
- [ ] 네트워크 차단 후 입출고 입력이 사라지지 않는다.
- [ ] 온라인 복귀 후 같은 작업이 한 번만 반영된다.
- [ ] 충돌 시 자동 덮어쓰기 대신 확인 필요 상태로 멈춘다.

### 10. 백업과 복구

소유자 관점: 실수나 장애가 나도 전날 업무 데이터까지는 복구할 수 있어야 한다.

- [ ] Supabase 자동 백업/PITR 가능 여부와 보관 기간을 확인한다.
- [ ] 매일 최소 1회 `clinics`, `profiles`, `items`, `txs`, `orders`, `surgeries`, `settings`, `audit_logs`를 백업한다.
- [ ] `vendor_credentials`는 암호화 상태로 백업하고, 복호화 키는 별도 Secret Manager에 둔다.
- [ ] 월 1회 staging 프로젝트로 복구 리허설을 한다.
- [ ] 복구 후 clinic 격리와 RLS가 유지되는지 확인한다.

Definition of Done:
- [ ] 최근 백업 시각과 복구 목표시간(RTO), 복구 목표시점(RPO)이 문서화되어 있다.
- [ ] staging 복구 리허설 기록이 남아 있다.
- [ ] credential 복구는 키 접근권한자 2인 승인 절차를 따른다.

### 11. 테스트

소유자 관점: 사람이 눌러보는 테스트만으로는 재고/발주 사고를 막기 어렵다.

- [ ] 권한, RLS, 재고 RPC, 발주 상태 전이, idempotency, audit masking 테스트를 P0 회귀 테스트로 묶는다.
- [ ] 컴포넌트 테스트는 홈, 재고, 입출고, 발주 요청, 배송 추적, 관리자 설정의 핵심 흐름을 포함한다.
- [ ] 서버 테스트는 승인/거절/송장/입고 API의 역할별 성공/실패를 검증한다.
- [ ] Supabase migration은 로컬 또는 임시 프로젝트에서 재실행 가능해야 한다.

Definition of Done:
- [ ] PR마다 `npm run lint`, `npm run test`, `npm run build`가 통과한다.
- [ ] 서버 변경 PR은 `npm run server:check`가 통과한다.
- [ ] 신규 장애 재현 케이스는 테스트로 먼저 남긴다.

## P2 later: 확장과 사용성

### 12. 인지부하를 줄이는 UX 규칙

소유자 관점: 바쁜 진료 중에는 직원이 생각할 일을 줄여야 한다. 화면은 결정해야 할 것만 보여준다.

- [ ] 홈은 오늘 필요한 작업, 부족 재고, 승인 대기, 배송 문제만 우선 노출한다.
- [ ] 발주 버튼은 상태별로 하나의 다음 행동만 강조한다.
- [ ] 입고 완료, 대량 출고, 자동주문 승인 같은 위험 작업은 확인 문구와 요약 금액을 보여준다.
- [ ] owner용 비용/통계와 staff용 현장 작업을 화면에서 분리한다.
- [ ] 빈 상태, 실패 상태, 보류 상태에는 다음 담당자와 다음 행동을 명확히 둔다.

Definition of Done:
- [ ] 각 역할별 첫 화면에서 3초 안에 다음 작업을 알 수 있다.
- [ ] 같은 화면에 primary action이 둘 이상 경쟁하지 않는다.
- [ ] 모바일 폭에서 버튼/상태 배지가 겹치지 않는다.

### 13. 성능과 카탈로그 lazy load

소유자 관점: 재료 카탈로그가 커져도 앱 첫 화면은 빠르게 떠야 한다.

- [ ] 초기 로드는 사용자, clinic 설정, 오늘 작업, 부족 재고 중심으로 제한한다.
- [ ] 치과 재료 전체 카탈로그는 검색/초기재고 설정 화면 진입 시 lazy load한다.
- [ ] 카탈로그 검색은 category, name, vendor, barcode 기준 index 또는 사전 가공 데이터를 사용한다.
- [ ] 배송 이벤트와 audit log는 페이지네이션을 기본값으로 둔다.
- [ ] 큰 seed/catalog 파일은 번들에 무조건 포함하지 않고 route-level split 또는 remote fetch로 분리한다.

Definition of Done:
- [ ] 첫 화면에 필요 없는 전체 카탈로그가 초기 JS에 들어가지 않는다.
- [ ] 1,000개 품목 기준 검색/스크롤이 모바일에서 끊기지 않는다.
- [ ] audit log와 배송 이벤트 목록은 limit/pagination 없이 전체 조회하지 않는다.

## 운영 체크리스트

릴리스 전:
- [ ] 이번 배포가 P0 체크리스트 중 어떤 항목을 닫는지 릴리스 노트에 적었다.
- [ ] migration, 환경변수, 롤백 방법을 한 곳에 적었다.
- [ ] 운영 데이터에 적용하기 전 staging에서 smoke test를 했다.
- [ ] 민감정보가 프론트 번들, Vercel client env, 로그, audit metadata에 들어가지 않는지 확인했다.

릴리스 직후:
- [ ] 로그인과 clinic 격리 조회를 확인했다.
- [ ] 재고 입고/출고 각 1건을 테스트하고 `txs`, `items`, `audit_logs`를 확인했다.
- [ ] 발주 요청부터 승인, 송장 등록, 입고 확인까지 1건을 확인했다.
- [ ] 실패 로그와 rate limit 이상 징후를 확인했다.

장애 시:
- [ ] 재고/발주 쓰기 장애면 우선 쓰기 작업을 멈추고 현재 DB snapshot을 보존한다.
- [ ] clinic 격리 의심이면 즉시 배포를 롤백하고 Supabase key/token을 점검한다.
- [ ] 자동주문 중복 의심이면 worker를 중지하고 `order_jobs`와 도매몰 주문번호를 대조한다.
- [ ] 민감정보 노출 의심이면 로그 보관 위치를 격리하고 관련 secret을 교체한다.

## 관리자가 매주 볼 지표

- [ ] 실패한 재고/발주/배송 작업 수
- [ ] 자동 재시도 후 성공한 작업 수
- [ ] 보류 상태로 24시간 이상 남은 발주 수
- [ ] 부족 재고인데 발주 요청이 없는 품목 수
- [ ] 마지막 백업 시각과 마지막 복구 리허설 일자
- [ ] audit log가 남지 않은 쓰기 작업 여부
