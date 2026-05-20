# DentalStock Worker Boundary

이 디렉터리는 운영 백엔드 전환 시 자동주문과 배송추적 작업을 처리할 worker 경계를 정의한다. 지금 단계에서는 실제 도매몰 로그인, Playwright 실행, 외부 배송 API 호출을 구현하지 않는다. 안전한 queue 계약과 금지사항을 먼저 고정한다.

## Order Worker Contract

입력 job은 서버 승인 로직에서만 생성한다.

```js
{
  jobId,
  clinicId,
  orderId,
  vendorId,
  requestedBy,
  approvedBy,
  approvedAt,
  maxOrderAmount,
  createdAt,
  status: "queued"
}
```

worker는 다음 조건을 만족한 job만 처리한다.

- `clinicId`, `orderId`, `vendorId`가 있다.
- `approvedBy`와 `approvedAt`이 있다.
- 주문 문서 상태가 `ordered` 또는 운영에서 합의한 승인 완료 상태다.
- 도매몰 credential은 server-only credential store에서 읽고, job payload와 audit log에는 원문을 넣지 않는다.
- 주문 금액 한도는 UI가 아니라 worker/API에서 다시 검증한다.

현재 구현 경계는 `createOrderJobRunner()`가 담당한다.

- runner는 `orderJobStore`, `auditLogService`, `credentialService`, `orderProvider`를 주입받는다.
- `status: "queued"`, `approvedBy`, `approvedAt`, `clinicId`, `orderId`, `vendorId`가 없는 job은 credential/provider 호출 전에 거부한다.
- `credentialService.getForWorker({ clinicId, vendorId, purpose: "order.worker" })`만 credential 읽기 경로로 사용한다.
- `orderProvider.submitOrder({ job, credentials })`는 provider interface이며, 실제 Playwright/도매몰 접속 구현은 아직 두지 않는다.
- provider 결과와 실패 metadata는 worker 저장/audit 전에 credential, token, cookie, card, PIN 계열 키워드를 마스킹한다.

## Tracking Provider Contract

배송추적 provider는 `refresh({ carrier, trackingNumber, currentStatuses })` 인터페이스를 유지한다.

- 응답에는 전체 송장번호를 반환하지 않고 last4 또는 내부 order id만 둔다.
- provider API key는 환경변수 또는 Secret Manager에서만 읽는다.
- 실패 시 외부 API 원문 에러를 사용자 응답/audit metadata에 그대로 저장하지 않는다.

## Audit Boundary

worker는 상태 전이를 만들 때마다 append-only audit log를 생성한다.

- `order.worker.started`
- `order.worker.completed`
- `order.worker.failed`
- `tracking.refreshed`

audit log에는 비밀번호, 세션 쿠키, 카드번호, PIN, provider token을 저장하지 않는다.

## 다음 구현 TODO

1. 완료: memory repository에 `orderJobs.enqueue/listQueued/markRunning/markComplete/markFailed` 계약을 추가했다.
2. 완료: 승인 API에서 audit log 생성과 `orderJobs.enqueue()`를 같은 서버 경계로 묶었다.
3. 다음: 실제 DB repository에서는 주문 상태 변경, audit log create, job enqueue를 DB 트랜잭션으로 묶는다.
4. 다음: worker process는 queue polling 대신 managed queue 또는 Firestore trigger로 시작한다.
5. 다음: Playwright 실행 환경은 clinic/vendor별 세션을 격리하고, 실패 스크린샷에는 개인정보/credential이 남지 않게 마스킹한다.
