# DentalStock Backend Data Schema

작성일: 2026-05-20

## 목표

현재 PWA의 `localStorage` 데이터를 Firebase/백엔드로 옮길 때 유지할 도메인 계약을 정의한다. 핵심 원칙은 세 가지다.

- 모든 업무 데이터는 `clinicId` 아래에 격리한다.
- 도매몰 비밀번호와 세션성 데이터는 클라이언트 문서에 저장하지 않는다.
- 자동 주문은 항상 승인 이벤트 이후에만 실행한다.

## 현재 백엔드 골격

`server/`에는 자동화 서버의 첫 골격이 있다.

- `GET /health`: 서버 상태 확인
- `GET /api/orders`: clinicId 범위 주문 목록 stub
- `POST /api/orders/:orderId/approve`: 승인 작업 queue stub
- `POST /api/tracking/refresh`: 배송 추적 provider stub
- `GET /api/vendor-credentials/:vendorId/status`: 도매 계정 연결 상태 stub
- `POST /api/vendor-credentials/:vendorId`: 내부 토큰이 없으면 기본 비활성화

실제 운영 전에는 이 골격 위에 영속 DB, 인증, 암호화 credential store, 외부 배송 API를 붙인다.

## Backend Repository 경계

운영 DB 전환은 앱/라우트가 Firestore SDK나 SQL client를 직접 호출하지 않고 repository 인터페이스를 통해 붙인다. 현재 서버 골격에는 테스트용 메모리 저장소를 두고, 실제 Firestore/Postgres 구현은 `server/storage/repositoryContract.js`와 `server/__tests__/storageRepositoryContract.test.js`의 같은 메서드/동작 계약을 지키도록 교체한다.

```js
repository.auditLogs.create(entry)
repository.auditLogs.listByClinic({ clinicId, limit })

repository.orderJobs.enqueue(job)
repository.orderJobs.listQueued({ clinicId, limit })
repository.orderJobs.markRunning({ jobId, startedAt })
repository.orderJobs.markComplete({ jobId, completedAt, result })
repository.orderJobs.markFailed({ jobId, failedAt, error })

repository.items.upsert(item)
repository.items.getById({ clinicId, itemId })
repository.items.listByClinic({ clinicId, limit })
repository.items.applyQuantityDelta({ clinicId, itemId, delta, updatedAt })

repository.orders.create(order)
repository.orders.getById({ clinicId, orderId })
repository.orders.listByClinic({ clinicId, status, limit })
repository.orders.updateStatus({ clinicId, orderId, status, updatedAt, ...patch })
```

`auditLogs`는 append-only다. repository와 service에는 `update`/`delete` 메서드를 만들지 않는다. 정정이 필요하면 기존 로그 수정이 아니라 새 보정 이벤트를 추가한다.

모든 repository 메서드는 `clinicId` 범위를 지켜야 하며, 반환 객체는 호출자가 수정해도 저장된 값이 바뀌지 않는 복사본이어야 한다. `items.applyQuantityDelta()`와 `orders.updateStatus()`는 운영 DB에서 단일 문서 atomic update 또는 transaction으로 구현한다. 찾을 수 없는 대상은 `null`을 반환하고, list 메서드는 기본 `limit = 100`을 적용한다.

## Collection 구조

```txt
clinics/{clinicId}
  users/{userId}
  items/{itemId}
  txs/{txId}
  orders/{orderId}
  surgeries/{surgeryId}
  notifs/{notifId}
  settings/app
  vendorCredentials/{vendorId}        server-only
  auditLogs/{auditId}                 append-only
```

## 공통 필드

모든 clinic 하위 문서는 다음 메타 필드를 갖는다.

| 필드 | 설명 |
|---|---|
| `clinicId` | 상위 clinic id와 동일해야 한다 |
| `createdAt` | 서버 타임스탬프 |
| `updatedAt` | 서버 타임스탬프 |
| `createdBy` | 사용자 id |
| `updatedBy` | 사용자 id |

## 주요 문서

### `users/{userId}`

```js
{
  clinicId,
  name,
  role: "owner" | "manager" | "hygienist",
  pinHash,
  active,
}
```

보안:
- PIN 원문 저장 금지.
- `owner`, `manager`만 사용자 활성/비활성 변경 가능.
- 본인 프로필 읽기는 허용하되 다른 사용자 목록은 병원 내부 사용자에게만 허용.

### `items/{itemId}`

```js
{
  clinicId,
  name,
  categoryId,
  unit,
  currentQty,
  minQty,
  location,
  expiry,
  autoOrderEnabled,
  preferredVendorId,
}
```

보안:
- 읽기: clinic 소속 사용자.
- 쓰기: `owner`, `manager`.
- 입출고로 인한 수량 변경은 `txs` 생성과 같은 트랜잭션에서 처리한다.

### `txs/{txId}`

```js
{
  clinicId,
  itemId,
  type: "in" | "out" | "adjust",
  qty,
  note,
  userId,
  userNameSnapshot,
  createdAt,
}
```

보안:
- append-only를 기본으로 한다.
- 정정은 기존 로그 삭제가 아니라 `adjust` 이벤트를 추가한다.

### `orders/{orderId}`

```js
{
  clinicId,
  itemId,
  qty,
  note,
  requestedBy,
  requestedAt,
  status: "pending" | "ordered" | "received" | "rejected" | "failed",
  reviewedBy,
  reviewedAt,
  reviewNote,
  vendorId,
  vendorOrderNo,
  carrier,
  trackingNumber,
  shippingEvents: [
    { status, timestamp, location, completed }
  ],
  receivedAt,
}
```

보안:
- 위생사는 본인이 요청한 주문 또는 clinic 정책상 공개된 주문만 읽는다.
- `approve/reject/startTracking/confirmReceipt`는 `owner`, `manager`만 가능.
- 자동 주문 워커는 `status === "ordered"`이며 승인자가 있는 주문만 실행한다.

### `surgeries/{surgeryId}`

```js
{
  clinicId,
  title,
  patientDisplayName,
  patientRef,
  type,
  scheduledDate,
  scheduledTime,
  note,
  requiredItems: [{ itemId, qty }],
  prepConfirmed,
  preparedBy,
  preparedAt,
}
```

보안:
- 환자명은 개인정보다. 외부 연동 전까지는 표시명만 저장하고, EMR 연동 시 `patientRef`로 전환한다.
- 로그/알림에는 환자명을 불필요하게 반복 저장하지 않는다.

### `settings/app`

```js
{
  clinicId,
  vendors: [
    { id, name, connected, automaticOrdering }
  ],
  preferredVendor,
  maxOrderAmount,
}
```

보안:
- 도매몰 `username/password`는 이 문서에 저장하지 않는다.
- 클라이언트가 읽어도 되는 설정만 둔다.

### `vendorCredentials/{vendorId}` server-only

```js
{
  clinicId,
  vendorId,
  usernameCiphertext,
  passwordCiphertext,
  nonce,
  tag,
  keyVersion,
  updatedBy,
  updatedAt,
}
```

보안:
- 클라이언트 직접 읽기 금지.
- Cloud Function 또는 별도 백엔드만 접근.
- AES-256-GCM + KMS/Secret Manager 키 버전으로 암호화한다.
- 로그에 username/password 원문 금지.

### `auditLogs/{auditId}` append-only

```js
{
  clinicId,
  action,
  entity,
  entityId,
  actor: {
    userId,
    role,
  },
  metadata,
  requestId,
  createdAt,
}
```

보안:
- create-only. 수정/삭제는 API, repository, DB rules 어디에도 열지 않는다.
- `password/token/session/cookie/pin/card/credential` 계열 metadata key는 저장 전에 마스킹한다.
- 환자명, 도매몰 계정, provider secret은 metadata에 저장하지 않는다.
- 읽기는 `owner`, `manager`로 제한한다.

### `orderJobs/{jobId}` server-only queue

```js
{
  clinicId,
  orderId,
  vendorId,
  requestedBy,
  approvedBy,
  approvedAt,
  maxOrderAmount,
  status: "queued" | "running" | "completed" | "failed",
  attempts,
  lastErrorCode,
  createdAt,
  updatedAt,
}
```

보안:
- 승인 API만 생성한다.
- job payload에는 도매몰 username/password, 세션 쿠키, 카드번호를 넣지 않는다.
- worker는 실행 직전 서버 전용 credential store에서 계정을 읽는다.
- 주문 금액 한도는 worker/API에서 다시 검증한다.

## Firestore Rules 초안

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function sameClinic(clinicId) {
      return signedIn() && request.auth.token.clinicId == clinicId;
    }

    function role() {
      return request.auth.token.role;
    }

    function canManage() {
      return role() in ['owner', 'manager'];
    }

    match /clinics/{clinicId}/{document=**} {
      allow read: if sameClinic(clinicId);
      allow write: if false;
    }

    match /clinics/{clinicId}/items/{itemId} {
      allow read: if sameClinic(clinicId);
      allow create, update: if sameClinic(clinicId) && canManage();
      allow delete: if false;
    }

    match /clinics/{clinicId}/txs/{txId} {
      allow read: if sameClinic(clinicId);
      allow create: if sameClinic(clinicId);
      allow update, delete: if false;
    }

    match /clinics/{clinicId}/orders/{orderId} {
      allow read: if sameClinic(clinicId);
      allow create: if sameClinic(clinicId);
      allow update: if sameClinic(clinicId) && canManage();
      allow delete: if false;
    }

    match /clinics/{clinicId}/surgeries/{surgeryId} {
      allow read: if sameClinic(clinicId);
      allow create, update: if sameClinic(clinicId) && canManage();
      allow delete: if sameClinic(clinicId) && canManage();
    }

    match /clinics/{clinicId}/settings/{docId} {
      allow read: if sameClinic(clinicId);
      allow write: if sameClinic(clinicId) && canManage();
    }

    match /clinics/{clinicId}/vendorCredentials/{vendorId} {
      allow read, write: if false;
    }

    match /clinics/{clinicId}/auditLogs/{auditId} {
      allow read: if sameClinic(clinicId) && canManage();
      allow create, update, delete: if false;
    }

    match /clinics/{clinicId}/orderJobs/{jobId} {
      allow read, write: if false;
    }
  }
}
```

## 다음 구현 단위

1. `clinicId`를 local repository key namespace에 추가한다.
2. `settings/app`과 `vendorCredentials`를 UI/저장소 레벨에서 분리했다. 다음 단계는 `vendorCredentials`를 서버 전용 API로 이동하는 것이다.
3. 도매 계정 저장 액션은 클라이언트 저장 대신 `saveVendorCredential()` 서버 함수로 대체한다.
4. `orders` 상태 변경과 입출고/수술 변경을 audit log 이벤트로 남겼고 관리 화면에서 조회할 수 있다.
5. 서버에는 append-only audit log service와 memory repository 골격을 둔다. 다음 단계는 승인 API 트랜잭션에서 audit log create와 order job enqueue를 함께 호출하는 것이다.

## 2026-05-20 구현 반영

- 서버 승인 API는 `owner/manager` 권한 확인 뒤 승인 이벤트를 append-only audit log에 기록하고, 같은 서버 경계에서 `orderJobs.enqueue()`를 호출한다.
- `orderJobs` repository는 `enqueue/listQueued/markRunning/markComplete/markFailed` 계약을 갖는다.
- 도매몰 credential 저장은 `DENTALSTOCK_INTERNAL_ADMIN_TOKEN`과 `DENTALSTOCK_CREDENTIAL_ENCRYPTION_KEY`가 모두 있어야 `mode: encrypted`로 동작한다.
- credential store는 AES-256-GCM 암호화 record만 저장하며, status/upsert 응답에는 `username/password` 원문을 반환하지 않는다.
- 배송 추적은 provider 경계로 분리했다. 기본 `demo` provider는 결정론적 이벤트를 반환하고, `external` provider는 실제 client가 없으면 `tracking_provider_not_configured`로 실패한다.
- tracking 응답과 order action 응답은 전체 송장번호를 반환하지 않고 last4만 노출한다.

## 운영 전환 준비 반영

- DB adapter가 구현해야 할 `auditLogs`, `orderJobs`, `items`, `orders` repository 계약을 `server/storage/repositoryContract.js`로 고정했다.
- memory repository는 운영 DB 대체물이 아니라 contract 검증용이며, 실제 DB adapter는 같은 메서드 계약을 구현해야 한다.
- 서버 인증은 `test-header` 모드와 production bearer provider 모드를 분리했다. 운영에서는 `Authorization: Bearer ...`를 auth provider interface로 검증해야 한다.
- 현재 production 기본 provider는 의도적으로 미설정 상태이며, Firebase/Auth0 같은 실제 provider가 들어오기 전에는 anonymous context로만 동작한다.
- 외부 배송 API 연결은 HTTPS endpoint와 API key를 가진 HTTP client 경계로 준비했다. provider 응답에서 token, 전체 송장번호 등 허용되지 않은 필드는 서비스 응답으로 통과하지 않는다.
- 자동주문 worker는 `createOrderJobRunner()` 경계로 준비했다. approved queued job만 실행하고, credential은 `credentialService.getForWorker()`로만 읽으며, provider 결과/실패 로그는 저장 전 마스킹한다.
